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

function parseLiveTextEvent(payload: Record<string, unknown>): {
  speaker: QATurnSpeaker;
  text: string;
} | null {
  const agentResponseEvent = asRecord(payload.agent_response_event);
  const userTranscriptionEvent = asRecord(payload.user_transcription_event);
  const nestedAgentText = asNonEmptyString(agentResponseEvent?.agent_response);
  if (nestedAgentText) {
    return { speaker: 'investor', text: nestedAgentText };
  }
  const nestedUserText = asNonEmptyString(userTranscriptionEvent?.user_transcript);
  if (nestedUserText) {
    return { speaker: 'founder', text: nestedUserText };
  }

  const type = typeof payload.type === 'string' ? payload.type.toLowerCase() : '';
  const text = asNonEmptyString(payload.text) ?? '';

  if (!type && !text) return null;

  if (
    type.includes('agent') ||
    type.includes('assistant') ||
    typeof (payload.agent_text as string | undefined) === 'string'
  ) {
    const resolvedText = text || asNonEmptyString(payload.agent_text) || asNonEmptyString(payload.agent_response);
    if (!resolvedText) return null;
    return { speaker: 'investor', text: resolvedText };
  }

  if (
    type.includes('user') ||
    type.includes('transcript') ||
    typeof (payload.user_text as string | undefined) === 'string'
  ) {
    const resolvedText =
      text ||
      asNonEmptyString(payload.user_text) ||
      asNonEmptyString(payload.transcript);
    if (!resolvedText) return null;
    return { speaker: 'founder', text: resolvedText };
  }

  return null;
}

function parsePingEventId(payload: Record<string, unknown>): string | null {
  const pingEvent = asRecord(payload.ping_event);
  return asNonEmptyString(pingEvent?.event_id) || asNonEmptyString(payload.event_id);
}

function formatCloseMessage(code: number, reason: string | null): string {
  const reasonSuffix = reason && reason.length > 0 ? `: ${reason}` : '';
  return `Live QA websocket closed unexpectedly (code ${code})${reasonSuffix}.`;
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
    [clearTimer, stopMic],
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
        try {
          // Preferred ConvAI payload format.
          socket.send(JSON.stringify({ user_audio_chunk: base64 }));
        } catch {
          // Legacy fallback payload format for compatibility.
          socket.send(
            JSON.stringify({
              type: 'user_audio_chunk',
              audio_base_64: base64,
              sample_rate: TARGET_SAMPLE_RATE,
            }),
          );
        }
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
      ws = new WebSocket(signedUrl);
    } catch (caughtError) {
      setStatus('error');
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to open websocket.');
      return;
    }
    wsRef.current = ws;

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

      ws.send(
        JSON.stringify({
          type: 'conversation_initiation_client_data',
          conversation_initiation_client_data: {
            context: starterContext,
          },
        }),
      );
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
    };

    ws.onmessage = (event: MessageEvent) => {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(String(event.data)) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = typeof payload.type === 'string' ? payload.type.toLowerCase() : '';
      if (type === 'ping') {
        const eventId = parsePingEventId(payload);
        const socket = wsRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify(
              eventId
                ? { type: 'pong', event_id: eventId }
                : { type: 'pong' },
            ),
          );
        }
        return;
      }

      const parsed = parseLiveTextEvent(payload);
      if (parsed) {
        setTurns((prev) => appendTurn(prev, parsed.speaker, parsed.text));
        if (parsed.speaker === 'investor' && outboundAudioSentAtRef.current.length > 0) {
          const sentAt = outboundAudioSentAtRef.current.shift() ?? Date.now();
          const latency = Math.max(0, Date.now() - sentAt);
          setLatencySamples((prev) => [...prev, latency].slice(-200));
        }
      }
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

      const currentStatus = statusRef.current;
      if (currentStatus === 'active' || currentStatus === 'connecting') {
        setStatus('error');
        setError((prev) => prev ?? formatCloseMessage(closeCode, closeReason));
      }
    };
  }, [clearTimer, durationLimitSeconds, signedUrl, startMicCapture, starterContext, stopMic, stopSession]);

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
  }, [clearTimer, stopMic]);

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
