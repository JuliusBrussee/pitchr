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

const DEFAULT_FOUNDER_HOURLY_RATE_USD = 150;
const DEFAULT_VALUE_PER_SCORE_POINT_USD = 2;
const DEFAULT_ANTHROPIC_INPUT_PER_1M_USD = 3;
const DEFAULT_ANTHROPIC_OUTPUT_PER_1M_USD = 15;
const DEFAULT_OPENROUTER_INPUT_PER_1M_USD = 3;
const DEFAULT_OPENROUTER_OUTPUT_PER_1M_USD = 15;
const DEFAULT_MANUAL_BASELINE_ELEVATOR_MIN = 15;
const DEFAULT_MANUAL_BASELINE_VC_MIN = 30;

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
  const founderHourlyRate = readPositiveNumber(
    'FOUNDER_HOURLY_RATE_USD',
    DEFAULT_FOUNDER_HOURLY_RATE_USD,
  );
  const valuePerScorePoint = readPositiveNumber(
    'VALUE_PER_SCORE_POINT_USD',
    DEFAULT_VALUE_PER_SCORE_POINT_USD,
  );

  const promptLikeInput = `${input.mode}\n${input.transcript}\n${input.deckText ?? ''}`.trim();
  const outputPayload = JSON.stringify(input.outputs);
  const estimatedInputTokens = estimateTokensByChars(promptLikeInput);
  const estimatedOutputTokens = estimateTokensByChars(outputPayload);

  const rates = getPricingPerMillion(input.providerUsed);
  const estimatedCostUsd =
    (estimatedInputTokens / 1_000_000) * rates.input +
    (estimatedOutputTokens / 1_000_000) * rates.output;

  const manualBaselineMinutes = getManualBaselineMinutes(input.mode);
  const agentRuntimeMinutes = Math.max(0, input.agentRuntimeMs / 60_000);
  const timeSavedMinutes = Math.max(0, manualBaselineMinutes - agentRuntimeMinutes);
  const scoreDelta =
    input.previousModeScore !== undefined && input.previousModeScore !== null
      ? input.overallScore - input.previousModeScore
      : 0;
  const qualityBonusUsd = Math.max(0, scoreDelta) * valuePerScorePoint;
  const timeValueUsd = (timeSavedMinutes / 60) * founderHourlyRate;
  const estimatedValueUsd = timeValueUsd + qualityBonusUsd;
  const roiMultiple = estimatedValueUsd / Math.max(estimatedCostUsd, 0.0001);
  const grossMarginUsd = estimatedValueUsd - estimatedCostUsd;

  return {
    estimated_input_tokens: estimatedInputTokens,
    estimated_output_tokens: estimatedOutputTokens,
    estimated_cost_usd: round(estimatedCostUsd, 6),
    manual_baseline_minutes: round(manualBaselineMinutes, 2),
    agent_runtime_minutes: round(agentRuntimeMinutes, 2),
    time_saved_minutes: round(timeSavedMinutes, 2),
    score_delta_vs_previous_mode_run: scoreDelta,
    quality_bonus_usd: round(qualityBonusUsd, 2),
    estimated_value_usd: round(estimatedValueUsd, 2),
    roi_multiple: round(roiMultiple, 2),
    gross_margin_usd: round(grossMarginUsd, 2),
  };
}
