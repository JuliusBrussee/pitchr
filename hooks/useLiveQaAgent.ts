'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { QATurn, QATurnSpeaker } from '@/types/qna';

type LiveQaStatus = 'idle' | 'connecting' | 'active' | 'completed' | 'expired' | 'error';
type CloseIntent = 'none' | 'completed' | 'expired' | 'failed';

interface UseLiveQaAgentInput {
  signedUrl: string | null;
  starterContext: string;
  durationLimitSeconds?: number;
}

interface LatencyStats {
  latestMs: number;
  p50Ms: number;
  p95Ms: number;
}

export interface LiveQaDiagnostics {
  wsOpened: boolean;
  wsCloseCode: number | null;
  wsCloseReason: string | null;
  wsErrorCount: number;
}

interface UseLiveQaAgentResult {
  status: LiveQaStatus;
  isActive: boolean;
  turns: QATurn[];
  elapsedSeconds: number;
  remainingSeconds: number;
  latency: LatencyStats;
  diagnostics: LiveQaDiagnostics;
  error: string | null;
  startSession: () => Promise<void>;
  stopSession: (reason?: 'completed' | 'expired' | 'failed') => void;
}

const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = 2048;

function percentile(values: number[], target: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * target)));
  return sorted[index];
}

function floatTo16BitPcm(float32Array: Float32Array): Int16Array {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return int16;
}

function resampleTo16k(float32Mono: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) return float32Mono;
  const inLen = float32Mono.length;
  const outLen = Math.round((inLen * TARGET_SAMPLE_RATE) / inputSampleRate);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i += 1) {
    const sourceIndex = (i * inputSampleRate) / TARGET_SAMPLE_RATE;
    const low = Math.floor(sourceIndex);
    const high = Math.min(low + 1, inLen - 1);
    const mix = sourceIndex - low;
    out[i] = (float32Mono[low] ?? 0) * (1 - mix) + (float32Mono[high] ?? 0) * mix;
  }
  return out;
}

function base64FromInt16(int16Array: Int16Array): string {
  const uint8 = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < uint8.length; i += 1) binary += String.fromCharCode(uint8[i]);
  return btoa(binary);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function appendTurn(
  turns: QATurn[],
  speaker: QATurnSpeaker,
  text: string,
): QATurn[] {
  const trimmed = text.trim();
  if (!trimmed) return turns;
  const previous = turns[turns.length - 1];
  if (previous && previous.speaker === speaker && previous.text === trimmed) return turns;
  return [
    ...turns,
    {
      id: crypto.randomUUID(),
      speaker,
      text: trimmed,
      created_at: new Date().toISOString(),
    },
  ];
}

function formatCloseMessage(code: number, reason: string | null): string {
  const reasonSuffix = reason && reason.length > 0 ? `: ${reason}` : '';
  return `Live QA websocket closed unexpectedly (code ${code})${reasonSuffix}.`;
}

/** Decode base64 PCM16 to Float32 samples for Web Audio playback. */
function decodeBase64Pcm16(base64: string): Float32Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i += 1) {
    float32[i] = int16[i] / 0x8000;
  }
  return float32;
}

export function useLiveQaAgent({
  signedUrl,
  starterContext,
  durationLimitSeconds = 60,
}: UseLiveQaAgentInput): UseLiveQaAgentResult {
  const [status, setStatus] = useState<LiveQaStatus>('idle');
  const [turns, setTurns] = useState<QATurn[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [latencySamples, setLatencySamples] = useState<number[]>([]);
  const [diagnostics, setDiagnostics] = useState<LiveQaDiagnostics>({
    wsOpened: false,
    wsCloseCode: null,
    wsCloseReason: null,
    wsErrorCount: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<LiveQaStatus>('idle');
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outboundAudioSentAtRef = useRef<number[]>([]);
  const closeIntentRef = useRef<CloseIntent>('none');

  // Audio playback state
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackNextTimeRef = useRef(0);

  const stopPlayback = useCallback(() => {
    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(() => {});
    }
    playbackContextRef.current = null;
    playbackNextTimeRef.current = 0;
  }, []);

  const playAudioChunk = useCallback((base64Audio: string, sampleRate: number) => {
    if (!playbackContextRef.current) {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      playbackContextRef.current = new AudioContextCtor({ sampleRate });
    }
    const ctx = playbackContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const samples = decodeBase64Pcm16(base64Audio);
    if (samples.length === 0) return;

    const buffer = ctx.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(new Float32Array(samples), 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, playbackNextTimeRef.current);
    source.start(startTime);
    playbackNextTimeRef.current = startTime + buffer.duration;
  }, []);

  const stopMic = useCallback(() => {
    if (processorRef.current && sourceRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // noop
      }
      try {
        sourceRef.current.disconnect();
      } catch {
        // noop
      }
    }
    processorRef.current = null;
    sourceRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startedAtRef.current = null;
  }, []);

  const stopSession = useCallback(
    (reason: 'completed' | 'expired' | 'failed' = 'completed') => {
      closeIntentRef.current = reason;
      clearTimer();
      stopMic();
      stopPlayback();
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN && reason !== 'failed') {
        try {
          ws.send(JSON.stringify({ type: 'conversation_end' }));
        } catch {
          // noop
        }
      }
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        try {
          ws.close();
        } catch {
          // noop
        }
      }
      wsRef.current = null;
      if (reason === 'failed') {
        setStatus('error');
      } else {
        setStatus(reason === 'expired' ? 'expired' : 'completed');
      }
    },
    [clearTimer, stopMic, stopPlayback],
  );

  const startMicCapture = useCallback(async () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextCtor();
    audioContextRef.current = context;
    const sampleRate = context.sampleRate;

    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    sourceRef.current = source;
    processorRef.current = processor;

    let buffer = new Float32Array(0);

    processor.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      const input = event.inputBuffer.getChannelData(0);
      const resampled = resampleTo16k(input, sampleRate);
      const total = new Float32Array(buffer.length + resampled.length);
      total.set(buffer);
      total.set(resampled, buffer.length);
      buffer = total;

      while (buffer.length >= CHUNK_SAMPLES) {
        const chunk = buffer.slice(0, CHUNK_SAMPLES);
        buffer = buffer.slice(CHUNK_SAMPLES);
        const pcm = floatTo16BitPcm(chunk);
        const base64 = base64FromInt16(pcm);
        outboundAudioSentAtRef.current.push(Date.now());
        const socket = wsRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          return;
        }
        socket.send(JSON.stringify({ user_audio_chunk: base64 }));
      }
    };

    source.connect(processor);
    const silentGain = context.createGain();
    silentGain.gain.value = 0;
    processor.connect(silentGain);
    silentGain.connect(context.destination);
  }, []);

  const startSession = useCallback(async () => {
    if (!signedUrl) {
      setError('Missing signed URL for live QA session.');
      setStatus('error');
      return;
    }
    if (statusRef.current === 'connecting' || statusRef.current === 'active') {
      return;
    }

    clearTimer();
    stopMic();
    stopPlayback();
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // noop
      }
      wsRef.current = null;
    }
    closeIntentRef.current = 'none';
    outboundAudioSentAtRef.current = [];

    setError(null);
    setTurns([]);
    setElapsedSeconds(0);
    setLatencySamples([]);
    setDiagnostics({
      wsOpened: false,
      wsCloseCode: null,
      wsCloseReason: null,
      wsErrorCount: 0,
    });
    setStatus('connecting');

    let ws: WebSocket;
    try {
      const wsUrl = signedUrl.includes('?')
        ? `${signedUrl}&source=js_sdk&version=0.14.0`
        : `${signedUrl}?source=js_sdk&version=0.14.0`;
      ws = new WebSocket(wsUrl, ['convai']);
    } catch (caughtError) {
      setStatus('error');
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to open websocket.');
      return;
    }
    wsRef.current = ws;

    // Track the output audio format from server metadata.
    let outputSampleRate = TARGET_SAMPLE_RATE;

    ws.onopen = () => {
      setDiagnostics((prev) => ({
        ...prev,
        wsOpened: true,
        wsCloseCode: null,
        wsCloseReason: null,
      }));
      startedAtRef.current = Date.now();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        const startedAt = startedAtRef.current;
        if (startedAt == null) return;
        if (statusRef.current !== 'active') return;

        const elapsed = (Date.now() - startedAt) / 1000;
        setElapsedSeconds(elapsed);
        if (elapsed >= durationLimitSeconds) {
          stopSession('expired');
        }
      }, 200);

      const initPayload = {
        type: 'conversation_initiation_client_data',
        dynamic_variables: {
          context: starterContext,
        },
      };
      console.log('[LiveQA] WS sending init:', JSON.stringify(initPayload).slice(0, 300));
      ws.send(JSON.stringify(initPayload));
      // Mic capture starts after receiving conversation_initiation_metadata (see onmessage).
    };

    let micStarted = false;

    ws.onmessage = (event: MessageEvent) => {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(String(event.data)) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = typeof payload.type === 'string' ? payload.type.toLowerCase() : '';

      // Wait for server to confirm session before streaming audio.
      if (type === 'conversation_initiation_metadata' && !micStarted) {
        micStarted = true;
        // Parse output audio format (e.g. "pcm_16000").
        const metaEvent = asRecord(payload.conversation_initiation_metadata_event);
        const outputFormat = asNonEmptyString(
          metaEvent?.agent_output_audio_format,
        );
        if (outputFormat) {
          const parts = outputFormat.split('_');
          const rate = Number(parts[parts.length - 1]);
          if (!Number.isNaN(rate) && rate > 0) {
            outputSampleRate = rate;
          }
        }
        console.log('[LiveQA] Session confirmed, output sample rate:', outputSampleRate);
        void startMicCapture()
          .then(() => {
            setStatus('active');
          })
          .catch((caughtError) => {
            closeIntentRef.current = 'failed';
            setStatus('error');
            setError(
              caughtError instanceof Error ? caughtError.message : 'Microphone capture failed.',
            );
            stopSession('failed');
          });
        return;
      }

      // Respond to server pings with pong (including event_id as-is).
      if (type === 'ping') {
        const pingEvent = asRecord(payload.ping_event);
        const eventId = pingEvent?.event_id;
        const socket = wsRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
          const pongPayload = eventId != null
            ? { type: 'pong', event_id: eventId }
            : { type: 'pong' };
          socket.send(JSON.stringify(pongPayload));
        }
        return;
      }

      // Play agent audio.
      if (type === 'audio' || payload.audio_base_64 || payload.audio_event) {
        const audioEvent = asRecord(payload.audio_event);
        const audioBase64 = asNonEmptyString(payload.audio_base_64)
          ?? asNonEmptyString(audioEvent?.audio_base_64)
          ?? asNonEmptyString(payload.audio);
        if (audioBase64) {
          playAudioChunk(audioBase64, outputSampleRate);
        } else {
          console.log('[LiveQA] Audio event but no base64 data:', Object.keys(payload));
        }
        return;
      }

      // Agent response text — add as investor turn.
      if (type === 'agent_response') {
        const agentText = asNonEmptyString(payload.agent_response)
          ?? asNonEmptyString(
            (asRecord(payload.agent_response_event) ?? {}).agent_response as string | undefined,
          );
        if (agentText) {
          setTurns((prev) => appendTurn(prev, 'investor', agentText));
          if (outboundAudioSentAtRef.current.length > 0) {
            const sentAt = outboundAudioSentAtRef.current.shift() ?? Date.now();
            const latency = Math.max(0, Date.now() - sentAt);
            setLatencySamples((prev) => [...prev, latency].slice(-200));
          }
        }
        return;
      }

      // User transcript — add as founder turn.
      if (type === 'user_transcript') {
        const userText = asNonEmptyString(payload.user_transcript)
          ?? asNonEmptyString(
            (asRecord(payload.user_transcription_event) ?? {}).user_transcript as string | undefined,
          );
        if (userText) {
          setTurns((prev) => appendTurn(prev, 'founder', userText));
        }
        return;
      }

      // Log unhandled event types so we can see what's coming through.
      console.log('[LiveQA] Unhandled event type:', type, Object.keys(payload));
    };

    ws.onerror = () => {
      closeIntentRef.current = 'failed';
      setDiagnostics((prev) => ({
        ...prev,
        wsErrorCount: prev.wsErrorCount + 1,
      }));
      setStatus('error');
      setError('Live QA websocket error. Check close code/reason below.');
    };

    ws.onclose = (closeEvent: CloseEvent) => {
      const closeCode = closeEvent.code;
      const closeReason = closeEvent.reason?.trim() || null;
      setDiagnostics((prev) => ({
        ...prev,
        wsCloseCode: closeCode,
        wsCloseReason: closeReason,
      }));

      clearTimer();
      stopMic();
      stopPlayback();
      outboundAudioSentAtRef.current = [];
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      const closeIntent = closeIntentRef.current;
      if (closeIntent === 'completed') {
        setStatus('completed');
        return;
      }
      if (closeIntent === 'expired') {
        setStatus('expired');
        return;
      }
      if (closeIntent === 'failed') {
        setStatus('error');
        setError((prev) => prev ?? formatCloseMessage(closeCode, closeReason));
        return;
      }

      // Server closed the connection with 1000 = normal end of conversation.
      if (closeCode === 1000) {
        setStatus('completed');
        return;
      }

      const currentStatus = statusRef.current;
      if (currentStatus === 'active' || currentStatus === 'connecting') {
        setStatus('error');
        setError((prev) => prev ?? formatCloseMessage(closeCode, closeReason));
      }
    };
  }, [clearTimer, durationLimitSeconds, playAudioChunk, signedUrl, startMicCapture, starterContext, stopMic, stopPlayback, stopSession]);

  useEffect(() => {
    if (statusRef.current === 'active' || statusRef.current === 'connecting') return;
    closeIntentRef.current = 'none';
    setStatus('idle');
    setError(null);
    setTurns([]);
    setElapsedSeconds(0);
    setLatencySamples([]);
    setDiagnostics({
      wsOpened: false,
      wsCloseCode: null,
      wsCloseReason: null,
      wsErrorCount: 0,
    });
  }, [signedUrl]);

  useEffect(() => {
    return () => {
      closeIntentRef.current = 'completed';
      clearTimer();
      stopMic();
      stopPlayback();
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        try {
          ws.close();
        } catch {
          // noop
        }
      }
    };
  }, [clearTimer, stopMic, stopPlayback]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const latency = useMemo<LatencyStats>(() => {
    const latest = latencySamples[latencySamples.length - 1] ?? 0;
    return {
      latestMs: latest,
      p50Ms: percentile(latencySamples, 0.5),
      p95Ms: percentile(latencySamples, 0.95),
    };
  }, [latencySamples]);

  const remainingSeconds = Math.max(0, Math.round(durationLimitSeconds - elapsedSeconds));

  return {
    status,
    isActive: status === 'active',
    turns,
    elapsedSeconds: Math.round(elapsedSeconds),
    remainingSeconds,
    latency,
    diagnostics,
    error,
    startSession,
    stopSession,
  };
}
