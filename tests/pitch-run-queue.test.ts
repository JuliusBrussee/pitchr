import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SAMPLE_RESULT } from '@/config/sampleResult';
import { enqueuePitchRun } from '@/services/pitchRunQueueService';
import { analyzePitch } from '@/services/analysisService';
import { buildRunEconomics } from '@/services/economicsService';
import { syncRunToPaid } from '@/services/paidService';
import { listRuns, updateRun } from '@/services/runService';

vi.mock('@/services/analysisService', () => ({
  analyzePitch: vi.fn(),
}));

vi.mock('@/services/runService', () => ({
  updateRun: vi.fn(),
  listRuns: vi.fn(),
}));

vi.mock('@/services/economicsService', () => ({
  buildRunEconomics: vi.fn(),
}));

vi.mock('@/services/paidService', () => ({
  syncRunToPaid: vi.fn(),
}));

describe('pitchRunQueueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateRun).mockResolvedValue({} as never);
    vi.mocked(listRuns).mockResolvedValue([
      {
        id: 'older-run',
        mode: 'vc_pitch',
        status: 'complete',
        overall_score: 63,
      } as never,
    ]);
    vi.mocked(buildRunEconomics).mockReturnValue({
      estimated_input_tokens: 1800,
      estimated_output_tokens: 900,
      estimated_cost_usd: 0.021,
      manual_baseline_minutes: 30,
      agent_runtime_minutes: 2.4,
      time_saved_minutes: 27.6,
      score_delta_vs_previous_mode_run: 17,
      quality_bonus_usd: 34,
      estimated_value_usd: 103,
      roi_multiple: 4904.76,
      gross_margin_usd: 102.98,
    });
    vi.mocked(syncRunToPaid).mockResolvedValue({
      status: 'sent',
      sent_at: new Date().toISOString(),
    });
    vi.mocked(analyzePitch).mockResolvedValue({
      analysis: {
        ...SAMPLE_RESULT,
        meta: {
          ...SAMPLE_RESULT.meta,
          provider_used: 'anthropic',
          fallback_used: false,
          latency_ms: 2400,
        },
      },
      fallback: false,
    });
  });

  it('persists economics and paid sync status for completed runs', async () => {
    enqueuePitchRun({
      runId: 'run-queue-1',
      mode: 'vc_pitch',
      transcript: 'test transcript',
      deckText: 'deck context',
    });

    await waitFor(() => {
      expect(updateRun).toHaveBeenCalledTimes(3);
    });

    const completeCall = vi.mocked(updateRun).mock.calls[1];
    expect(completeCall?.[0]).toBe('run-queue-1');
    expect(completeCall?.[1]).toMatchObject({
      status: 'complete',
      overall_score: SAMPLE_RESULT.outputs.feedback.overall_score,
      analysis: {
        meta: {
          economics: {
            estimated_cost_usd: 0.021,
            estimated_value_usd: 103,
          },
        },
      },
    });

    const paidSyncCall = vi.mocked(updateRun).mock.calls[2];
    expect(paidSyncCall?.[1]).toMatchObject({
      analysis: {
        meta: {
          economics: {
            paid_sync: {
              status: 'sent',
            },
          },
        },
      },
    });
    expect(syncRunToPaid).toHaveBeenCalledTimes(1);
  });
});
