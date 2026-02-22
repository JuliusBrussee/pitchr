import { describe, expect, it } from 'vitest';
import { normalizeStoredAnalysis } from '@/services/analysisNormalizationService';
import { SAMPLE_RESULT } from '@/config/sampleResult';

describe('analysisNormalizationService economics backfill', () => {
  it('backfills missing money_saved_vs_coach_usd for legacy economics', () => {
    const legacy = {
      ...SAMPLE_RESULT,
      meta: {
        ...SAMPLE_RESULT.meta,
        economics: {
          estimated_input_tokens: 1600,
          estimated_output_tokens: 850,
          estimated_cost_usd: 2.5,
          manual_baseline_minutes: 16,
          agent_runtime_minutes: 2.5,
          time_saved_minutes: 13.5,
          score_delta_vs_previous_mode_run: 7,
          quality_bonus_usd: 5.25,
          estimated_value_usd: 18.2,
          roi_multiple: 7.28,
          gross_margin_usd: 15.7,
        },
      },
    };

    const normalized = normalizeStoredAnalysis(legacy, false);
    const economics = normalized.meta.economics;

    expect(economics).toBeDefined();
    expect(economics?.money_saved_vs_coach_usd).toBeGreaterThan(economics?.estimated_cost_usd ?? 0);
    expect(economics?.money_saved_vs_coach_usd).toBeLessThanOrEqual(
      (economics?.estimated_cost_usd ?? 0) + 12,
    );
    expect(economics?.coach_hourly_rate_usd).toBe(200);
  });
});
