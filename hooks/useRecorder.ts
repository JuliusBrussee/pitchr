'use client';

import { useCallback, useRef, useState } from 'react';

const MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function getMediaRecorderMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
  ];
  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) return mimeType;
  }
  return '';
}

export interface UseRecorderReturn {
  startRecording: (stream: MediaStream) => void;
  stopRecording: () => Promise<Blob | null>;
  isRecording: boolean;
}

export function useRecorder(): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveStopRef = useRef<((blob: Blob | null) => void) | null>(null);

  const startRecording = useCallback((stream: MediaStream) => {
    if (recorderRef.current) return;

    const mimeType = getMediaRecorderMimeType();
    if (!mimeType) {
      console.warn('[useRecorder] No supported MediaRecorder MIME type found');
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      setIsRecording(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      resolveStopRef.current?.(blob);
      resolveStopRef.current = null;
      recorderRef.current = null;
    };

    recorder.onerror = () => {
      console.warn('[useRecorder] MediaRecorder error');
      setIsRecording(false);
      resolveStopRef.current?.(null);
      resolveStopRef.current = null;
      recorderRef.current = null;
    };

    recorderRef.current = recorder;
    recorder.start(1000); // collect data every second
    setIsRecording(true);

    // Auto-stop at max duration
    timerRef.current = setTimeout(() => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    }, MAX_DURATION_MS);
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state !== 'recording') {
        resolve(null);
        return;
      }
      resolveStopRef.current = resolve;
      recorder.stop();
    });
  }, []);

  return { startRecording, stopRecording, isRecording };
}
