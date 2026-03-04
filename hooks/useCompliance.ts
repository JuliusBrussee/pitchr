'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import type {
  ComplianceAcceptRequest,
  ComplianceAcceptResponse,
  ComplianceConsentsRequest,
  ComplianceConsentsResponse,
  ComplianceStatusResponse,
} from '@/types/compliance';

export const ANALYTICS_OPT_IN_STORAGE_KEY = 'pitchr_analytics_opt_in';
export const MARKETING_OPT_IN_STORAGE_KEY = 'pitchr_marketing_opt_in';

function persistConsentFlags(status: ComplianceStatusResponse): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ANALYTICS_OPT_IN_STORAGE_KEY, String(status.analyticsOptIn));
  localStorage.setItem(MARKETING_OPT_IN_STORAGE_KEY, String(status.marketingOptIn));
  window.dispatchEvent(new Event('pitchr:consent-updated'));
}

interface UseComplianceReturn {
  status: ComplianceStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<ComplianceStatusResponse>;
  accept: (input: ComplianceAcceptRequest) => Promise<ComplianceStatusResponse>;
  updateConsents: (input: ComplianceConsentsRequest) => Promise<ComplianceStatusResponse>;
}

export function useCompliance(): UseComplianceReturn {
  const [status, setStatus] = useState<ComplianceStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetchEdge('compliance-status');
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof payload?.error === 'string'
        ? payload.error
        : `Failed to load compliance status (${response.status}).`;
      throw new Error(message);
    }

    const nextStatus = payload as ComplianceStatusResponse;
    setStatus(nextStatus);
    persistConsentFlags(nextStatus);
    return nextStatus;
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const next = await refresh();
        if (!active) return;
        setStatus(next);
        setError(null);
      } catch (caughtError) {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load compliance status.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refresh]);

  const accept = useCallback(async (input: ComplianceAcceptRequest) => {
    const response = await fetchEdge('compliance-accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof payload?.error === 'string'
        ? payload.error
        : `Failed to save compliance acknowledgement (${response.status}).`;
      throw new Error(message);
    }

    const body = payload as ComplianceAcceptResponse;
    setStatus(body.status);
    persistConsentFlags(body.status);
    setError(null);
    return body.status;
  }, []);

  const updateConsents = useCallback(async (input: ComplianceConsentsRequest) => {
    const response = await fetchEdge('compliance-consents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof payload?.error === 'string'
        ? payload.error
        : `Failed to update consent preferences (${response.status}).`;
      throw new Error(message);
    }

    const body = payload as ComplianceConsentsResponse;
    setStatus(body.status);
    persistConsentFlags(body.status);
    setError(null);
    return body.status;
  }, []);

  return {
    status,
    isLoading,
    error,
    refresh,
    accept,
    updateConsents,
  };
}
