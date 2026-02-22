import type { AnalysisMeta, AnalysisOutputs, RunEconomics } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

interface BuildRunEconomicsInput {
  transcript: string;
  deckText?: string;
  mode: PitchMode;
  outputs: AnalysisOutputs;
  providerUsed: AnalysisMeta['provider_used'];
  overallScore: number;
  previousModeScore?: number | null;
  agentRuntimeMs: number;
}

const DEFAULT_COACH_HOURLY_RATE_USD = 200;
const DEFAULT_VALUE_PER_SCORE_POINT_USD = 0.75;
const DEFAULT_ANTHROPIC_INPUT_PER_1M_USD = 3;
const DEFAULT_ANTHROPIC_OUTPUT_PER_1M_USD = 15;
const DEFAULT_OPENROUTER_INPUT_PER_1M_USD = 3;
const DEFAULT_OPENROUTER_OUTPUT_PER_1M_USD = 15;
const DEFAULT_MANUAL_BASELINE_ELEVATOR_MIN = 8;
const DEFAULT_MANUAL_BASELINE_VC_MIN = 16;
const DEFAULT_PLATFORM_OVERHEAD_USD = 1.5;
const DEFAULT_MIN_RUN_COST_USD = 2.5;
const DEFAULT_OPERATIONS_BUFFER_MIN = 2;
const DEFAULT_QUALITY_BONUS_MAX_POINTS = 6;
const DEFAULT_SAVINGS_REALIZATION_RATE = 0.35;
const DEFAULT_MAX_SAVED_MINUTES = 6;

function readPositiveNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function round(value: number, precision = 4): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function getManualBaselineMinutes(mode: PitchMode): number {
  if (mode === 'elevator') {
    return readPositiveNumber(
      'MANUAL_BASELINE_ELEVATOR_MIN',
      DEFAULT_MANUAL_BASELINE_ELEVATOR_MIN,
    );
  }
  return readPositiveNumber('MANUAL_BASELINE_VC_MIN', DEFAULT_MANUAL_BASELINE_VC_MIN);
}

function getPricingPerMillion(provider: AnalysisMeta['provider_used']): {
  input: number;
  output: number;
} {
  if (provider === 'openrouter') {
    return {
      input: readPositiveNumber(
        'OPENROUTER_INPUT_PER_1M_USD',
        DEFAULT_OPENROUTER_INPUT_PER_1M_USD,
      ),
      output: readPositiveNumber(
        'OPENROUTER_OUTPUT_PER_1M_USD',
        DEFAULT_OPENROUTER_OUTPUT_PER_1M_USD,
      ),
    };
  }
  if (provider === 'anthropic') {
    return {
      input: readPositiveNumber(
        'ANTHROPIC_INPUT_PER_1M_USD',
        DEFAULT_ANTHROPIC_INPUT_PER_1M_USD,
      ),
      output: readPositiveNumber(
        'ANTHROPIC_OUTPUT_PER_1M_USD',
        DEFAULT_ANTHROPIC_OUTPUT_PER_1M_USD,
      ),
    };
  }
  return { input: 0, output: 0 };
}

export function estimateTokensByChars(text: string): number {
  return Math.max(0, Math.ceil(text.length / 4));
}

export function buildRunEconomics(input: BuildRunEconomicsInput): RunEconomics {
  const coachHourlyRate = readPositiveNumber(
    'COACH_HOURLY_RATE_USD',
    readPositiveNumber('FOUNDER_HOURLY_RATE_USD', DEFAULT_COACH_HOURLY_RATE_USD),
  );
  const valuePerScorePoint = readPositiveNumber(
    'VALUE_PER_SCORE_POINT_USD',
    DEFAULT_VALUE_PER_SCORE_POINT_USD,
  );
  const platformOverheadUsd = readPositiveNumber(
    'ECON_PLATFORM_OVERHEAD_USD',
    DEFAULT_PLATFORM_OVERHEAD_USD,
  );
  const minRunCostUsd = readPositiveNumber('ECON_MIN_RUN_COST_USD', DEFAULT_MIN_RUN_COST_USD);
  const operationsBufferMin = readPositiveNumber(
    'ECON_OPERATIONS_BUFFER_MIN',
    DEFAULT_OPERATIONS_BUFFER_MIN,
  );
  const qualityBonusMaxPoints = readPositiveNumber(
    'ECON_QUALITY_BONUS_MAX_POINTS',
    DEFAULT_QUALITY_BONUS_MAX_POINTS,
  );
  const savingsRealizationRate = Math.max(
    0.05,
    Math.min(
      1,
      readPositiveNumber(
        'ECON_SAVINGS_REALIZATION_RATE',
        DEFAULT_SAVINGS_REALIZATION_RATE,
      ),
    ),
  );
  const maxSavedMinutes = readPositiveNumber(
    'ECON_MAX_SAVED_MINUTES',
    DEFAULT_MAX_SAVED_MINUTES,
  );

  const promptLikeInput = `${input.mode}\n${input.transcript}\n${input.deckText ?? ''}`.trim();
  const outputPayload = JSON.stringify(input.outputs);
  const estimatedInputTokens = estimateTokensByChars(promptLikeInput);
  const estimatedOutputTokens = estimateTokensByChars(outputPayload);

  const rates = getPricingPerMillion(input.providerUsed);
  const modelCostUsd =
    (estimatedInputTokens / 1_000_000) * rates.input +
    (estimatedOutputTokens / 1_000_000) * rates.output;
  const estimatedCostUsd = Math.max(modelCostUsd + platformOverheadUsd, minRunCostUsd);

  const manualBaselineMinutes = getManualBaselineMinutes(input.mode);
  const agentRuntimeMinutes = Math.max(
    operationsBufferMin,
    input.agentRuntimeMs / 60_000 + operationsBufferMin,
  );
  const rawTimeSavedMinutes = Math.max(0, manualBaselineMinutes - agentRuntimeMinutes);
  const pitchDurationMinutes = Math.max(
    0.5,
    input.outputs.feedback.delivery_metrics.duration_seconds / 60,
  );
  const durationScaledCapMinutes = Math.max(2, pitchDurationMinutes * 8);
  const timeSavedMinutes = Math.min(
    rawTimeSavedMinutes,
    maxSavedMinutes,
    durationScaledCapMinutes,
  );
  const scoreDeltaRaw =
    input.previousModeScore !== undefined && input.previousModeScore !== null
      ? input.overallScore - input.previousModeScore
      : 0;
  const scoreDeltaForBonus = Math.min(
    qualityBonusMaxPoints,
    Math.max(0, scoreDeltaRaw),
  );
  const qualityBonusUsd = scoreDeltaForBonus * valuePerScorePoint;
  const moneySavedVsCoachUsd =
    ((timeSavedMinutes / 60) * coachHourlyRate) * savingsRealizationRate;
  const estimatedValueUsd = moneySavedVsCoachUsd;
  const roiMultiple = estimatedValueUsd / Math.max(estimatedCostUsd, 0.0001);
  const grossMarginUsd = estimatedValueUsd - estimatedCostUsd;

  return {
    model_cost_usd: round(modelCostUsd, 6),
    platform_overhead_usd: round(platformOverheadUsd, 4),
    cost_floor_usd: round(minRunCostUsd, 4),
    estimated_input_tokens: estimatedInputTokens,
    estimated_output_tokens: estimatedOutputTokens,
    estimated_cost_usd: round(estimatedCostUsd, 6),
    coach_hourly_rate_usd: round(coachHourlyRate, 2),
    savings_realization_rate: round(savingsRealizationRate, 4),
    manual_baseline_minutes: round(manualBaselineMinutes, 2),
    agent_runtime_minutes: round(agentRuntimeMinutes, 2),
    time_saved_minutes: round(timeSavedMinutes, 2),
    money_saved_vs_coach_usd: round(moneySavedVsCoachUsd, 2),
    score_delta_vs_previous_mode_run: scoreDeltaRaw,
    quality_bonus_usd: round(qualityBonusUsd, 2),
    estimated_value_usd: round(estimatedValueUsd, 2),
    roi_multiple: round(roiMultiple, 2),
    gross_margin_usd: round(grossMarginUsd, 2),
  };
}
