'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRunPoller } from '@/hooks/useRunPoller';
import type { Run, RunStatus } from '@/types/pitch';

const LS_KEY = 'pitchr_active_run_id';

interface AnalysisTrackerState {
  activeRunId: string | null;
  activeRun: Run | null;
  activeRunStatus: RunStatus | null;
  isPolling: boolean;
  error: string | null;
  startTracking: (runId: string) => void;
  stopTracking: () => void;
}

const AnalysisTrackerContext = createContext<AnalysisTrackerState | null>(null);

export function useAnalysisTracker(): AnalysisTrackerState {
  const ctx = useContext(AnalysisTrackerContext);
  if (!ctx) throw new Error('useAnalysisTracker must be used inside AnalysisTrackerProvider');
  return ctx;
}

export function AnalysisTrackerProvider({ children }: { children: React.ReactNode }) {
  const [activeRunId, setActiveRunId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(LS_KEY); } catch { return null; }
  });

  // Stop polling once run reaches terminal state
  const terminalRef = useRef(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const { run, status, loading, error } = useRunPoller(activeRunId, {
    enabled: Boolean(activeRunId) && pollingEnabled,
  });

  // Fire billing:refresh and stop polling when analysis finishes
  useEffect(() => {
    if (!run) return;
    if ((run.status === 'complete' || run.status === 'failed') && !terminalRef.current) {
      terminalRef.current = true;
      setPollingEnabled(false);
      window.dispatchEvent(new Event('billing:refresh'));
    }
  }, [run]);

  const startTracking = useCallback((runId: string) => {
    terminalRef.current = false;
    setPollingEnabled(true);
    setActiveRunId(runId);
    try { localStorage.setItem(LS_KEY, runId); } catch {}
  }, []);

  const stopTracking = useCallback(() => {
    setActiveRunId(null);
    setPollingEnabled(false);
    terminalRef.current = false;
    try { localStorage.removeItem(LS_KEY); } catch {}
  }, []);

  return (
    <AnalysisTrackerContext.Provider
      value={{
        activeRunId,
        activeRun: run,
        activeRunStatus: status,
        isPolling: loading,
        error,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </AnalysisTrackerContext.Provider>
  );
}
