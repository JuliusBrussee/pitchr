import { afterEach, describe, expect, it } from 'vitest';
import { SAMPLE_RESULT } from '@/config/sampleResult';
import { buildRunEconomics, estimateTokensByChars } from '@/services/economicsService';

const ORIGINAL_ENV = { ...process.env };

function restoreEnv(): void {
  process.env = { ...ORIGINAL_ENV };
}

describe('economicsService', () => {
  afterEach(() => {
    restoreEnv();
  });

  it('estimates tokens using ceil(charCount/4)', () => {
    expect(estimateTokensByChars('')).toBe(0);
    expect(estimateTokensByChars('abc')).toBe(1);
    expect(estimateTokensByChars('abcd')).toBe(1);
    expect(estimateTokensByChars('abcde')).toBe(2);
  });

  it('computes deterministic run economics with env-configured pricing and value rates', () => {
    process.env.COACH_HOURLY_RATE_USD = '200';
    process.env.VALUE_PER_SCORE_POINT_USD = '3';
    process.env.ANTHROPIC_INPUT_PER_1M_USD = '4';
    process.env.ANTHROPIC_OUTPUT_PER_1M_USD = '10';
    process.env.MANUAL_BASELINE_VC_MIN = '30';
    process.env.ECON_PLATFORM_OVERHEAD_USD = '1';
    process.env.ECON_MIN_RUN_COST_USD = '2';
    process.env.ECON_OPERATIONS_BUFFER_MIN = '2';
    process.env.ECON_QUALITY_BONUS_MAX_POINTS = '5';
    process.env.ECON_SAVINGS_REALIZATION_RATE = '0.5';
    process.env.ECON_MAX_SAVED_MINUTES = '30';

    const transcript = 'A concise investor pitch transcript.';
    const outputs = SAMPLE_RESULT.outputs;
    const promptLikeInput = 'vc_pitch\nA concise investor pitch transcript.';
    const expectedInputTokens = estimateTokensByChars(promptLikeInput);
    const expectedOutputTokens = estimateTokensByChars(JSON.stringify(outputs));
    const expectedCost =
      (expectedInputTokens / 1_000_000) * 4 +
      (expectedOutputTokens / 1_000_000) * 10;
    const expectedEstimatedCost = Math.max(expectedCost + 1, 2);
    const expectedTimeSavedMinutes = 8.4;
    const expectedTimeValueUsd = 14;
    const expectedQualityBonusUsd = 15;
    const expectedValueUsd = expectedTimeValueUsd;
    const expectedRoi = expectedValueUsd / Math.max(expectedEstimatedCost, 0.0001);

    const economics = buildRunEconomics({
      transcript,
      mode: 'vc_pitch',
      outputs,
      providerUsed: 'anthropic',
      overallScore: 72,
      previousModeScore: 60,
      agentRuntimeMs: 6 * 60_000,
    });

    expect(economics.model_cost_usd).toBeCloseTo(expectedCost, 6);
    expect(economics.platform_overhead_usd).toBe(1);
    expect(economics.cost_floor_usd).toBe(2);
    expect(economics.coach_hourly_rate_usd).toBe(200);
    expect(economics.savings_realization_rate).toBe(0.5);
    expect(economics.estimated_input_tokens).toBe(expectedInputTokens);
    expect(economics.estimated_output_tokens).toBe(expectedOutputTokens);
    expect(economics.estimated_cost_usd).toBeCloseTo(expectedEstimatedCost, 6);
    expect(economics.manual_baseline_minutes).toBe(30);
    expect(economics.agent_runtime_minutes).toBe(8);
    expect(economics.time_saved_minutes).toBe(expectedTimeSavedMinutes);
    expect(economics.money_saved_vs_coach_usd).toBe(expectedTimeValueUsd);
    expect(economics.score_delta_vs_previous_mode_run).toBe(12);
    expect(economics.quality_bonus_usd).toBe(expectedQualityBonusUsd);
    expect(economics.estimated_value_usd).toBe(expectedValueUsd);
    expect(economics.roi_multiple).toBeCloseTo(expectedRoi, 2);
    expect(economics.gross_margin_usd).toBeCloseTo(
      expectedValueUsd - expectedEstimatedCost,
      2,
    );
  });
});
