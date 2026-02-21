'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { OrbState } from '@/views/components/SiriBubble';

export interface MetricValues {
  wpm: number;
  fillerWords: number;
  conciseness: number;  // 0-10
  clarity: number;      // 0-10
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'completed' | 'partial' | 'uncovered';
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
  checklist: ChecklistItem[];
  insights: InsightEntry[];
  speechBubbles: SpeechBubble[];
  isSessionActive: boolean;
  isPaused: boolean;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
}

const MOCK_CHECKLIST: ChecklistItem[] = [
  { id: '1', label: 'Introduction & hook', status: 'completed' },
  { id: '2', label: 'Problem statement', status: 'partial' },
  { id: '3', label: 'Solution overview', status: 'uncovered' },
  { id: '4', label: 'Market opportunity', status: 'uncovered' },
  { id: '5', label: 'Business model', status: 'uncovered' },
  { id: '6', label: 'Traction & metrics', status: 'uncovered' },
  { id: '7', label: 'Team', status: 'uncovered' },
  { id: '8', label: 'The ask', status: 'uncovered' },
];

const COACH_MESSAGES = [
  "Great eye contact! Keep it up.",
  "Try to slow down a bit.",
  "Take a deep breath.",
  "Look at the camera.",
  "Sit up straight!",
  "You're doing great!",
  "Try to vary your tone.",
  "Good pace!",
  "Remember to smile.",
  "Strong delivery!",
];

const MOCK_INSIGHTS: InsightEntry[] = [
  { id: '1', text: 'Strong opening — direct and confident', timestamp: new Date(), type: 'positive' },
  { id: '2', text: 'Consider adding a specific metric to support your claim', timestamp: new Date(), type: 'suggestion' },
];

export function useSessionState(): SessionState {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [metrics, setMetrics] = useState<MetricValues>({
    wpm: 0,
    fillerWords: 0,
    conciseness: 0,
    clarity: 0,
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>(MOCK_CHECKLIST);
  const [insights, setInsights] = useState<InsightEntry[]>(MOCK_INSIGHTS);
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate metrics updating when session is active
  useEffect(() => {
    if (!isSessionActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
      return;
    }

    // Simulate WPM and metrics changes
    intervalRef.current = setInterval(() => {
      setMetrics(prev => ({
        wpm: Math.min(200, Math.max(80, prev.wpm + (Math.random() - 0.45) * 10)),
        fillerWords: prev.fillerWords + (Math.random() > 0.7 ? 1 : 0),
        conciseness: Math.min(10, Math.max(0, prev.conciseness + (Math.random() - 0.4) * 0.5)),
        clarity: Math.min(10, Math.max(0, prev.clarity + (Math.random() - 0.4) * 0.5)),
      }));

      // Randomly progress checklist
      setChecklist(prev => {
        const idx = prev.findIndex(item => item.status !== 'completed');
        if (idx === -1 || Math.random() > 0.15) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status: updated[idx].status === 'uncovered' ? 'partial' : 'completed',
        };
        return updated;
      });

      // Randomly cycle orb states
      if (Math.random() > 0.85) {
        const states: OrbState[] = ['active', 'positive', 'neutral'];
        setOrbState(states[Math.floor(Math.random() * states.length)]);
      }
    }, 2000);

    // Coach speech bubbles
    bubbleIntervalRef.current = setInterval(() => {
      const msg = COACH_MESSAGES[Math.floor(Math.random() * COACH_MESSAGES.length)];
      const bubble: SpeechBubble = {
        id: Date.now().toString(),
        text: msg,
        expiresAt: Date.now() + 4000,
      };
      setSpeechBubbles(prev => [...prev, bubble]);
    }, 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
    };
  }, [isSessionActive]);

  // Clean up expired speech bubbles
  useEffect(() => {
    if (speechBubbles.length === 0) return;
    const timer = setTimeout(() => {
      setSpeechBubbles(prev => prev.filter(b => b.expiresAt > Date.now()));
    }, 1000);
    return () => clearTimeout(timer);
  }, [speechBubbles]);

  const startSession = useCallback(() => {
    setIsSessionActive(true);
    setOrbState('active');
    setMetrics({ wpm: 120, fillerWords: 0, conciseness: 6, clarity: 7 });
    setChecklist(MOCK_CHECKLIST);
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
    insights,
    speechBubbles,
    isSessionActive,
    startSession,
    stopSession,
  };
}
