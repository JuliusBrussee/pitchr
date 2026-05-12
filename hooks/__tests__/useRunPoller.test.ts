import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRunPoller } from '@/hooks/useRunPoller';

const mockFetchEdge = vi.fn();
vi.mock('@/lib/supabase/fetch-edge', () => ({
  fetchEdge: (...args: unknown[]) => mockFetchEdge(...args),
}));

function makeRunResponse(status: string, overrides = {}) {
  return new Response(
    JSON.stringify({ run: { id: 'run-1', status, overallScore: 0, ...overrides } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

describe('useRunPoller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null run when runId is null', () => {
    const { result } = renderHook(() => useRunPoller(null));
    expect(result.current.run).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockFetchEdge).not.toHaveBeenCalled();
  });

  it('does not poll when enabled=false', () => {
    renderHook(() => useRunPoller('run-1', { enabled: false }));
    expect(mockFetchEdge).not.toHaveBeenCalled();
  });

  it('fetches run on mount when enabled=true', async () => {
    mockFetchEdge.mockResolvedValue(makeRunResponse('complete'));
    const { result } = renderHook(() => useRunPoller('run-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.run?.status).toBe('complete');
    expect(result.current.error).toBeNull();
  });

  it('sets loading=true while queued/running and schedules next poll', async () => {
    mockFetchEdge.mockResolvedValue(makeRunResponse('queued'));
    const { result } = renderHook(() => useRunPoller('run-1'));
    await waitFor(() => expect(mockFetchEdge).toHaveBeenCalledTimes(1));
    expect(result.current.run?.status).toBe('queued');
    expect(result.current.loading).toBe(true);
    // Advance timer to trigger next poll
    mockFetchEdge.mockResolvedValue(makeRunResponse('complete'));
    await act(async () => { vi.advanceTimersByTime(3000); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.run?.status).toBe('complete');
  });

  it('sets error on non-ok response', async () => {
    mockFetchEdge.mockResolvedValue(new Response('{}', { status: 500 }));
    const { result } = renderHook(() => useRunPoller('run-1'));
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.run).toBeNull();
  });

  it('stops polling when enabled changes to false', async () => {
    mockFetchEdge.mockResolvedValue(makeRunResponse('queued'));
    const { result, rerender } = renderHook(
      ({ enabled }) => useRunPoller('run-1', { enabled }),
      { initialProps: { enabled: true } },
    );
    await waitFor(() => expect(mockFetchEdge).toHaveBeenCalledTimes(1));
    rerender({ enabled: false });
    vi.clearAllMocks();
    await act(async () => { vi.advanceTimersByTime(10_000); });
    expect(mockFetchEdge).not.toHaveBeenCalled();
  });
});
