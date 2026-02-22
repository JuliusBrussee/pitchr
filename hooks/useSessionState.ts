'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createInitialChecklistState } from '@/config/realtimeChecklist';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { PitchMode } from '@/types/pitch';
import { OrbState } from '@/views/components/SiriBubble';

export interface MetricValues {
  wpm: number;
  fillerWords: number;
  wordCount: number;
  durationSecs: number;
  fillerRate: number; // 0-100
}

export interface InsightEntry {
  id: string;
  text: string;
  timestamp: Date;
  type: 'positive' | 'suggestion' | 'neutral';
}

export interface SessionState {
  orbState: OrbState;
  setOrbState: (state: OrbState) => void;
  metrics: MetricValues;
  updateTranscript: (fullText: string) => void;
  checklist: RealtimeChecklistItemState[];
  setChecklist: (items: RealtimeChecklistItemState[]) => void;
  resetChecklist: (mode: PitchMode) => void;
  insights: InsightEntry[];
  isSessionActive: boolean;
  startSession: (mode: PitchMode) => void;
  stopSession: () => void;
}

const FILLER_WORDS = new Set([
  'um', 'uh', 'er', 'ah', 'like', 'basically', 'actually', 'literally',
  'right', 'honestly', 'obviously', 'essentially',
]);

const FILLER_PHRASES = ['you know', 'i mean', 'kind of', 'sort of'];

function countFillerWords(text: string): number {
  if (!text.trim()) return 0;
  const lower = text.toLowerCase();
  let count = 0;

  for (const phrase of FILLER_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) count += matches.length;
  }

  const words = lower.split(/\s+/).filter(Boolean);
  for (const word of words) {
    const clean = word.replace(/[.,!?;:'"]/g, '');
    if (FILLER_WORDS.has(clean)) count++;
  }

  return count;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function useSessionState(): SessionState {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [metrics, setMetrics] = useState<MetricValues>({
    wpm: 0,
    fillerWords: 0,
    wordCount: 0,
    durationSecs: 0,
    fillerRate: 0,
  });
  const [checklist, setChecklist] = useState<RealtimeChecklistItemState[]>(
    createInitialChecklistState('elevator'),
  );
  const [insights] = useState<InsightEntry[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const sessionStartRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');

  // Duration timer — updates every second while session is active
  useEffect(() => {
    if (!isSessionActive) {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      return;
    }

    durationIntervalRef.current = setInterval(() => {
      if (!sessionStartRef.current) return;
      const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      setMetrics((prev) => {
        const wpm = elapsed > 0 ? Math.round((prev.wordCount / elapsed) * 60) : 0;
        return { ...prev, durationSecs: elapsed, wpm };
      });
    }, 1000);

    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [isSessionActive]);

  const updateTranscript = useCallback((fullText: string) => {
    if (fullText === lastTranscriptRef.current) return;
    lastTranscriptRef.current = fullText;

    const wordCount = countWords(fullText);
    const fillerWords = countFillerWords(fullText);
    const fillerRate = wordCount > 0 ? Math.round((fillerWords / wordCount) * 1000) / 10 : 0;
    const elapsed = sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
      : 0;
    const wpm = elapsed > 0 ? Math.round((wordCount / elapsed) * 60) : 0;

    setMetrics({
      wpm,
      fillerWords,
      wordCount,
      durationSecs: elapsed,
      fillerRate,
    });
  }, []);

  const resetChecklist = useCallback((mode: PitchMode) => {
    setChecklist(createInitialChecklistState(mode));
  }, []);

  const startSession = useCallback((mode: PitchMode) => {
    setIsSessionActive(true);
    setOrbState('active');
    sessionStartRef.current = Date.now();
    lastTranscriptRef.current = '';
    setMetrics({ wpm: 0, fillerWords: 0, wordCount: 0, durationSecs: 0, fillerRate: 0 });
    setChecklist(createInitialChecklistState(mode));
  }, []);

  const stopSession = useCallback(() => {
    setIsSessionActive(false);
    setOrbState('idle');
  }, []);

  return {
    orbState,
    setOrbState,
    metrics,
    updateTranscript,
    checklist,
    setChecklist,
    resetChecklist,
    insights,
    isSessionActive,
    startSession,
    stopSession,
  };
}
