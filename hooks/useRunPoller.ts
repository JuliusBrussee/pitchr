'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import type { Run, RunStatus } from '@/types/pitch';

function getRunPollMs(): { initial: number; max: number; step: number } {
  const initialRaw = process.env.NEXT_PUBLIC_RUN_POLL_INITIAL_MS;
  const maxRaw = process.env.NEXT_PUBLIC_RUN_POLL_MAX_MS;
  const stepRaw = process.env.NEXT_PUBLIC_RUN_POLL_STEP_MS;
  const initial = Number.parseInt(initialRaw ?? '', 10);
  const max = Number.parseInt(maxRaw ?? '', 10);
  const step = Number.parseInt(stepRaw ?? '', 10);
  return {
    initial: Number.isFinite(initial) && initial >= 1_000 ? initial : 2_000,
    max: Number.isFinite(max) && max >= 2_000 ? max : 8_000,
    step: Number.isFinite(step) && step >= 250 ? step : 500,
  };
}

interface UseRunPollerOptions {
  /** When false, no fetch or polling is performed. Default: true */
  enabled?: boolean;
}

interface UseRunPollerResult {
  run: Run | null;
  status: RunStatus | null;
  loading: boolean;
  error: string | null;
}

export function useRunPoller(
  runId: string | null,
  options?: UseRunPollerOptions,
): UseRunPollerResult {
  const enabled = options?.enabled ?? true;
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use a ref for enabled so the polling loop always reads the latest value
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const fetch = useCallback(async () => {
    if (!runId || !enabledRef.current) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const polling = getRunPollMs();
    let nextDelayMs = polling.initial;
    let isFetching = false;
    const pollStartedAt = Date.now();
    const POLL_TIMEOUT_MS = 90_000;

    const pollRun = async () => {
      if (isFetching || !enabledRef.current) return;
      isFetching = true;
      try {
        const response = await fetchEdge('pitch-run-detail', {
          cache: 'no-store',
          params: { runId },
        });
        if (cancelled || !enabledRef.current) return;
        if (!response.ok) {
          setRun(null);
          setError('Failed to load run.');
          setLoading(false);
          return;
        }
        const payload = (await response.json()) as { run?: Run } | Run;
        const nextRun = (payload as { run?: Run }).run ?? (payload as Run);
        if (!nextRun?.id) {
          setRun(null);
          setError('Run not found.');
          setLoading(false);
          return;
        }
        if (cancelled || !enabledRef.current) return;
        setRun(nextRun);
        if (nextRun.status === 'queued' || nextRun.status === 'running') {
          if (Date.now() - pollStartedAt > POLL_TIMEOUT_MS) {
            setError('Analysis is taking longer than expected. Please try again.');
            setLoading(false);
            return;
          }
          setLoading(true);
          const delay =
            typeof document !== 'undefined' && document.visibilityState === 'hidden'
              ? Math.min(nextDelayMs * 2, polling.max)
              : nextDelayMs;
          timer = setTimeout(() => {
            nextDelayMs = Math.min(nextDelayMs + polling.step, polling.max);
            void pollRun();
          }, delay);
          return;
        }
        setLoading(false);
        setError(null);
      } catch {
        if (cancelled || !enabledRef.current) return;
        setRun(null);
        setError('Failed to load run.');
        setLoading(false);
      } finally {
        isFetching = false;
      }
    };

    setLoading(true);
    setError(null);
    void pollRun();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [runId]);

  useEffect(() => {
    if (!runId || !enabled) {
      setRun(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cleanup: (() => void) | undefined;
    void fetch().then((c) => { cleanup = c; });
    return () => { cleanup?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, enabled]);

  return {
    run,
    status: run?.status ?? null,
    loading,
    error,
  };
}
