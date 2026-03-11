'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'pitchr_settings';

export interface PitchrSettings {
  timerDuration: number;       // seconds (default 300 = 5 min)
  defaultMode: 'elevator' | 'vc_pitch' | 'hackathon' | 'final_year';
}

const DEFAULTS: PitchrSettings = {
  timerDuration: 300,
  defaultMode: 'elevator',
};

function loadSettings(): PitchrSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function persistSettings(settings: PitchrSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useSettings() {
  const [settings, setSettings] = useState<PitchrSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);
  }, []);

  const update = useCallback((partial: Partial<PitchrSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      persistSettings(next);
      return next;
    });
  }, []);

  const adjustTimer = useCallback((deltaSec: number) => {
    setSettings((prev) => {
      const next = { ...prev, timerDuration: Math.max(60, Math.min(1800, prev.timerDuration + deltaSec)) };
      persistSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    persistSettings(DEFAULTS);
    setSettings(DEFAULTS);
  }, []);

  return { settings, loaded, update, adjustTimer, resetSettings };
}
