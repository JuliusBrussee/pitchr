import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AnalysisTrackerProvider, useAnalysisTracker } from '@/views/components/AnalysisTrackerProvider';

const mockFetchEdge = vi.fn();
vi.mock('@/lib/supabase/fetch-edge', () => ({
  fetchEdge: (...args: unknown[]) => mockFetchEdge(...args),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

function makeRunResponse(status: string) {
  return new Response(
    JSON.stringify({ run: { id: 'run-1', status, overallScore: 0 } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  React.createElement(AnalysisTrackerProvider, null, children)
);

describe('AnalysisTrackerProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'localStorage', 'get').mockReturnValue(localStorageMock as unknown as Storage);
    localStorageMock.clear();
  });

  it('starts with no active run', () => {
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    expect(result.current.activeRunId).toBeNull();
    expect(result.current.isPolling).toBe(false);
  });

  it('startTracking sets activeRunId and persists to localStorage', () => {
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    act(() => { result.current.startTracking('run-abc'); });
    expect(result.current.activeRunId).toBe('run-abc');
    expect(localStorageMock.getItem('pitchr_active_run_id')).toBe('run-abc');
  });

  it('stopTracking clears activeRunId and localStorage', async () => {
    mockFetchEdge.mockResolvedValue(makeRunResponse('queued'));
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    act(() => { result.current.startTracking('run-abc'); });
    await waitFor(() => expect(result.current.isPolling).toBe(true));
    act(() => { result.current.stopTracking(); });
    expect(result.current.activeRunId).toBeNull();
    expect(localStorageMock.getItem('pitchr_active_run_id')).toBeNull();
  });

  it('resumes tracking from localStorage on mount', async () => {
    localStorageMock.setItem('pitchr_active_run_id', 'run-persisted');
    mockFetchEdge.mockResolvedValue(makeRunResponse('queued'));
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    await waitFor(() => expect(result.current.activeRunId).toBe('run-persisted'));
  });

  it('dispatches billing:refresh when run completes', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    mockFetchEdge.mockResolvedValue(makeRunResponse('complete'));
    const { result } = renderHook(() => useAnalysisTracker(), { wrapper });
    act(() => { result.current.startTracking('run-abc'); });
    await waitFor(() => expect(result.current.activeRun?.status).toBe('complete'));
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'billing:refresh' }));
  });
});
