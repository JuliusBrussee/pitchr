import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mock all service-layer dependencies before importing route handlers
// ---------------------------------------------------------------------------

const mockListRuns = vi.fn();
const mockComputeRunStats = vi.fn();
const mockRunPitchAnalysisController = vi.fn();
const mockListQASessionSummariesByRunIds = vi.fn();

vi.mock('@/services/runService', () => ({
  listRuns: (...args: unknown[]) => mockListRuns(...args),
  computeRunStats: (...args: unknown[]) => mockComputeRunStats(...args),
}));

vi.mock('@/controllers/pitchController', () => ({
  PitchValidationError: class PitchValidationError extends Error {},
  runPitchAnalysisController: (...args: unknown[]) => mockRunPitchAnalysisController(...args),
}));

vi.mock('@/services/qnaSessionService', () => ({
  listQASessionSummariesByRunIds: (...args: unknown[]) => mockListQASessionSummariesByRunIds(...args),
}));

vi.mock('@/lib/supabase/auth-helpers', () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    supabase: {},
    user: { id: 'test-user-id' },
  }),
  AuthenticationError: class AuthenticationError extends Error {},
}));

// Import route handlers after mocks are set up
import { GET, POST } from '@/app/api/pitch/run/route';

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

function makeRunRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'run-1',
    mode: 'vc_pitch',
    status: 'complete',
    error_message: null,
    started_at: null,
    completed_at: null,
    input_type: 'text',
    transcript: 'test transcript',
    audio_url: null,
    overall_score: 65,
    analysis: {
      analysisVersion: 'v2',
      coverage: 'spoken_only',
      outputs: {
        feedback: {
          overall_score: 65,
          one_line_verdict: 'Getting There',
          rubric_breakdown: [],
          top_fixes: [],
          rewrite_script: '',
          delivery_metrics: {},
        },
        qa_1min: {},
      },
      meta: {
        provider_used: 'anthropic',
        fallback_used: false,
        cache_hit: false,
        llm_calls_used: 1,
        latency_ms: 2000,
        attempt_count: 1,
      },
    },
    meta: null,
    deck_id: null,
    is_fallback: false,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('GET /api/pitch/run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListQASessionSummariesByRunIds.mockResolvedValue(new Map());
  });

  it('returns 200 with runs and stats', async () => {
    const run = makeRunRecord();
    mockListRuns.mockResolvedValue([run]);
    mockComputeRunStats.mockReturnValue({
      totalRuns: 1,
      averageScore: 65,
      bestScore: 65,
      trend: [65],
    });

    const request = makeRequest('/api/pitch/run');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.runs).toHaveLength(1);
    expect(body.runs[0].id).toBe('run-1');
    expect(body.stats).toBeDefined();
  });

  it('filters by mode when provided', async () => {
    mockListRuns.mockResolvedValue([]);
    mockComputeRunStats.mockReturnValue({ totalRuns: 0, averageScore: 0, bestScore: 0, trend: [] });

    const request = makeRequest('/api/pitch/run?mode=elevator');
    await GET(request);

    expect(mockListRuns).toHaveBeenCalledWith(expect.anything(), { mode: 'elevator' });
  });

  it('filters completed runs by default (excludes pending)', async () => {
    const complete = makeRunRecord({ id: 'r1', status: 'complete' });
    const queued = makeRunRecord({ id: 'r2', status: 'queued' });
    mockListRuns.mockResolvedValue([complete, queued]);
    mockComputeRunStats.mockReturnValue({ totalRuns: 1, averageScore: 65, bestScore: 65, trend: [65] });

    const request = makeRequest('/api/pitch/run');
    const response = await GET(request);
    const body = await response.json();

    expect(body.runs).toHaveLength(1);
    expect(body.runs[0].id).toBe('r1');
  });

  it('includes pending runs when includePending=true', async () => {
    const complete = makeRunRecord({ id: 'r1', status: 'complete' });
    const queued = makeRunRecord({ id: 'r2', status: 'queued' });
    mockListRuns.mockResolvedValue([complete, queued]);
    mockComputeRunStats.mockReturnValue({ totalRuns: 2, averageScore: 65, bestScore: 65, trend: [65] });

    const request = makeRequest('/api/pitch/run?includePending=true');
    const response = await GET(request);
    const body = await response.json();

    expect(body.runs).toHaveLength(2);
  });

  it('respects limit parameter', async () => {
    const runs = [
      makeRunRecord({ id: 'r1' }),
      makeRunRecord({ id: 'r2' }),
      makeRunRecord({ id: 'r3' }),
    ];
    mockListRuns.mockResolvedValue(runs);
    mockComputeRunStats.mockReturnValue({ totalRuns: 3, averageScore: 65, bestScore: 65, trend: [] });

    const request = makeRequest('/api/pitch/run?limit=2');
    const response = await GET(request);
    const body = await response.json();

    expect(body.runs).toHaveLength(2);
  });

  it('returns 500 on service error', async () => {
    mockListRuns.mockRejectedValue(new Error('DB connection failed'));

    const request = makeRequest('/api/pitch/run');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain('DB connection failed');
  });

  it('gracefully handles QA session fetch failure', async () => {
    mockListRuns.mockResolvedValue([makeRunRecord()]);
    mockComputeRunStats.mockReturnValue({ totalRuns: 1, averageScore: 65, bestScore: 65, trend: [65] });
    mockListQASessionSummariesByRunIds.mockRejectedValue(new Error('QA service down'));

    const request = makeRequest('/api/pitch/run');
    const response = await GET(request);

    expect(response.status).toBe(200); // Should still succeed
  });
});

describe('POST /api/pitch/run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 for complete result', async () => {
    mockRunPitchAnalysisController.mockResolvedValue({
      runId: 'new-run',
      status: 'complete',
      analysis: {},
    });

    const request = makeRequest('/api/pitch/run', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'We build tools.',
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.runId).toBe('new-run');
  });

  it('returns 202 for queued result', async () => {
    mockRunPitchAnalysisController.mockResolvedValue({
      runId: 'queued-run',
      status: 'queued',
    });

    const request = makeRequest('/api/pitch/run', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'We build tools.',
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(202);
  });

  it('returns 400 for invalid JSON body', async () => {
    const request = new NextRequest(new URL('/api/pitch/run', 'http://localhost:3000'), {
      method: 'POST',
      body: 'not json',
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid JSON');
  });

  it('returns 400 for validation error', async () => {
    const { PitchValidationError } = await import('@/controllers/pitchController');
    mockRunPitchAnalysisController.mockRejectedValue(
      new PitchValidationError('Invalid mode'),
    );

    const request = makeRequest('/api/pitch/run', {
      method: 'POST',
      body: JSON.stringify({ mode: 'bad' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 500 for unexpected error', async () => {
    mockRunPitchAnalysisController.mockRejectedValue(new Error('Something broke'));

    const request = makeRequest('/api/pitch/run', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'test',
      }),
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
