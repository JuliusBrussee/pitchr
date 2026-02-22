'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface RecordingResult {
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcript: string;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordingResult>;
  error: string | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

type SpeechRecognitionResultList = ArrayLike<SpeechRecognitionResult>;
type SpeechRecognitionResult = ArrayLike<SpeechRecognitionAlternative>;
interface SpeechRecognitionAlternative {
  transcript: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const durationIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const audioUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (durationIntervalRef.current !== null) {
      window.clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // No-op.
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startRecording = useCallback(async (): Promise<void> => {
    setError(null);
    setDuration(0);
    chunksRef.current = [];
    transcriptRef.current = '';

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start();
      setIsRecording(true);

      durationIntervalRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      const SpeechRecognitionCtor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const segments: string[] = [];
          for (let i = 0; i < event.results.length; i += 1) {
            const result = event.results[i];
            if (result?.[0]?.transcript) {
              segments.push(result[0].transcript);
            }
          }
          transcriptRef.current = segments.join(' ').trim();
        };
        recognition.onerror = () => {
          setError('Speech recognition unavailable; continue with manual text fallback.');
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (caughtError) {
      cleanup();
      setIsRecording(false);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to start audio recording.',
      );
    }
  }, [cleanup]);

  const stopRecording = useCallback(async (): Promise<RecordingResult> => {
    setIsRecording(false);
    if (durationIntervalRef.current !== null) {
      window.clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      cleanup();
      return {
        audioBlob: null,
        audioUrl: null,
        transcript: transcriptRef.current,
      };
    }

    const stopped = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        resolve(blob);
      };
    });

    recorder.stop();
    const audioBlob = await stopped;
    cleanup();

    const audioUrl = URL.createObjectURL(audioBlob);
    audioUrlRef.current = audioUrl;

    return {
      audioBlob,
      audioUrl,
      transcript: transcriptRef.current,
    };
  }, [cleanup]);

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    error,
  };
}

