'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createInitialChecklistState } from '@/config/realtimeChecklist';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { PitchMode } from '@/types/pitch';
import { OrbState } from '@/views/components/SiriBubble';

export interface MetricValues {
  wpm: number;
  fillerWords: number;
  conciseness: number; // 0-10
  clarity: number; // 0-10
}

export interface InsightEntry {
  id: string;
  text: string;
  timestamp: Date;
  type: 'positive' | 'suggestion' | 'neutral';
}

export interface SpeechBubble {
  id: string;
  text: string;
  expiresAt: number;
}

export interface SessionState {
  orbState: OrbState;
  setOrbState: (state: OrbState) => void;
  metrics: MetricValues;
  checklist: RealtimeChecklistItemState[];
  setChecklist: (items: RealtimeChecklistItemState[]) => void;
  resetChecklist: (mode: PitchMode) => void;
  insights: InsightEntry[];
  speechBubbles: SpeechBubble[];
  isSessionActive: boolean;
  startSession: (mode: PitchMode) => void;
  stopSession: () => void;
}

const COACH_MESSAGES = [
  'Great eye contact! Keep it up.',
  'Try to slow down a bit.',
  'Take a deep breath.',
  'Look at the camera.',
  'Sit up straight!',
  "You're doing great!",
  'Try to vary your tone.',
  'Good pace!',
  'Remember to smile.',
  'Strong delivery!',
];

const MOCK_INSIGHTS: InsightEntry[] = [
  {
    id: '1',
    text: 'Strong opening - direct and confident',
    timestamp: new Date(),
    type: 'positive',
  },
  {
    id: '2',
    text: 'Consider adding a specific metric to support your claim',
    timestamp: new Date(),
    type: 'suggestion',
  },
];

export function useSessionState(): SessionState {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [metrics, setMetrics] = useState<MetricValues>({
    wpm: 0,
    fillerWords: 0,
    conciseness: 0,
    clarity: 0,
  });
  const [checklist, setChecklist] = useState<RealtimeChecklistItemState[]>(
    createInitialChecklistState('elevator'),
  );
  const [insights, setInsights] = useState<InsightEntry[]>(MOCK_INSIGHTS);
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate top-level delivery metrics while session is active.
  useEffect(() => {
    if (!isSessionActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setMetrics((prev) => ({
        wpm: Math.min(200, Math.max(80, prev.wpm + (Math.random() - 0.45) * 10)),
        fillerWords: prev.fillerWords + (Math.random() > 0.7 ? 1 : 0),
        conciseness: Math.min(
          10,
          Math.max(0, prev.conciseness + (Math.random() - 0.4) * 0.5),
        ),
        clarity: Math.min(10, Math.max(0, prev.clarity + (Math.random() - 0.4) * 0.5)),
      }));

      if (Math.random() > 0.85) {
        const states: OrbState[] = ['active', 'positive', 'neutral'];
        setOrbState(states[Math.floor(Math.random() * states.length)]);
      }
    }, 2000);

    bubbleIntervalRef.current = setInterval(() => {
      const msg = COACH_MESSAGES[Math.floor(Math.random() * COACH_MESSAGES.length)];
      const bubble: SpeechBubble = {
        id: Date.now().toString(),
        text: msg,
        expiresAt: Date.now() + 4000,
      };
      setSpeechBubbles((prev) => [...prev, bubble]);
    }, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
    };
  }, [isSessionActive]);

  useEffect(() => {
    if (speechBubbles.length === 0) return;
    const timer = setTimeout(() => {
      setSpeechBubbles((prev) => prev.filter((bubble) => bubble.expiresAt > Date.now()));
    }, 1000);
    return () => clearTimeout(timer);
  }, [speechBubbles]);

  const resetChecklist = useCallback((mode: PitchMode) => {
    setChecklist(createInitialChecklistState(mode));
  }, []);

  const startSession = useCallback((mode: PitchMode) => {
    setIsSessionActive(true);
    setOrbState('active');
    setMetrics({ wpm: 120, fillerWords: 0, conciseness: 6, clarity: 7 });
    setChecklist(createInitialChecklistState(mode));
    setInsights(MOCK_INSIGHTS);
    setSpeechBubbles([]);
  }, []);

  const stopSession = useCallback(() => {
    setIsSessionActive(false);
    setOrbState('idle');
  }, []);

  return {
    orbState,
    setOrbState,
    metrics,
    checklist,
    setChecklist,
    resetChecklist,
    insights,
    speechBubbles,
    isSessionActive,
    startSession,
    stopSession,
  };
}
