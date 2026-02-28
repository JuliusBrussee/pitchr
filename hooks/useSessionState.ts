'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createInitialChecklistState } from '@/config/realtimeChecklist';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { PitchMode } from '@/types/pitch';
import type { OrbState } from '@/views/components/SiriBubble';

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
  updateTranscript: (fullText: string, committedText?: string) => void;
  checklist: RealtimeChecklistItemState[];
  setChecklist: (items: RealtimeChecklistItemState[]) => void;
  resetChecklist: (mode: PitchMode) => void;
  insights: InsightEntry[];
  isSessionActive: boolean;
  startSession: (mode: PitchMode) => void;
  stopSession: () => void;
  resumeSession: () => void;
}

const FILLER_WORDS = new Set([
  'um', 'uh', 'er', 'ah', 'like', 'basically', 'actually', 'literally',
  'right', 'honestly', 'obviously', 'essentially',
]);

const FILLER_PHRASES = ['you know', 'i mean', 'kind of', 'sort of'];

const METRICS_REFRESH_MS = 2_000;
const WPM_TREND_WINDOW_MS = 30_000;
const WPM_SMOOTHING_ALPHA = 0.12;
const WPM_MAX_STEP = 4;
const FILLER_RATE_SMOOTHING_ALPHA = 0.15;
const FILLER_RATE_MAX_STEP = 0.4;

interface WpmSample {
  timestamp: number;
  wordCount: number;
}

function normalizeTranscriptText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractTokens(text: string): string[] {
  return text.match(/[a-z0-9]+(?:['’][a-z0-9]+)*/gi) ?? [];
}

function countFillerWords(text: string): number {
  const normalized = normalizeTranscriptText(text);
  if (!normalized) return 0;
  let count = 0;

  for (const phrase of FILLER_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'g');
    const matches = normalized.match(regex);
    if (matches) count += matches.length;
  }

  const words = extractTokens(normalized);
  for (const word of words) {
    if (FILLER_WORDS.has(word)) count++;
  }

  return count;
}

function countWords(text: string): number {
  return extractTokens(normalizeTranscriptText(text)).length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function smoothWithFriction(
  previous: number,
  target: number,
  alpha: number,
  maxStep: number,
): number {
  if (previous <= 0) return target;
  const eased = previous + (target - previous) * alpha;
  return clamp(eased, previous - maxStep, previous + maxStep);
}

function roundToNearest(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.round(value / step) * step;
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
  const pausedAtRef = useRef<number>(0);
  const totalPausedMsRef = useRef<number>(0);
  const lastTranscriptRef = useRef<string>('');
  const lastCommittedTranscriptRef = useRef<string>('');
  const wordCountRef = useRef(0);
  const fillerWordsRef = useRef(0);
  const wpmSamplesRef = useRef<WpmSample[]>([]);
  const smoothedWpmRef = useRef(0);
  const smoothedFillerRateRef = useRef(0);

  const getTargetWpm = useCallback((nowMs: number, totalWords: number): number => {
    const startedAt = sessionStartRef.current;
    if (!startedAt || totalWords <= 0) return 0;

    const elapsedSecs = Math.max((nowMs - startedAt) / 1000, 1);
    const samples = wpmSamplesRef.current;
    const lastSample = samples[samples.length - 1];
    if (
      !lastSample ||
      lastSample.timestamp !== nowMs ||
      lastSample.wordCount !== totalWords
    ) {
      samples.push({ timestamp: nowMs, wordCount: totalWords });
    }

    const cutoff = nowMs - WPM_TREND_WINDOW_MS;
    while (samples.length > 1 && samples[0].timestamp < cutoff) {
      samples.shift();
    }

    const oldest = samples[0];
    const deltaWords = Math.max(totalWords - oldest.wordCount, 0);
    const deltaSecs = Math.max((nowMs - oldest.timestamp) / 1000, 1);
    const windowWpm = (deltaWords / deltaSecs) * 60;
    const cumulativeWpm = (totalWords / elapsedSecs) * 60;
    const blend = Math.min(1, elapsedSecs / (WPM_TREND_WINDOW_MS / 1000));
    return cumulativeWpm * (1 - blend) + windowWpm * blend;
  }, []);

  const refreshTrendMetrics = useCallback(
    (nextWordCount: number, nextFillerWords: number) => {
      const nowMs = Date.now();
      const elapsed = sessionStartRef.current
        ? Math.floor((nowMs - sessionStartRef.current - totalPausedMsRef.current) / 1000)
        : 0;

      setMetrics((prev) => {
        const wordCount = isSessionActive
          ? Math.max(prev.wordCount, nextWordCount)
          : nextWordCount;
        const fillerWords = isSessionActive
          ? Math.max(prev.fillerWords, nextFillerWords)
          : nextFillerWords;

        const targetWpm = getTargetWpm(nowMs, wordCount);
        smoothedWpmRef.current = smoothWithFriction(
          smoothedWpmRef.current,
          targetWpm,
          WPM_SMOOTHING_ALPHA,
          WPM_MAX_STEP,
        );

        const targetFillerRate = wordCount > 0 ? (fillerWords / wordCount) * 100 : 0;
        smoothedFillerRateRef.current = smoothWithFriction(
          smoothedFillerRateRef.current,
          targetFillerRate,
          FILLER_RATE_SMOOTHING_ALPHA,
          FILLER_RATE_MAX_STEP,
        );

        return {
          wpm: wordCount > 0 ? roundToNearest(Math.max(0, smoothedWpmRef.current), 10) : 0,
          fillerWords,
          wordCount,
          durationSecs: prev.durationSecs > elapsed ? prev.durationSecs : elapsed,
          fillerRate:
            wordCount > 0 ? Math.round(Math.max(0, smoothedFillerRateRef.current) * 10) / 10 : 0,
        };
      });
    },
    [getTargetWpm, isSessionActive],
  );

  // Duration timer updates every second while session is active.
  useEffect(() => {
    if (!isSessionActive) {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      return;
    }

    durationIntervalRef.current = setInterval(() => {
      const elapsed = sessionStartRef.current
        ? Math.floor((Date.now() - sessionStartRef.current - totalPausedMsRef.current) / 1000)
        : 0;
      setMetrics((prev) => ({ ...prev, durationSecs: elapsed }));
    }, 1000);

    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [isSessionActive]);

  useEffect(() => {
    if (!isSessionActive) {
      return;
    }

    const trendInterval = setInterval(() => {
      refreshTrendMetrics(wordCountRef.current, fillerWordsRef.current);
    }, METRICS_REFRESH_MS);

    return () => {
      clearInterval(trendInterval);
    };
  }, [isSessionActive, refreshTrendMetrics]);

  const updateTranscript = useCallback(
    (fullText: string, committedText = '') => {
      const normalizedFullText = normalizeTranscriptText(fullText);
      const normalizedCommittedText = normalizeTranscriptText(committedText);

      if (
        normalizedFullText === lastTranscriptRef.current &&
        normalizedCommittedText === lastCommittedTranscriptRef.current
      ) {
        return;
      }
      lastTranscriptRef.current = normalizedFullText;
      lastCommittedTranscriptRef.current = normalizedCommittedText;

      const liveWordCount = countWords(normalizedFullText);
      const committedWordCount = countWords(normalizedCommittedText);
      const nextWordCount = Math.max(liveWordCount, committedWordCount);

      const liveFillerCount = countFillerWords(normalizedFullText);
      const committedFillerCount = countFillerWords(normalizedCommittedText);
      const nextFillerWords = Math.max(liveFillerCount, committedFillerCount);

      wordCountRef.current = nextWordCount;
      fillerWordsRef.current = nextFillerWords;
      // Consume transcript updates immediately, but update rendered trend metrics
      // on a slower timer so values stay stable and trend-like.
    },
    [],
  );

  const resetChecklist = useCallback((mode: PitchMode) => {
    setChecklist(createInitialChecklistState(mode));
  }, []);

  const startSession = useCallback((mode: PitchMode) => {
    setIsSessionActive(true);
    setOrbState('active');
    sessionStartRef.current = Date.now();
    pausedAtRef.current = 0;
    totalPausedMsRef.current = 0;
    lastTranscriptRef.current = '';
    lastCommittedTranscriptRef.current = '';
    wordCountRef.current = 0;
    fillerWordsRef.current = 0;
    wpmSamplesRef.current = [];
    smoothedWpmRef.current = 0;
    smoothedFillerRateRef.current = 0;
    setMetrics({ wpm: 0, fillerWords: 0, wordCount: 0, durationSecs: 0, fillerRate: 0 });
    setChecklist(createInitialChecklistState(mode));
  }, []);

  const stopSession = useCallback(() => {
    pausedAtRef.current = Date.now();
    setIsSessionActive(false);
    setOrbState('idle');
  }, []);

  const resumeSession = useCallback(() => {
    if (!sessionStartRef.current) {
      sessionStartRef.current = Date.now();
    }
    if (pausedAtRef.current > 0) {
      totalPausedMsRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = 0;
    }
    setIsSessionActive(true);
    setOrbState('active');
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
    resumeSession,
  };
}
