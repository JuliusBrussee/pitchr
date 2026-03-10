'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BillingPlanId, BillingInterval } from '@/types/billing';

interface SubscriptionInfo {
  planId: BillingPlanId;
  planName: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  hasStripeSubscription: boolean;
}

interface UsageInfo {
  runsUsed: number;
  runsLimit: number | null;
  decksUsed: number;
  decksLimit: number | null;
  qaSecondsUsed: number;
  qaSecondsLimit: number | null;
  periodStart: string;
  periodEnd: string;
}

interface PlanLimitsInfo {
  runsPerPeriod: number | null;
  decksPerPeriod: number | null;
  qaSecondsPerPeriod: number | null;
  maxQaSessionSeconds: number;
  qaGracePeriodSeconds: number;
  maxConcurrentRuns: number;
  sectionFeedback: boolean;
  vocabularyMetrics: boolean;
  historicalLinks: boolean;
  deckGeneration: boolean;
  queuePriority: number;
}

interface DayPassInfo {
  id: string;
  expiresAt: string;
  runsUsed: number;
  runsLimit: number;
}

export interface CreditInfo {
  userId: string;
  monthlyCredits: number;
  monthlyCreditsLimit: number;
  purchasedCredits: number;
  bonusCredits: number;
  bonusCreditsExpiresAt: string | null;
  totalAvailable: number;
  periodStart: string;
  periodEnd: string;
}

interface BillingState {
  subscription: SubscriptionInfo | null;
  usage: UsageInfo | null;
  limits: PlanLimitsInfo | null;
  dayPass: DayPassInfo | null;
  credits: CreditInfo | null;
  isLoading: boolean;
  error: string | null;
}

export function useBilling() {
  const [state, setState] = useState<BillingState>({
    subscription: null,
    usage: null,
    limits: null,
    dayPass: null,
    credits: null,
    isLoading: true,
    error: null,
  });

  const fetchBilling = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const res = await fetch('/api/billing/subscription');
      if (!res.ok) throw new Error('Failed to fetch billing');
      const data = await res.json();
      setState({
        subscription: data.subscription,
        usage: data.usage,
        limits: data.limits,
        dayPass: data.dayPass ?? null,
        credits: data.credits ?? null,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const startCheckout = useCallback(
    async (planId: BillingPlanId, interval: BillingInterval) => {
      // Day pass uses a separate one-time payment endpoint
      const endpoint =
        planId === 'day_pass'
          ? '/api/billing/day-pass'
          : '/api/billing/checkout';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Checkout failed');
      }

      const { url } = await res.json();
      if (url) window.location.href = url;
    },
    [],
  );

  const openPortal = useCallback(async () => {
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Portal session failed');
    }

    const { url } = await res.json();
    if (url) window.location.href = url;
  }, []);

  const checkUsage = useCallback(
    async (resource: 'runs' | 'decks' | 'qa_seconds' | 'deck_generation') => {
      const res = await fetch(`/api/billing/usage?resource=${resource}`);
      if (!res.ok) throw new Error('Usage check failed');
      return res.json();
    },
    [],
  );

  const cancelSubscription = useCallback(async () => {
    const res = await fetch('/api/billing/cancel', { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Cancel failed');
    }
    await fetchBilling();
  }, [fetchBilling]);

  const resumeSubscription = useCallback(async () => {
    const res = await fetch('/api/billing/cancel', { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Resume failed');
    }
    await fetchBilling();
  }, [fetchBilling]);

  const purchaseCreditPack = useCallback(async (packSlug: string) => {
    const res = await fetch('/api/billing/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packSlug }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Credit pack purchase failed');
    }

    const { url } = await res.json();
    if (url) window.location.href = url;
  }, []);

  return {
    ...state,
    refresh: fetchBilling,
    startCheckout,
    openPortal,
    checkUsage,
    cancelSubscription,
    resumeSubscription,
    purchaseCreditPack,
  };
}
