import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetRun = vi.fn();
const mockDeleteRun = vi.fn();
const mockDeleteRecordingByUrl = vi.fn();
const mockListQASessionSummariesByRunIds = vi.fn();

vi.mock('@/services/runService', () => {
  class RunNotFoundError extends Error {
    constructor(runId: string) {
      super(`Run not found: ${runId}`);
    }
  }
  return {
    getRun: (...args: unknown[]) => mockGetRun(...args),
    deleteRun: (...args: unknown[]) => mockDeleteRun(...args),
    RunNotFoundError,
  };
});

vi.mock('@/services/recordingService', () => ({
  deleteRecordingByUrl: (...args: unknown[]) => mockDeleteRecordingByUrl(...args),
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

import { GET, DELETE } from '@/app/api/pitch/run/[runId]/route';

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

describe('GET /api/pitch/run/[runId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListQASessionSummariesByRunIds.mockResolvedValue(new Map());
  });

  it('returns 200 with run data', async () => {
    mockGetRun.mockResolvedValue(makeRunRecord());

    const request = new NextRequest(new URL('/api/pitch/run/run-1', 'http://localhost:3000'));
    const response = await GET(request, { params: Promise.resolve({ runId: 'run-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.run.id).toBe('run-1');
    expect(body.run.overallScore).toBe(65);
  });

  it('returns 404 for non-existent run', async () => {
    const { RunNotFoundError } = await import('@/services/runService');
    mockGetRun.mockRejectedValue(new RunNotFoundError('missing-id'));

    const request = new NextRequest(new URL('/api/pitch/run/missing-id', 'http://localhost:3000'));
    const response = await GET(request, { params: Promise.resolve({ runId: 'missing-id' }) });

    expect(response.status).toBe(404);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetRun.mockRejectedValue(new Error('DB down'));

    const request = new NextRequest(new URL('/api/pitch/run/run-1', 'http://localhost:3000'));
    const response = await GET(request, { params: Promise.resolve({ runId: 'run-1' }) });

    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/pitch/run/[runId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 on successful delete', async () => {
    mockGetRun.mockResolvedValue(makeRunRecord({ audio_url: null }));
    mockDeleteRun.mockResolvedValue(undefined);

    const request = new NextRequest(new URL('/api/pitch/run/run-1', 'http://localhost:3000'));
    const response = await DELETE(request, { params: Promise.resolve({ runId: 'run-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.deleted).toBe(true);
  });

  it('deletes recording when audio_url exists', async () => {
    mockGetRun.mockResolvedValue(makeRunRecord({ audio_url: 'https://storage.example.com/recording.webm' }));
    mockDeleteRun.mockResolvedValue(undefined);
    mockDeleteRecordingByUrl.mockResolvedValue(undefined);

    const request = new NextRequest(new URL('/api/pitch/run/run-1', 'http://localhost:3000'));
    await DELETE(request, { params: Promise.resolve({ runId: 'run-1' }) });

    expect(mockDeleteRecordingByUrl).toHaveBeenCalledWith(expect.anything(), 'https://storage.example.com/recording.webm');
  });

  it('still deletes run if recording cleanup fails', async () => {
    mockGetRun.mockResolvedValue(makeRunRecord({ audio_url: 'https://storage.example.com/recording.webm' }));
    mockDeleteRecordingByUrl.mockRejectedValue(new Error('Storage error'));
    mockDeleteRun.mockResolvedValue(undefined);

    const request = new NextRequest(new URL('/api/pitch/run/run-1', 'http://localhost:3000'));
    const response = await DELETE(request, { params: Promise.resolve({ runId: 'run-1' }) });

    expect(response.status).toBe(200);
    expect(mockDeleteRun).toHaveBeenCalled();
  });

  it('returns 404 for non-existent run', async () => {
    const { RunNotFoundError } = await import('@/services/runService');
    mockGetRun.mockRejectedValue(new Error('fetch fail'));
    mockDeleteRun.mockRejectedValue(new RunNotFoundError('missing'));

    const request = new NextRequest(new URL('/api/pitch/run/missing', 'http://localhost:3000'));
    const response = await DELETE(request, { params: Promise.resolve({ runId: 'missing' }) });

    expect(response.status).toBe(404);
  });
});
