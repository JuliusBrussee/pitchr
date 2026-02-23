import { describe, expect, it } from 'vitest';
import { computeRunStats, type RunRecord } from '@/services/runService';
import { SAMPLE_RESULT } from '@/config/sampleResult';

function makeRun(partial: Partial<RunRecord>): RunRecord {
  return {
    id: 'run',
    user_id: 'test-user-id',
    mode: 'vc_pitch',
    status: 'complete',
    error_message: null,
    started_at: null,
    completed_at: null,
    input_type: 'text',
    transcript: 't',
    audio_url: null,
    overall_score: 70,
    analysis: SAMPLE_RESULT,
    meta: SAMPLE_RESULT.meta,
    deck_id: null,
    is_fallback: false,
    created_at: new Date().toISOString(),
    ...partial,
  };
}

describe('computeRunStats', () => {
  it('ignores queued/running/failed runs in score stats', () => {
    const runs: RunRecord[] = [
      makeRun({ id: 'queued', status: 'queued', overall_score: 0 }),
      makeRun({ id: 'running', status: 'running', overall_score: 0 }),
      makeRun({ id: 'failed', status: 'failed', overall_score: 0 }),
      makeRun({ id: 'complete-1', status: 'complete', overall_score: 60 }),
      makeRun({ id: 'complete-2', status: 'complete', overall_score: 80 }),
    ];

    const stats = computeRunStats(runs);
    expect(stats.totalRuns).toBe(2);
    expect(stats.averageScore).toBe(70);
    expect(stats.bestScore).toBe(80);
    expect(stats.trend).toEqual([80, 60]);
  });
});
