'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createInitialChecklistState } from '@/config/realtimeChecklist';
import type {
  RealtimeChecklistUpdateMessage,
  RealtimeChecklistItemState,
} from '@/types/checklist';
import type { TranscriptSegment } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

const TARGET_SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = 2048;
const ASSEMBLYAI_WS_BASE = 'wss://streaming.assemblyai.com/v3/ws';
const CHECKLIST_POLL_INTERVAL_MS = 10_000;
const TOKEN_REFRESH_BUFFER_MS = 60_000;

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

interface StartOptions {
  resume?: boolean;
  mode?: PitchMode;
}

interface AssemblyAIMessage {
  type?: string;
  turn_is_formatted?: boolean;
  transcript?: string;
  utterance?: string;
  words?: Array<{ text?: string; start?: number; end?: number }>;
  error?: string;
}

interface TokenResponse {
  token: string;
  expiresInSeconds: number;
}

interface ChecklistResponse {
  skipped?: boolean;
  message?: RealtimeChecklistUpdateMessage;
  items?: RealtimeChecklistItemState[];
  scheduler?: { lastEvaluatedAtMs: number; lastEvaluatedWordCount: number };
}

interface StopResponse {
  feedbackQuestion?: string;
  feedbackError?: string;
}

interface CoachAnswerResponse {
  feedbackText?: string;
  audioBase64?: string;
  audioError?: string;
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
  text: string,
  words: Array<{ text: string; start: number; end: number }>,
  previous: TranscriptSegment[],
): TranscriptSegment | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (words.length > 0) {
    return {
      text: trimmed,
      start: words[0].start,
      end: words[words.length - 1].end,
      words,
    };
  }

  const previousEnd = previous.length > 0 ? previous[previous.length - 1].end : 0;
  const tokenCount = trimmed.split(/\s+/u).filter(Boolean).length;
  const duration = Math.max(0.25, tokenCount * 0.33);
  const start = Number(previousEnd.toFixed(3));
  const end = Number((previousEnd + duration).toFixed(3));
  return {
    text: trimmed,
    start,
    end,
    words: buildSyntheticWords(trimmed, start, end),
  };
}

function parseAssemblyAITurn(msg: AssemblyAIMessage): {
  text: string;
  words: Array<{ text: string; start: number; end: number }>;
  isFormatted: boolean;
} | null {
  if (msg.type !== 'Turn') return null;
  const formatted = msg.turn_is_formatted === true;
  const text =
    formatted && (msg.utterance ?? '').trim().length > 0
      ? (msg.utterance ?? '').trim()
      : (msg.transcript ?? '').trim();
  const wordsRaw = msg.words ?? [];
  const words = wordsRaw
    .map((w) => ({
      text: String(w.text ?? '').trim(),
      start: Number((Number(w.start) || 0) / 1000),
      end: Number((Number(w.end) || 0) / 1000),
    }))
    .filter((w) => w.text && Number.isFinite(w.start) && Number.isFinite(w.end));
  return { text, words, isFormatted: formatted };
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


async function fetchToken(): Promise<TokenResponse> {
  const response = await fetch('/api/stt/token', { method: 'GET', cache: 'no-store' });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Token request failed: ${response.status}`);
  }
  return (await response.json()) as TokenResponse;
}

function buildAssemblyAIWsUrl(token: string): string {
  return `${ASSEMBLYAI_WS_BASE}?token=${token}&sample_rate=${TARGET_SAMPLE_RATE}&encoding=pcm_s16le&format_turns=true&speech_model=universal-streaming-english`;
}

export interface UseSTTReturn {
  isRecording: boolean;
  isSttAvailable: boolean;
  sttAvailabilityMessage: string | null;
  start: (options?: StartOptions) => Promise<void>;
  pause: () => void;
  stop: () => void;
  discard: () => void;
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
  const [checklistSource, setChecklistSource] = useState<'llm' | 'heuristic' | null>(null);
  const [checklistNextHint, setChecklistNextHint] = useState<string | null>(null);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [isSttAvailable, setIsSttAvailable] = useState(true);
  const [sttAvailabilityMessage, setSttAvailabilityMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const isRecordingRef = useRef(false);
  const hadActiveSessionRef = useRef(false);
  const answerWsRef = useRef<WebSocket | null>(null);
  const submittedAnswerRef = useRef<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const modeRef = useRef<PitchMode>('elevator');
  const sttCapabilityCheckedRef = useRef(false);
  const sttCapabilityProbeRef = useRef<Promise<boolean> | null>(null);

  // Checklist polling refs
  const checklistIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checklistItemsRef = useRef<RealtimeChecklistItemState[]>([]);
  const checklistSchedulerRef = useRef({ lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 });
  const checklistSessionStartRef = useRef(0);
  const checklistInFlightRef = useRef(false);

  // Transcript accumulation refs (for checklist context)
  const committedTranscriptRef = useRef('');
  const livePartialRef = useRef('');

  // Token refresh refs
  const tokenExpiresAtRef = useRef(0);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track which WS should receive audio (main or answer)
  const activeWsRef = useRef<WebSocket | null>(null);

  const markSttUnavailable = useCallback((message?: string) => {
    const reason = message?.trim();
    const guidance = reason || 'Speech recording is currently unavailable.';
    sttCapabilityCheckedRef.current = true;
    setIsSttAvailable(false);
    setSttAvailabilityMessage(guidance);
    setError(guidance);
  }, []);

  const ensureSttAvailability = useCallback(async (): Promise<boolean> => {
    if (!isSttAvailable) return false;
    if (sttCapabilityCheckedRef.current) return true;
    if (sttCapabilityProbeRef.current) {
      return sttCapabilityProbeRef.current;
    }

    const probePromise = (async () => {
      try {
        const response = await fetch('/api/stt/capabilities', {
          method: 'GET',
          cache: 'no-store',
        });
        if (!response.ok) {
          sttCapabilityCheckedRef.current = true;
          return true;
        }

        const payload = (await response.json()) as { enabled?: boolean; message?: string };
        if (payload.enabled === false) {
          markSttUnavailable(payload.message);
          return false;
        }

        if (payload.enabled === true) {
          setIsSttAvailable(true);
          setSttAvailabilityMessage(null);
        }
      } catch {
        // Ignore probe failures
      }

      sttCapabilityCheckedRef.current = true;
      return true;
    })();

    sttCapabilityProbeRef.current = probePromise;
    const available = await probePromise;
    sttCapabilityProbeRef.current = null;
    return available;
  }, [isSttAvailable, markSttUnavailable]);

  useEffect(() => {
    void ensureSttAvailability();
  }, [ensureSttAvailability]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const sendBinaryAudio = useCallback((int16: Int16Array) => {
    const ws = activeWsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(int16.buffer);
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

  const stopChecklistPolling = useCallback(() => {
    if (checklistIntervalRef.current) {
      clearInterval(checklistIntervalRef.current);
      checklistIntervalRef.current = null;
    }
  }, []);

  const stopTokenRefresh = useCallback(() => {
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }
  }, []);

  const runChecklistEval = useCallback(async (force = false) => {
    if (checklistInFlightRef.current) return;
    const transcript = committedTranscriptRef.current.trim();
    const partial = livePartialRef.current.trim();
    const fullTranscript = partial
      ? (transcript ? `${transcript} ${partial}` : partial)
      : transcript;
    if (!fullTranscript) return;

    checklistInFlightRef.current = true;
    try {
      const response = await fetch('/api/stt/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: modeRef.current,
          transcript: fullTranscript,
          previousItems: checklistItemsRef.current,
          scheduler: checklistSchedulerRef.current,
          sessionStartedAtMs: checklistSessionStartRef.current,
          force,
        }),
      });
      if (!response.ok) return;
      const data = (await response.json()) as ChecklistResponse;
      if (data.skipped) return;
      if (data.message && isChecklistUpdateMessage(data.message)) {
        setRealtimeChecklist(data.message.items);
        setChecklistSource(data.message.source);
        setChecklistNextHint(data.message.nextHint);
        setChecklistError(null);
        checklistItemsRef.current = data.message.items;
      }
      if (data.scheduler) {
        checklistSchedulerRef.current = data.scheduler;
      }
    } catch {
      // Checklist polling failure is non-fatal
    } finally {
      checklistInFlightRef.current = false;
    }
  }, []);

  const startChecklistPolling = useCallback(() => {
    stopChecklistPolling();
    checklistIntervalRef.current = setInterval(() => {
      void runChecklistEval(false);
    }, CHECKLIST_POLL_INTERVAL_MS);
  }, [runChecklistEval, stopChecklistPolling]);

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
          sendBinaryAudio(int16);
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
  }, [sendBinaryAudio, stopMic]);

  const handleAssemblyAIMessage = useCallback(
    (event: MessageEvent, isAnswerMode: boolean) => {
      let parsed: AssemblyAIMessage;
      try {
        parsed = JSON.parse(event.data as string) as AssemblyAIMessage;
      } catch {
        return;
      }

      if (parsed.type === 'Begin' || parsed.type === 'Termination') return;

      const turn = parseAssemblyAITurn(parsed);
      if (turn) {
        if (isAnswerMode) {
          // In answer mode, accumulate the formatted transcript
          if (turn.isFormatted && turn.text) {
            setAnswerTranscript((prev) => {
              const combined = prev ? `${prev} ${turn.text}` : turn.text;
              return combined;
            });
          }
          return;
        }

        if (!turn.isFormatted) {
          // Partial transcript
          livePartialRef.current = turn.text;
          setLiveText(turn.text);
        } else {
          // Committed (formatted) turn
          if (turn.text) {
            committedTranscriptRef.current = committedTranscriptRef.current
              ? `${committedTranscriptRef.current} ${turn.text}`
              : turn.text;
            livePartialRef.current = '';
            setTranscriptSegments((prev) => {
              const next = buildCommittedSegment(turn.text, turn.words, prev);
              if (!next) return prev;
              if (prev.length === 0) return [next];
              const last = prev[prev.length - 1];
              if (last.text === next.text) return prev;
              if (next.text.startsWith(last.text) && next.text.length > last.text.length) {
                return [...prev.slice(0, -1), { ...next, start: last.start }];
              }
              return [...prev, next];
            });
            setLiveText('');
          }
        }
        return;
      }

      // Error messages
      if (parsed.error || (parsed.type && (parsed.type.endsWith('_error') || parsed.type === 'error'))) {
        setError('Transcription error: ' + (parsed.error ?? parsed.type));
      }
    },
    [],
  );

  const connectToAssemblyAI = useCallback(
    async (isAnswerMode: boolean): Promise<WebSocket | null> => {
      let tokenData: TokenResponse;
      try {
        tokenData = await fetchToken();
      } catch (e) {
        if (e instanceof Error && (e.message.includes('401') || e.message.includes('Authentication'))) {
          setError('Please sign in to use speech recording.');
        } else {
          setError(e instanceof Error ? e.message : 'Failed to get transcription token');
        }
        return null;
      }

      tokenExpiresAtRef.current = Date.now() + tokenData.expiresInSeconds * 1000;

      const url = buildAssemblyAIWsUrl(tokenData.token);
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'WebSocket connection failed');
        return null;
      }

      ws.binaryType = 'arraybuffer';

      ws.onmessage = (event: MessageEvent) => handleAssemblyAIMessage(event, isAnswerMode);
      ws.onerror = () => setError('Transcription connection error.');

      return ws;
    },
    [handleAssemblyAIMessage],
  );

  const scheduleTokenRefresh = useCallback(() => {
    stopTokenRefresh();
    const msUntilExpiry = tokenExpiresAtRef.current - Date.now();
    const refreshIn = Math.max(5000, msUntilExpiry - TOKEN_REFRESH_BUFFER_MS);

    tokenRefreshTimerRef.current = setTimeout(async () => {
      // Get new token and reconnect
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      try {
        const tokenData = await fetchToken();
        tokenExpiresAtRef.current = Date.now() + tokenData.expiresInSeconds * 1000;

        // Close old connection and open new one
        ws.send(JSON.stringify({ type: 'Terminate' }));
        ws.close();

        const newUrl = buildAssemblyAIWsUrl(tokenData.token);
        const newWs = new WebSocket(newUrl);
        newWs.binaryType = 'arraybuffer';
        newWs.onmessage = (event: MessageEvent) => handleAssemblyAIMessage(event, false);
        newWs.onerror = () => setError('Transcription connection error.');
        newWs.onclose = () => {
          if (wsRef.current === newWs) {
            wsRef.current = null;
            activeWsRef.current = null;
          }
        };
        newWs.onopen = () => {
          wsRef.current = newWs;
          activeWsRef.current = newWs;
          scheduleTokenRefresh();
        };
      } catch {
        // Token refresh failure — recording continues until WS closes
      }
    }, refreshIn);
  }, [handleAssemblyAIMessage, stopTokenRefresh]);

  const pause = useCallback(() => {
    stopMic();
    stopChecklistPolling();
    stopTokenRefresh();
    setIsRecording(false);
    setLiveText('');
    setSaved(false);
  }, [stopMic, stopChecklistPolling, stopTokenRefresh]);

  const stop = useCallback(() => {
    stopMic();
    stopChecklistPolling();
    stopTokenRefresh();

    // Final checklist eval
    void runChecklistEval(true);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'Terminate' }));
      ws.close();
    }
    wsRef.current = null;
    activeWsRef.current = null;

    setIsRecording(false);
    setLiveText('');

    // Only call stop endpoint if a session was actually active
    if (!hadActiveSessionRef.current) {
      return;
    }

    // Call stop endpoint for feedback question + TTS
    void (async () => {
      try {
        const response = await fetch('/api/stt/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = (await response.json()) as StopResponse;
          setFeedbackQuestion(data.feedbackQuestion ?? null);
          setFeedbackError(data.feedbackError ?? null);
        }
      } catch {
        // Network error — still proceed to save
      } finally {
        setSaved(true);
      }
    })();
  }, [stopMic, stopChecklistPolling, stopTokenRefresh, runChecklistEval]);

  const discard = useCallback(() => {
    stopMic();
    stopChecklistPolling();
    stopTokenRefresh();
    const ws = wsRef.current;
    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'Terminate' }));
      }
      ws.close();
      wsRef.current = null;
    }
    activeWsRef.current = null;
    hadActiveSessionRef.current = false;
    setIsRecording(false);
    setLiveText('');
    setTranscriptSegments([]);
    setSaved(false);
    committedTranscriptRef.current = '';
    livePartialRef.current = '';
  }, [stopMic, stopChecklistPolling, stopTokenRefresh]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const startAnswerRecording = useCallback(() => {
    if (!isSttAvailable) {
      markSttUnavailable(sttAvailabilityMessage ?? undefined);
      return;
    }

    setAnswerTranscript(null);
    setCoachFeedbackText(null);
    setHasCoachFeedbackAudio(false);
    coachFeedbackAudioErrorRef.current = null;
    submittedAnswerRef.current = null;
    setError(null);

    void (async () => {
      const ws = await connectToAssemblyAI(true);
      if (!ws) return;

      answerWsRef.current = ws;
      ws.onclose = () => {
        if (answerWsRef.current === ws) {
          answerWsRef.current = null;
          activeWsRef.current = wsRef.current;
          setIsAnswerRecording(false);
        }
      };

      ws.onopen = () => {
        activeWsRef.current = ws;
        void startMicCapture().then((micReady) => {
          if (!micReady) {
            ws.close();
            answerWsRef.current = null;
            activeWsRef.current = wsRef.current;
            return;
          }
          setIsAnswerRecording(true);
        });
      };
    })();
  }, [isSttAvailable, markSttUnavailable, sttAvailabilityMessage, connectToAssemblyAI, startMicCapture]);

  const stopAnswerRecording = useCallback(() => {
    const ws = answerWsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'Terminate' }));
      ws.close();
    }
    stopMic();
    setIsAnswerRecording(false);
    activeWsRef.current = wsRef.current;
    answerWsRef.current = null;
  }, [stopMic]);

  const start = useCallback(async (options?: StartOptions) => {
    const resume = options?.resume === true;
    const mode = options?.mode ?? modeRef.current;
    modeRef.current = mode;
    const sttReady = await ensureSttAvailability();
    if (!sttReady) return;

    setError(null);
    setSaved(false);
    setFeedbackQuestion(null);
    setFeedbackAnswer(null);
    setFeedbackError(null);
    setLiveText('');
    if (!resume) {
      setChecklistError(null);
      setChecklistSource(null);
      setTranscriptSegments([]);
      setRealtimeChecklist(createInitialChecklistState(mode));
      setChecklistNextHint(null);
      committedTranscriptRef.current = '';
      livePartialRef.current = '';
      checklistItemsRef.current = createInitialChecklistState(mode);
      checklistSchedulerRef.current = { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 };
      checklistSessionStartRef.current = Date.now();
    }

    const existingWs = wsRef.current;
    if (resume && existingWs && existingWs.readyState === WebSocket.OPEN) {
      const micReady = await startMicCapture();
      if (micReady) {
        hadActiveSessionRef.current = true;
        setIsRecording(true);
        startChecklistPolling();
      }
      return;
    }

    if (existingWs) {
      existingWs.close();
      wsRef.current = null;
    }

    const ws = await connectToAssemblyAI(false);
    if (!ws) return;

    wsRef.current = ws;

    ws.onclose = () => {
      stopMic();
      stopChecklistPolling();
      stopTokenRefresh();
      if (wsRef.current === ws) {
        wsRef.current = null;
        activeWsRef.current = null;
      }
      const wasRecording = isRecordingRef.current;
      setIsRecording(false);
      setLiveText('');
      if (wasRecording) {
        // Connection lost during recording — don't show error if stop was triggered
      }
    };

    ws.onopen = () => {
      activeWsRef.current = ws;
      scheduleTokenRefresh();
      void startMicCapture().then((micReady) => {
        if (!micReady) {
          ws.close();
          return;
        }
        hadActiveSessionRef.current = true;
        setIsRecording(true);
        startChecklistPolling();
      });
    };
  }, [
    ensureSttAvailability,
    startMicCapture,
    stopMic,
    connectToAssemblyAI,
    scheduleTokenRefresh,
    startChecklistPolling,
    stopChecklistPolling,
    stopTokenRefresh,
  ]);

  // Coach feedback effect: when answerTranscript is set, call coach-answer API
  useEffect(() => {
    const q = feedbackQuestion;
    const a = answerTranscript;
    if (!a || !q || submittedAnswerRef.current === a) return;
    submittedAnswerRef.current = a;
    fetch('/api/stt/coach-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, answer: a }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: CoachAnswerResponse) => {
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
          : "Voice wasn't generated. TTS is not configured on the server.",
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
    isSttAvailable,
    sttAvailabilityMessage,
    start,
    pause,
    stop,
    discard,
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
