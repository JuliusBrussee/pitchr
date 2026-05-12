'use client';

import { useState, useCallback, useRef } from 'react';
import type { ProgressRunRecord } from '@/lib/progress';
import {
  type AchievementDef,
  type AchievementState,
  type AchievementProgress,
  ACHIEVEMENT_DEFS,
  checkAchievements,
  getAchievementProgress,
  loadAchievementState,
  saveAchievementState,
} from '@/lib/achievements';

export interface NewUnlock {
  def: AchievementDef;
  id: string;
}

export function useAchievements() {
  const [state, setState] = useState<AchievementState>(loadAchievementState);
  const [newUnlocks, setNewUnlocks] = useState<NewUnlock[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const processedRef = useRef(false);

  const earnedIds = new Set(Object.keys(state));

  const processRuns = useCallback((runs: ProgressRunRecord[]) => {
    if (processedRef.current) return;
    processedRef.current = true;

    const currentState = loadAchievementState();
    const earnedNow = checkAchievements(runs);

    // Detect new unlocks
    const unlocks: NewUnlock[] = [];
    const updatedState = { ...currentState };
    const now = new Date().toISOString();

    for (const id of earnedNow) {
      if (!currentState[id]) {
        updatedState[id] = { unlockedAt: now };
        const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
        if (def) unlocks.push({ def, id });
      }
    }

    if (unlocks.length > 0) {
      saveAchievementState(updatedState);
      setState(updatedState);
      setNewUnlocks(unlocks);
    } else {
      setState(currentState);
    }

    // Compute progress for unearned achievements
    setProgress(getAchievementProgress(runs, earnedNow));
  }, []);

  const dismissUnlock = useCallback((id: string) => {
    setNewUnlocks((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const dismissAllUnlocks = useCallback(() => {
    setNewUnlocks([]);
  }, []);

  const resetAchievements = useCallback(() => {
    saveAchievementState({});
    setState({});
    setNewUnlocks([]);
    setProgress([]);
    processedRef.current = false;
  }, []);

  return {
    state,
    earnedIds,
    earnedCount: earnedIds.size,
    totalCount: ACHIEVEMENT_DEFS.length,
    newUnlocks,
    progress,
    processRuns,
    dismissUnlock,
    dismissAllUnlocks,
    resetAchievements,
  };
}
