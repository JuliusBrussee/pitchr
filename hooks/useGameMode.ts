'use client';

import { useCallback, useState } from 'react';
import type { Difficulty } from '@/config/arena';
import type { Scenario } from '@/types/arena';

export type GameModeState = 'idle' | 'loading' | 'reading' | 'recording' | 'submitting' | 'results';

export interface GameModeResults {
  score: number;
  xpEarned: number;
  totalXp: number;
  streak: { currentStreak: number; isNewMilestone: boolean; milestone?: number };
}

export interface UseGameModeReturn {
  state: GameModeState;
  scenario: Scenario | null;
  difficulty: Difficulty | null;
  results: GameModeResults | null;
  error: string | null;
  selectDifficulty: (difficulty: Difficulty) => Promise<void>;
  startRecording: () => void;
  submitPitch: (runId: string) => Promise<void>;
  reset: () => void;
}

export function useGameMode(): UseGameModeReturn {
  const [state, setState] = useState<GameModeState>('idle');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [results, setResults] = useState<GameModeResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // selectDifficulty: idle -> loading -> reading
  const selectDifficulty = useCallback(async (diff: Difficulty) => {
    try {
      setState('loading');
      setError(null);
      setDifficulty(diff);
      setResults(null);

      const res = await fetch(`/api/arena/game-mode?difficulty=${diff}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load scenario');
      }
      const scenarioData = await res.json();
      setScenario(scenarioData);
      setState('reading');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scenario');
      setState('idle');
    }
  }, []);

  // startRecording: reading -> recording
  const startRecording = useCallback(() => {
    setState('recording');
  }, []);

  // submitPitch: recording -> submitting -> results
  const submitPitch = useCallback(async (runId: string) => {
    if (!scenario || !difficulty) return;
    try {
      setState('submitting');
      setError(null);

      const res = await fetch('/api/arena/game-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          runId,
          difficulty,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit pitch');
      }

      const resultData = await res.json();
      setResults(resultData);
      setState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit pitch');
      setState('recording'); // go back to recording on error
    }
  }, [scenario, difficulty]);

  // reset: any -> idle
  const reset = useCallback(() => {
    setState('idle');
    setScenario(null);
    setDifficulty(null);
    setResults(null);
    setError(null);
  }, []);

  return { state, scenario, difficulty, results, error, selectDifficulty, startRecording, submitPitch, reset };
}
