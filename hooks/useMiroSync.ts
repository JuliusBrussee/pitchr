"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MiroSyncSnapshot } from "@/services/miro/miroTypes";

interface UseMiroSyncOptions {
  runId: string;
  boardId?: string;
  enabled: boolean;
  pollIntervalMs?: number;
}

interface UseMiroSyncResult {
  snapshot: MiroSyncSnapshot | null;
  isSyncing: boolean;
  error: string | null;
  syncNow: () => Promise<void>;
  consecutiveFailures: number;
}

function computeBackoff(baseMs: number, failures: number) {
  const multiplier = Math.min(8, 2 ** failures);
  return baseMs * multiplier;
}

export function useMiroSync({
  runId,
  boardId,
  enabled,
  pollIntervalMs = 30_000,
}: UseMiroSyncOptions): UseMiroSyncResult {
  const [snapshot, setSnapshot] = useState<MiroSyncSnapshot | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const failuresRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const syncNow = useCallback(async () => {
    if (!enabled || !boardId) return;

    setIsSyncing(true);
    try {
      const params = new URLSearchParams({
        runId,
        boardId,
      });
      const response = await fetch(`/api/miro/fix-board/sync?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const json = (await response.json()) as MiroSyncSnapshot & { error?: string };
      if (!response.ok) {
        throw new Error(json.error || "Failed to sync Miro board");
      }

      if (!mountedRef.current) return;
      failuresRef.current = 0;
      setConsecutiveFailures(0);
      setError(null);
      setSnapshot(json);
    } catch (err) {
      if (!mountedRef.current) return;
      failuresRef.current += 1;
      setConsecutiveFailures(failuresRef.current);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, [boardId, enabled, runId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled || !boardId) return;

    let stopped = false;

    const schedule = () => {
      if (stopped) return;
      const delay = computeBackoff(pollIntervalMs, failuresRef.current);
      timerRef.current = setTimeout(async () => {
        if (document.visibilityState === "visible") {
          await syncNow();
        }
        schedule();
      }, delay);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncNow();
      }
    };

    void syncNow();
    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [boardId, enabled, pollIntervalMs, syncNow]);

  return {
    snapshot,
    isSyncing,
    error,
    syncNow,
    consecutiveFailures,
  };
}

