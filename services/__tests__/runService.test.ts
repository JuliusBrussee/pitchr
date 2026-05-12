import { describe, expect, it } from 'vitest';
import { computeRunStats, RunNotFoundError } from '@/services/runService';
import type { RunRecord } from '@/services/runService';

// ---------------------------------------------------------------------------
// Mock Supabase — we only test the pure computeRunStats function and the
// error class here. The CRUD functions are thin Supabase wrappers; they're
// better covered by integration tests or by API-level tests that mock the
// service layer.
// ---------------------------------------------------------------------------

function makeRunRecord(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    id: 'run-1',
    user_id: 'test-user-id',
    mode: 'vc_pitch',
    status: 'complete',
    error_message: null,
    started_at: null,
    completed_at: null,
    input_type: 'text',
    transcript: 'test pitch',
    audio_url: null,
    overall_score: 65,
    analysis: {
      analysisVersion: 'v2',
      coverage: 'spoken_only',
      outputs: { feedback: {} as any, qa_1min: {} as any },
      meta: {
        provider_used: 'anthropic',
        fallback_used: false,
        cache_hit: false,
        llm_calls_used: 1,
        latency_ms: 2000,
        attempt_count: 1,
      },
      analysis: {} as any,
      fallback: false,
    },
    meta: null,
    deck_id: null,
    is_fallback: false,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('computeRunStats', () => {
  it('returns zeroed stats for empty array', () => {
    const stats = computeRunStats([]);
    expect(stats).toEqual({
      totalRuns: 0,
      averageScore: 0,
      bestScore: 0,
      trend: [],
    });
  });

  it('filters out non-complete runs', () => {
    const runs = [
      makeRunRecord({ id: '1', status: 'complete', overall_score: 80 }),
      makeRunRecord({ id: '2', status: 'queued', overall_score: 0 }),
      makeRunRecord({ id: '3', status: 'running', overall_score: 0 }),
      makeRunRecord({ id: '4', status: 'failed', overall_score: 0 }),
    ];
    const stats = computeRunStats(runs);
    expect(stats.totalRuns).toBe(1);
    expect(stats.averageScore).toBe(80);
    expect(stats.bestScore).toBe(80);
  });

  it('calculates averageScore correctly', () => {
    const runs = [
      makeRunRecord({ id: '1', overall_score: 60 }),
      makeRunRecord({ id: '2', overall_score: 80 }),
      makeRunRecord({ id: '3', overall_score: 70 }),
    ];
    const stats = computeRunStats(runs);
    expect(stats.totalRuns).toBe(3);
    expect(stats.averageScore).toBe(70); // (60+80+70)/3 = 70
    expect(stats.bestScore).toBe(80);
  });

  it('returns trend with at most 10 scores', () => {
    // Input is desc order (newest first). computeRunStats reverses then takes last 10.
    const runs = Array.from({ length: 15 }, (_, i) =>
      makeRunRecord({
        id: `run-${i}`,
        overall_score: 50 + i,
        created_at: `2024-01-${String(15 - i).padStart(2, '0')}T00:00:00Z`,
      }),
    );
    const stats = computeRunStats(runs);
    expect(stats.trend).toHaveLength(10);
    // All scores should be in the expected range
    stats.trend.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThanOrEqual(64);
    });
  });

  it('handles single run', () => {
    const runs = [makeRunRecord({ overall_score: 72 })];
    const stats = computeRunStats(runs);
    expect(stats.totalRuns).toBe(1);
    expect(stats.averageScore).toBe(72);
    expect(stats.bestScore).toBe(72);
    expect(stats.trend).toEqual([72]);
  });
});

describe('RunNotFoundError', () => {
  it('creates error with run ID in message', () => {
    const error = new RunNotFoundError('abc-123');
    expect(error.message).toContain('abc-123');
    expect(error).toBeInstanceOf(Error);
  });
});
