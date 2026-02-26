'use client';

import { useState, useEffect, useCallback } from 'react';
import { COACH_TOASTS } from '@/config/onboarding';
import { useOnboarding } from '@/hooks/useOnboarding';

const TOAST_PREFIX = 'pitchr-toast-seen:';

interface CoachToastResult {
  message: string;
  dismiss: () => void;
}

export function useCoachToast(pageKey: string): CoachToastResult | null {
  const { state, loaded } = useOnboarding();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!loaded || !state.isComplete || dismissed) return;

    const storageKey = `${TOAST_PREFIX}${pageKey}`;
    if (localStorage.getItem(storageKey)) return;

    const message = COACH_TOASTS[pageKey];
    if (!message) return;

    // Small delay before showing
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, [loaded, state.isComplete, pageKey, dismissed]);

  const dismiss = useCallback(() => {
    const storageKey = `${TOAST_PREFIX}${pageKey}`;
    localStorage.setItem(storageKey, 'true');
    setVisible(false);
    setDismissed(true);
  }, [pageKey]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      dismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, [visible, dismiss]);

  if (!visible || !COACH_TOASTS[pageKey]) return null;

  return { message: COACH_TOASTS[pageKey], dismiss };
}
