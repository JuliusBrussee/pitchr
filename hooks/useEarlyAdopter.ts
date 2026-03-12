'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isEarlyAdopterPeriod, getEarlyAdopterDaysRemaining, EARLY_ADOPTER_EXPIRY } from '@/config/early-adopter';

interface EarlyAdopterState {
  isActive: boolean;
  eligible: boolean;
  claimed: boolean;
  daysRemaining: number;
  expiresAt: string;
  isLoading: boolean;
  justClaimed: boolean;
}

export function useEarlyAdopter(): EarlyAdopterState {
  const [state, setState] = useState<EarlyAdopterState>({
    isActive: isEarlyAdopterPeriod(),
    eligible: false,
    claimed: false,
    daysRemaining: getEarlyAdopterDaysRemaining(),
    expiresAt: EARLY_ADOPTER_EXPIRY.toISOString(),
    isLoading: true,
    justClaimed: false,
  });

  const hasRun = useRef(false);

  const checkAndClaim = useCallback(async () => {
    if (!isEarlyAdopterPeriod()) {
      setState((s) => ({ ...s, isActive: false, isLoading: false }));
      return;
    }

    try {
      const res = await fetch('/api/early-adopter');
      if (!res.ok) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      const data = await res.json();

      if (data.claimed || !data.eligible) {
        setState((s) => ({
          ...s,
          ...data,
          isLoading: false,
        }));
        return;
      }

      // Eligible — auto-claim
      const claimRes = await fetch('/api/early-adopter', { method: 'POST' });
      if (claimRes.ok) {
        setState((s) => ({
          ...s,
          eligible: false,
          claimed: true,
          daysRemaining: data.daysRemaining,
          expiresAt: data.expiresAt,
          isActive: true,
          isLoading: false,
          justClaimed: true,
        }));
        // Trigger billing refresh so credit balance updates
        window.dispatchEvent(new Event('billing:refresh'));
      } else {
        setState((s) => ({ ...s, ...data, isLoading: false }));
      }
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    void checkAndClaim();
  }, [checkAndClaim]);

  return state;
}
