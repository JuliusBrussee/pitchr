'use client';

import { useCallback, useRef, useState } from 'react';
import type { UpgradeContext } from '@/views/components/billing/UpgradePrompt';
import type { BillingPlanId, BillingInterval } from '@/types/billing';

/* ——————————————————————————————————————————————————————————
 * useUpgradePrompt — Centralized state for the upgrade modal
 * and toast-based nudges. Manages open/close, context, and
 * deduplication so users aren't spammed.
 * —————————————————————————————————————————————————————————— */

interface UpgradePromptState {
  isOpen: boolean;
  context: UpgradeContext;
  featureName?: string;
}

const NUDGE_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes between toast nudges
const SESSION_SHOWN_KEY = 'pitchr-upgrade-nudges';

function getNudgeTimestamps(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SESSION_SHOWN_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function setNudgeTimestamp(context: string) {
  const stamps = getNudgeTimestamps();
  stamps[context] = Date.now();
  localStorage.setItem(SESSION_SHOWN_KEY, JSON.stringify(stamps));
}

function canShowNudge(context: string): boolean {
  const stamps = getNudgeTimestamps();
  const last = stamps[context];
  if (!last) return true;
  return Date.now() - last > NUDGE_COOLDOWN_MS;
}

export function useUpgradePrompt() {
  const [state, setState] = useState<UpgradePromptState>({
    isOpen: false,
    context: 'limit_reached',
  });

  const isLoadingRef = useRef(false);

  const show = useCallback((context: UpgradeContext, featureName?: string) => {
    setState({ isOpen: true, context, featureName });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Show a nudge only if the cooldown has elapsed for this context.
   * Returns true if the nudge was shown, false if suppressed.
   */
  const nudge = useCallback((context: UpgradeContext, featureName?: string): boolean => {
    if (!canShowNudge(context)) return false;
    setNudgeTimestamp(context);
    setState({ isOpen: true, context, featureName });
    return true;
  }, []);

  /**
   * Should be called after a successful analysis to check if
   * a milestone nudge is appropriate (e.g., 2nd of 3 free analyses).
   */
  const checkMilestoneNudge = useCallback(
    (runsUsed: number, runsLimit: number | null, planId: BillingPlanId): boolean => {
      if (planId !== 'free' || runsLimit === null) return false;
      // Nudge when user has used all but 1 of their limit
      if (runsUsed === runsLimit - 1) {
        return nudge('milestone');
      }
      return false;
    },
    [nudge],
  );

  /**
   * Should be called when a usage check fails (resource exhausted).
   */
  const showLimitReached = useCallback(() => {
    show('limit_reached');
  }, [show]);

  /**
   * Should be called when user taps a Pro-only feature.
   */
  const showFeatureLocked = useCallback(
    (featureName: string) => {
      show('feature_locked', featureName);
    },
    [show],
  );

  /**
   * Should be called when credits are low (1 remaining).
   */
  const showLowCredits = useCallback((): boolean => {
    return nudge('low_credits');
  }, [nudge]);

  return {
    ...state,
    show,
    close,
    nudge,
    checkMilestoneNudge,
    showLimitReached,
    showFeatureLocked,
    showLowCredits,
  };
}
