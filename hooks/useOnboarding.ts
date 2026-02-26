'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'pitchr_onboarding';
const TOAST_PREFIX = 'pitchr-toast-seen:';

export interface OnboardingState {
  isComplete: boolean;
  displayName: string;
  preferredMode: 'elevator' | 'vc_pitch';
  cameFromTry: boolean;
}

const DEFAULTS: OnboardingState = {
  isComplete: false,
  displayName: '',
  preferredMode: 'elevator',
  cameFromTry: false,
};

function loadState(): OnboardingState {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function persistState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  const complete = useCallback((name: string, mode: 'elevator' | 'vc_pitch') => {
    const next: OnboardingState = {
      isComplete: true,
      displayName: name,
      preferredMode: mode,
      cameFromTry: false,
    };
    persistState(next);
    setState(next);
  }, []);

  const markCameFromTry = useCallback((mode: 'elevator' | 'vc_pitch') => {
    const next: OnboardingState = {
      ...loadState(),
      cameFromTry: true,
      preferredMode: mode,
    };
    persistState(next);
    setState(next);
  }, []);

  const reset = useCallback(() => {
    persistState(DEFAULTS);
    setState(DEFAULTS);
    // Also clear all toast flags
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(TOAST_PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  }, []);

  return { state, loaded, complete, markCameFromTry, reset };
}
