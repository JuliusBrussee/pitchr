'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createInitialChecklistState } from '@/config/realtimeChecklist';
import type {
  RealtimeChecklistErrorMessage,
  RealtimeChecklistUpdateMessage,
  RealtimeChecklistItemState,
} from '@/types/checklist';
import type { TranscriptSegment } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = 2048;

function getWsUrl(): string {
  if (typeof window === 'undefined') return '';
  const base = process.env.NEXT_PUBLIC_WS_URL;
  if (base) {
    const url = base.replace(/^http/, 'ws');
    return url.endsWith('/ws') ? url : `${url.replace(/\/$/, '')}/ws`;
  }
  // When Next runs on :3000 and STT server on :3001 (yarn dev), connect to backend
  const host = window.location.hostname;
  const port = window.location.port;
  if (host === 'localhost' && port === '3000') {
    return 'ws://localhost:3001/ws';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const base = process.env.NEXT_PUBLIC_WS_URL;
  if (base) {
    return base.replace(/\/ws\/?$/, '').replace(/^ws/, 'http');
  }
  const host = window.location.hostname;
  const port = window.location.port;
  if (host === 'localhost' && port === '3000') return 'http://localhost:3001';
  return `${window.location.protocol}//${window.location.host}`;
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

interface StartOptions {
  resume?: boolean;
  mode?: PitchMode;
}

interface RealtimeSttMessage {
  type?: string;
  message_type?: string;
  text?: string;
  words?: Array<{ text?: string; start?: number; end?: number }>;
  error?: string;
  feedbackQuestion?: string;
  feedbackAnswer?: string;
  feedbackError?: string;
  base64?: string;
}

function buildSyntheticWords(
  text: string,
  start: number,
  end: number,
): TranscriptSegment['words'] {
  const tokens = text.split(/\s+/u).filter(Boolean);
  if (tokens.length === 0) return [];
  const duration = Math.max(0.2, end - start);
  const step = duration / tokens.length;
  return tokens.map((token, index) => {
    const tokenStart = start + index * step;
    const tokenEnd = Math.min(end, tokenStart + step * 0.9);
    return {
      text: token,
      start: Number(tokenStart.toFixed(3)),
      end: Number(tokenEnd.toFixed(3)),
    };
  });
}

function buildCommittedSegment(
  message: RealtimeSttMessage,
  previous: TranscriptSegment[],
): TranscriptSegment | null {
  const text = message.text?.trim() ?? '';
  if (!text) return null;

  const normalizedWords = (message.words ?? [])
    .map((word) => {
      const wordText = String(word.text ?? '').trim();
      const start = typeof word.start === 'number' ? word.start : Number.NaN;
      const end = typeof word.end === 'number' ? word.end : Number.NaN;
      if (!wordText || !Number.isFinite(start) || !Number.isFinite(end) || end < start) {
        return null;
      }
      return {
        text: wordText,
        start: Number(start.toFixed(3)),
        end: Number(end.toFixed(3)),
      };
    })
    .filter((word): word is TranscriptSegment['words'][number] => Boolean(word));

  if (normalizedWords.length > 0) {
    return {
      text,
      start: normalizedWords[0].start,
      end: normalizedWords[normalizedWords.length - 1].end,
      words: normalizedWords,
    };
  }

  const previousEnd = previous.length > 0 ? previous[previous.length - 1].end : 0;
  const tokens = text.split(/\s+/u).filter(Boolean).length;
  const duration = Math.max(0.25, tokens * 0.33);
  const start = Number(previousEnd.toFixed(3));
  const end = Number((previousEnd + duration).toFixed(3));
  return {
    text,
    start,
    end,
    words: buildSyntheticWords(text, start, end),
  };
}

function isChecklistUpdateMessage(value: unknown): value is RealtimeChecklistUpdateMessage {
  if (!value || typeof value !== 'object') return false;
  const msg = value as Record<string, unknown>;
  return (
    msg.type === 'checklist_update' &&
    typeof msg.mode === 'string' &&
    typeof msg.source === 'string' &&
    Array.isArray(msg.items)
  );
}

function isChecklistErrorMessage(value: unknown): value is RealtimeChecklistErrorMessage {
  if (!value || typeof value !== 'object') return false;
  const msg = value as Record<string, unknown>;
  return msg.type === 'checklist_error' && typeof msg.error === 'string';
}

export interface UseSTTReturn {
  isRecording: boolean;
  start: (options?: StartOptions) => Promise<void>;
  pause: () => void;
  stop: () => void;
  startAnswerRecording: () => void;
  stopAnswerRecording: () => void;
  isAnswerRecording: boolean;
  answerTranscript: string | null;
  liveText: string;
  transcriptSegments: TranscriptSegment[];
  saved: boolean;
  error: string | null;
  feedbackQuestion: string | null;
  feedbackAnswer: string | null;
  feedbackError: string | null;
  coachFeedbackText: string | null;
  hasCoachFeedbackAudio: boolean;
  playCoachFeedbackAudio: () => void;
  realtimeChecklist: RealtimeChecklistItemState[];
  checklistSource: 'llm' | 'heuristic' | null;
  checklistNextHint: string | null;
  checklistError: string | null;
}

export function useSTT(): UseSTTReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackQuestion, setFeedbackQuestion] = useState<string | null>(null);
  const [feedbackAnswer, setFeedbackAnswer] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [answerTranscript, setAnswerTranscript] = useState<string | null>(null);
  const [isAnswerRecording, setIsAnswerRecording] = useState(false);
  const [coachFeedbackText, setCoachFeedbackText] = useState<string | null>(null);
  const [hasCoachFeedbackAudio, setHasCoachFeedbackAudio] = useState(false);
  const coachFeedbackAudioErrorRef = useRef<string | null>(null);
  const coachFeedbackAudioUrlRef = useRef<string | null>(null);
  const [realtimeChecklist, setRealtimeChecklist] = useState<RealtimeChecklistItemState[]>(
    createInitialChecklistState('elevator'),
  );
  const [checklistSource, setChecklistSource] = useState<'llm' | 'heuristic' | null>(
    null,
  );
  const [checklistNextHint, setChecklistNextHint] = useState<string | null>(null);
  const [checklistError, setChecklistError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);
  const answerWsRef = useRef<WebSocket | null>(null);
  const targetWsRef = useRef<WebSocket | null>(null);
  const submittedAnswerRef = useRef<string | null>(null);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const modeRef = useRef<PitchMode>('elevator');

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const sendChunk = useCallback((base64: string, commit: boolean) => {
    const ws = targetWsRef.current;
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

  const startMicCapture = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextCtor();
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
      return true;
    } catch (e) {
      stopMic();
      setError(
        e instanceof Error
          ? e.message
          : 'Microphone access denied or not supported.',
      );
      return false;
    }
  }, [sendChunk, stopMic]);

  const pause = useCallback(() => {
    stopMic();
    setIsRecording(false);
    setLiveText('');
    setSaved(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, [stopMic]);

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
      }, 20000);
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

  const startAnswerRecording = useCallback(() => {
    const wsUrl = getWsUrl();
    if (!wsUrl) {
      setError('WebSocket URL not configured');
      return;
    }
    setAnswerTranscript(null);
    setCoachFeedbackText(null);
    setHasCoachFeedbackAudio(false);
    coachFeedbackAudioErrorRef.current = null;
    submittedAnswerRef.current = null;
    setError(null);
    let answerWs: WebSocket;
    try {
      answerWs = new WebSocket(wsUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'WebSocket error');
      return;
    }
    answerWsRef.current = answerWs;
    answerWs.onopen = () => {
      answerWs.send(JSON.stringify({ type: 'start_answer' }));
      targetWsRef.current = answerWs;
      void startMicCapture().then((micReady) => {
        if (!micReady) {
          answerWs.close();
          answerWsRef.current = null;
          targetWsRef.current = wsRef.current;
          return;
        }
        setIsAnswerRecording(true);
      });
    };
    answerWs.onmessage = (event: MessageEvent) => {
      let msg: { type?: string; text?: string; error?: string };
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }
      if (msg.type === 'answer_transcript') {
        if (answerTimeoutRef.current) {
          clearTimeout(answerTimeoutRef.current);
          answerTimeoutRef.current = null;
        }
        const text = msg.text != null ? String(msg.text).trim() : '';
        setAnswerTranscript(text || null);
        setIsAnswerRecording(false);
        answerWsRef.current = null;
        targetWsRef.current = wsRef.current;
      } else if (msg.type === 'error') {
        if (answerTimeoutRef.current) {
          clearTimeout(answerTimeoutRef.current);
          answerTimeoutRef.current = null;
        }
        setError(msg.error ?? 'Error');
      }
    };
    answerWs.onerror = () => setError('WebSocket error.');
    answerWs.onclose = () => {
      if (answerWsRef.current === answerWs) {
        answerWsRef.current = null;
        targetWsRef.current = wsRef.current;
        setIsAnswerRecording(false);
      }
    };
  }, [startMicCapture]);

  const stopAnswerRecording = useCallback(() => {
    const ws = answerWsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop' }));
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = setTimeout(() => {
        answerTimeoutRef.current = null;
        if (answerWsRef.current) {
          setError('No transcript received. Try speaking and stopping again.');
        }
      }, 6000);
    } else {
      setError('Answer recording not active. Click "Record answer" first.');
    }
    stopMic();
    setIsAnswerRecording(false);
    targetWsRef.current = wsRef.current;
  }, [stopMic]);

  const start = useCallback(async (options?: StartOptions) => {
    const resume = options?.resume === true;
    const mode = options?.mode ?? modeRef.current;
    modeRef.current = mode;
    setError(null);
    setSaved(false);
    setFeedbackQuestion(null);
    setFeedbackAnswer(null);
    setFeedbackError(null);
    setChecklistError(null);
    setChecklistSource(null);
    setLiveText('');
    if (!resume) {
      setTranscriptSegments([]);
      setRealtimeChecklist(createInitialChecklistState(mode));
      setChecklistNextHint(null);
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const existingWs = wsRef.current;
    if (resume && existingWs && existingWs.readyState === WebSocket.OPEN) {
      existingWs.send(
        JSON.stringify({
          type: 'session_config',
          mode: modeRef.current,
        }),
      );
      const micReady = await startMicCapture();
      if (micReady) {
        setIsRecording(true);
      }
      return;
    }

    if (existingWs) {
      existingWs.close();
      wsRef.current = null;
    }

    const wsUrl = getWsUrl();
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'WebSocket error');
      return;
    }
    wsRef.current = ws;

    let opened = false;
    ws.onerror = () => setError('WebSocket error.');
    ws.onclose = (event) => {
      stopMic();
      wsRef.current = null;
      const wasRecording = isRecordingRef.current;
      setIsRecording(false);
      setLiveText('');
      if (!opened) {
        setError(
          'Could not connect to transcript server. Run "yarn dev" (both Next and server) or start the server on port 3001.',
        );
      } else if (wasRecording && !event.wasClean) {
        setError('Connection to transcript server lost. Your recording was interrupted — please try again.');
      }
    };
    ws.onopen = () => {
      opened = true;
      targetWsRef.current = ws;
      ws.send(
        JSON.stringify({
          type: 'session_config',
          mode: modeRef.current,
        }),
      );
      void startMicCapture().then((micReady) => {
        if (!micReady) {
          ws.close();
          return;
        }
        setIsRecording(true);
      });
    };

    ws.onmessage = (event: MessageEvent) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data as string);
      } catch {
        return;
      }

      if (isChecklistUpdateMessage(parsed)) {
        setRealtimeChecklist(parsed.items);
        setChecklistSource(parsed.source);
        setChecklistNextHint(parsed.nextHint);
        setChecklistError(null);
        return;
      }

      if (isChecklistErrorMessage(parsed)) {
        setChecklistError(parsed.error ?? 'Checklist error');
        return;
      }

      const msg = parsed as RealtimeSttMessage;
      if (msg.type === 'saved') {
        setSaved(true);
        setFeedbackQuestion(msg.feedbackQuestion ?? null);
        setFeedbackAnswer(msg.feedbackAnswer ?? null);
        setFeedbackError(msg.feedbackError ?? null);
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
      if (msg.type === 'feedback_audio' && typeof msg.base64 === 'string') {
        try {
          const binary = atob(msg.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
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
      if ((type === 'committed_transcript_with_timestamps' || type === 'committed_transcript') && msg.text != null) {
        setTranscriptSegments((prev) => {
          const next = buildCommittedSegment(msg, prev);
          if (!next) return prev;
          if (prev.length === 0) return [next];

          const last = prev[prev.length - 1];
          if (last.text === next.text) return prev;

          if (next.text.startsWith(last.text) && next.text.length > last.text.length) {
            return [
              ...prev.slice(0, -1),
              {
                ...next,
                start: last.start,
              },
            ];
          }

          return [...prev, next];
        });
        setLiveText('');
        return;
      }
      if (type === 'error' || type === 'auth_error' || (type && type.endsWith('_error'))) {
        setError('Transcription error: ' + (msg.error ?? type));
      }
    };
  }, [startMicCapture, stopMic]);

  useEffect(() => {
    const q = feedbackQuestion;
    const a = answerTranscript;
    if (!a || !q || submittedAnswerRef.current === a) return;
    submittedAnswerRef.current = a;
    const apiBase = getApiBaseUrl();
    if (!apiBase) return;
    fetch(`${apiBase}/api/coach-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, answer: a }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: { feedbackText?: string; audioBase64?: string; audioError?: string }) => {
        setCoachFeedbackText(data.feedbackText ?? null);
        setHasCoachFeedbackAudio(!!data.audioBase64);
        coachFeedbackAudioErrorRef.current = data.audioError ?? null;
        if (coachFeedbackAudioUrlRef.current) {
          URL.revokeObjectURL(coachFeedbackAudioUrlRef.current);
          coachFeedbackAudioUrlRef.current = null;
        }
        if (data.audioBase64) {
          try {
            const binary = atob(data.audioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            coachFeedbackAudioUrlRef.current = url;
            const audio = new Audio(url);
            audio.play().catch(() => {});
          } catch (_) {}
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Feedback request failed'));
  }, [answerTranscript, feedbackQuestion]);

  const playCoachFeedbackAudio = useCallback(() => {
    const url = coachFeedbackAudioUrlRef.current;
    if (!url) {
      const serverError = coachFeedbackAudioErrorRef.current;
      setError(
        serverError
          ? `Voice wasn't generated: ${serverError}`
          : "Voice wasn't generated. Set ELEVENLABS_API_KEY_TTS and ELEVENLABS_VOICE_ID in .env.local and restart the STT server.",
      );
      return;
    }
    const audio = new Audio(url);
    audio.volume = 1;
    audio.play().catch((e) => {
      setError(
        e?.name === 'NotAllowedError'
          ? 'Allow audio for this site (browser blocked playback), then click Play again.'
          : 'Playback failed. Try clicking Play again.',
      );
    });
  }, []);

  return {
    isRecording,
    start,
    pause,
    stop,
    startAnswerRecording,
    stopAnswerRecording,
    isAnswerRecording,
    answerTranscript,
    liveText,
    transcriptSegments,
    saved,
    error,
    feedbackQuestion,
    feedbackAnswer,
    feedbackError,
    coachFeedbackText,
    hasCoachFeedbackAudio,
    playCoachFeedbackAudio,
    realtimeChecklist,
    checklistSource,
    checklistNextHint,
    checklistError,
  };
}
