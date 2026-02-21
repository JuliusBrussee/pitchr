'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = 2048;

function getWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const base = process.env.NEXT_PUBLIC_WS_URL;
  if (base) {
    const url = base.replace(/^http/, 'ws');
    return url.endsWith('/ws') ? url : `${url.replace(/\/$/, '')}/ws`;
  }
  // When Next runs on :3000 and STT server on :3001 (npm run dev), connect to backend
  const host = window.location.hostname;
  const port = window.location.port;
  if (host === 'localhost' && port === '3000') {
    return 'ws://localhost:3001/ws';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

function resampleTo16k(float32Mono: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === TARGET_SAMPLE_RATE) return float32Mono;
  const inLen = float32Mono.length;
  const outLen = Math.round((inLen * TARGET_SAMPLE_RATE) / inputSampleRate);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = (i * inputSampleRate) / TARGET_SAMPLE_RATE;
    const j = Math.floor(srcIdx);
    const frac = srcIdx - j;
    const a = float32Mono[j] ?? 0;
    const b = float32Mono[Math.min(j + 1, inLen - 1)] ?? 0;
    out[i] = a + frac * (b - a);
  }
  return out;
}

function floatTo16BitPcm(float32Array: Float32Array): Int16Array {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function base64FromInt16(int16Array: Int16Array): string {
  const uint8 = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
  return btoa(binary);
}

export interface UseSTTReturn {
  isRecording: boolean;
  start: () => Promise<void>;
  stop: () => void;
  liveText: string;
  transcriptSegments: string[];
  saved: boolean;
  error: string | null;
}

export function useSTT(): UseSTTReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [transcriptSegments, setTranscriptSegments] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const sendChunk = useCallback((base64: string, commit: boolean) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        message_type: 'input_audio_chunk',
        audio_base_64: base64,
        commit: !!commit,
        sample_rate: TARGET_SAMPLE_RATE,
      })
    );
  }, []);

  const stopMic = useCallback(() => {
    if (processorRef.current && sourceRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (_) {}
      processorRef.current = null;
      try {
        sourceRef.current.disconnect();
      } catch (_) {}
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    stopMic();
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop' }));
      // Keep socket open so server can receive final commit and send "saved"
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      }, 6000);
    } else if (ws) {
      ws.close();
      wsRef.current = null;
    }
    setIsRecording(false);
    setLiveText('');
  }, [stopMic]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const start = useCallback(async () => {
    setError(null);
    setSaved(false);
    setFeedbackText(null);
    setFeedbackError(null);
    setTranscriptSegments([]);
    setLiveText('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microphone access denied or not supported.');
      return;
    }

    const wsUrl = getWsUrl();
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'WebSocket error');
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    wsRef.current = ws;

    let opened = false;
    ws.onerror = () => setError('WebSocket error.');
    ws.onclose = () => {
      stopMic();
      wsRef.current = null;
      setIsRecording(false);
      setLiveText('');
      if (!opened) {
        setError('Could not connect to transcript server. Run "npm run dev" (both Next and server) or start the server on port 3001.');
      }
    };
    ws.onopen = () => {
      opened = true;
      setIsRecording(true);
      const stream = streamRef.current;
      if (!stream) return;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = ctx;
      const sampleRate = ctx.sampleRate;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      let buffer = new Float32Array(0);
      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const input = e.inputBuffer.getChannelData(0);
        const mono = input.length === 0 ? new Float32Array(0) : input;
        const resampled = resampleTo16k(mono, sampleRate);
        const totalLen = buffer.length + resampled.length;
        const newBuffer = new Float32Array(totalLen);
        newBuffer.set(buffer);
        newBuffer.set(resampled, buffer.length);
        buffer = newBuffer;

        while (buffer.length >= CHUNK_SAMPLES) {
          const chunk = buffer.slice(0, CHUNK_SAMPLES);
          buffer = buffer.slice(CHUNK_SAMPLES);
          const int16 = floatTo16BitPcm(chunk);
          const b64 = base64FromInt16(int16);
          sendChunk(b64, false);
        }
      };

      source.connect(processor);
      const silentGain = ctx.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);
    };

    ws.onmessage = (event: MessageEvent) => {
      let msg: { type?: string; message_type?: string; text?: string; error?: string; feedbackText?: string; feedbackError?: string; base64?: string };
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }
      if (msg.type === 'saved') {
        setSaved(true);
        setFeedbackText((msg as { feedbackText?: string }).feedbackText ?? null);
        setFeedbackError((msg as { feedbackError?: string }).feedbackError ?? null);
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        return;
      }
      if (msg.type === 'feedback_audio' && typeof (msg as { base64?: string }).base64 === 'string') {
        try {
          const binary = atob((msg as { base64: string }).base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => URL.revokeObjectURL(url);
          audio.onerror = () => URL.revokeObjectURL(url);
          audio.play().catch(() => URL.revokeObjectURL(url));
        } catch (_) {}
        return;
      }
      if (msg.type === 'error') {
        setError(msg.error ?? 'Error');
        return;
      }
      const type = msg.message_type;
      if (type === 'partial_transcript' && msg.text != null) {
        setLiveText(msg.text);
        return;
      }
      if (type === 'committed_transcript_with_timestamps' && msg.text != null) {
        setTranscriptSegments((prev) => [...prev, msg.text!]);
        setLiveText('');
        return;
      }
      if (type === 'error' || type === 'auth_error' || (type && type.endsWith('_error'))) {
        setError('Transcription error: ' + (msg.error ?? type));
      }
    };
  }, [sendChunk, stopMic]);

  return {
    isRecording,
    start,
    stop,
    liveText,
    transcriptSegments,
    saved,
    error,
    feedbackText,
    feedbackError,
  };
}
