import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePitchRun } from '@/hooks/usePitchRun';

// Mock fetchEdge instead of global fetch
const mockFetchEdge = vi.fn();
vi.mock('@/lib/supabase/fetch-edge', () => ({
  fetchEdge: (...args: unknown[]) => mockFetchEdge(...args),
  edgeFunctionUrl: vi.fn(),
  getEdgeHeaders: vi.fn(),
}));

describe('usePitchRun', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with isAnalyzing=false and error=null', () => {
    const { result } = renderHook(() => usePitchRun());
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets isAnalyzing to true during analysis', async () => {
    let resolveResponse!: (value: Response) => void;
    mockFetchEdge.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      }),
    );

    const { result } = renderHook(() => usePitchRun());
    let analysisPromise: Promise<unknown>;

    act(() => {
      analysisPromise = result.current.runPitchAnalysis({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'Test pitch.',
      });
    });

    expect(result.current.isAnalyzing).toBe(true);

    await act(async () => {
      resolveResponse(
        new Response(
          JSON.stringify({ runId: 'run-1', status: 'queued' }),
          { status: 202, headers: { 'content-type': 'application/json' } },
        ),
      );
      await analysisPromise;
    });

    expect(result.current.isAnalyzing).toBe(false);
  });

  it('returns run data on successful response', async () => {
    mockFetchEdge.mockResolvedValue(
      new Response(
        JSON.stringify({
          runId: 'run-1',
          status: 'queued',
          analysisVersion: 'v2',
          coverage: 'spoken_only',
          fallback: false,
        }),
        { status: 202, headers: { 'content-type': 'application/json' } },
      ),
    );

    const { result } = renderHook(() => usePitchRun());
    let runResult: Awaited<ReturnType<typeof result.current.runPitchAnalysis>>;

    await act(async () => {
      runResult = await result.current.runPitchAnalysis({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'Test pitch.',
      });
    });

    expect(runResult!.runId).toBe('run-1');
    expect(runResult!.status).toBe('queued');
    expect(result.current.error).toBeNull();
  });

  it('sets error on non-ok response', async () => {
    mockFetchEdge.mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'Transcript is required.' }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      ),
    );

    const { result } = renderHook(() => usePitchRun());

    await act(async () => {
      try {
        await result.current.runPitchAnalysis({
          mode: 'vc_pitch',
          inputType: 'text',
          transcript: '',
        });
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Transcript is required.');
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('sets error on network failure', async () => {
    mockFetchEdge.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePitchRun());

    await act(async () => {
      try {
        await result.current.runPitchAnalysis({
          mode: 'vc_pitch',
          inputType: 'text',
          transcript: 'Test.',
        });
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('calls fetchEdge with correct function name, method, and body', async () => {
    mockFetchEdge.mockResolvedValue(
      new Response(
        JSON.stringify({ runId: 'run-1', status: 'queued' }),
        { status: 202, headers: { 'content-type': 'application/json' } },
      ),
    );

    const { result } = renderHook(() => usePitchRun());

    await act(async () => {
      await result.current.runPitchAnalysis({
        mode: 'elevator',
        inputType: 'audio',
        transcript: 'We build tools.',
        audioUrl: 'https://example.com/audio.webm',
      });
    });

    expect(mockFetchEdge).toHaveBeenCalledWith('pitch-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'elevator',
        inputType: 'audio',
        transcript: 'We build tools.',
        audioUrl: 'https://example.com/audio.webm',
      }),
    });
  });
});
