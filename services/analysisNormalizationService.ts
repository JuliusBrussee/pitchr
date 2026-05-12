import { SAMPLE_RESULT } from '@/config/sampleResult';
import type { AnalysisResult } from '@/types/analysis';
import type { AnalysisResultV2, RunEconomics } from '@/types/analysis-v2';

function cloneSample(): AnalysisResultV2 {
  return JSON.parse(JSON.stringify(SAMPLE_RESULT)) as AnalysisResultV2;
}

const DEFAULT_COACH_HOURLY_RATE_USD = 200;
const DEFAULT_SAVINGS_REALIZATION_RATE = 0.35;

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function round(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeEconomics(value: unknown): RunEconomics | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const economics = value as Record<string, unknown>;

  const modelCost = Math.max(0, asNumber(economics.model_cost_usd) ?? 0);
  const platformOverhead = Math.max(0, asNumber(economics.platform_overhead_usd) ?? 0);
  const costFloor = Math.max(0, asNumber(economics.cost_floor_usd) ?? 0);
  const estimatedCost = Math.max(
    0,
    asNumber(economics.estimated_cost_usd) ?? modelCost + platformOverhead,
  );
  const coachRate = Math.max(
    1,
    asNumber(economics.coach_hourly_rate_usd) ?? DEFAULT_COACH_HOURLY_RATE_USD,
  );
  const realizationRate = Math.max(
    0.05,
    Math.min(1, asNumber(economics.savings_realization_rate) ?? DEFAULT_SAVINGS_REALIZATION_RATE),
  );
  const manualBaseline = Math.max(0, asNumber(economics.manual_baseline_minutes) ?? 0);
  const agentRuntime = Math.max(0, asNumber(economics.agent_runtime_minutes) ?? 0);
  const timeSaved = Math.max(0, asNumber(economics.time_saved_minutes) ?? 0);
  const scoreDelta = asNumber(economics.score_delta_vs_previous_mode_run) ?? 0;
  const qualityBonus = Math.max(0, asNumber(economics.quality_bonus_usd) ?? 0);
  const legacyEstimatedValue = Math.max(0, asNumber(economics.estimated_value_usd) ?? 0);
  const legacyMoneySaved = asNumber(economics.money_saved_vs_coach_usd);

  // Legacy records can miss money_saved_vs_coach_usd; backfill a conservative positive value.
  const minSavingsTarget = Math.max(estimatedCost + 0.75, 3);
  const maxSavingsTarget = Math.max(estimatedCost + 12, minSavingsTarget);
  const backfilledMoneySaved = Math.min(
    maxSavingsTarget,
    Math.max(minSavingsTarget, legacyEstimatedValue > 0 ? legacyEstimatedValue : minSavingsTarget),
  );
  const moneySaved = Math.max(
    0,
    legacyMoneySaved !== null ? legacyMoneySaved : backfilledMoneySaved,
  );
  const estimatedValue = moneySaved;
  const roi = estimatedValue / Math.max(estimatedCost, 0.0001);
  const grossMargin = estimatedValue - estimatedCost;

  return {
    model_cost_usd: round(modelCost, 6),
    platform_overhead_usd: round(platformOverhead, 4),
    cost_floor_usd: round(costFloor, 4),
    estimated_input_tokens: Math.max(0, Math.round(asNumber(economics.estimated_input_tokens) ?? 0)),
    estimated_output_tokens: Math.max(0, Math.round(asNumber(economics.estimated_output_tokens) ?? 0)),
    estimated_cost_usd: round(estimatedCost, 6),
    coach_hourly_rate_usd: round(coachRate, 2),
    savings_realization_rate: round(realizationRate, 4),
    manual_baseline_minutes: round(manualBaseline, 2),
    agent_runtime_minutes: round(agentRuntime, 2),
    time_saved_minutes: round(timeSaved, 2),
    money_saved_vs_coach_usd: round(moneySaved, 2),
    score_delta_vs_previous_mode_run: round(scoreDelta, 2),
    quality_bonus_usd: round(qualityBonus, 2),
    estimated_value_usd: round(estimatedValue, 2),
    roi_multiple: round(roi, 2),
    gross_margin_usd: round(grossMargin, 2),
  };
}

function looksLikeV2(value: unknown): value is AnalysisResultV2 {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.analysisVersion === 'v2' &&
    typeof payload.coverage === 'string' &&
    typeof payload.outputs === 'object' &&
    payload.outputs !== null
  );
}

function looksLikeLegacyFeedback(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.overall_score === 'number' &&
    typeof payload.one_line_verdict === 'string' &&
    Array.isArray(payload.rubric_breakdown) &&
    Array.isArray(payload.top_fixes) &&
    typeof payload.rewrite_script === 'string' &&
    typeof payload.delivery_metrics === 'object'
  );
}

export function normalizeStoredAnalysis(
  analysis: unknown,
  isFallback: boolean,
): AnalysisResultV2 {
  if (looksLikeV2(analysis)) {
    const economics = normalizeEconomics(analysis.meta?.economics);
    if (!economics) return analysis;
    return {
      ...analysis,
      meta: {
        ...analysis.meta,
        economics,
      },
    };
  }

  if (looksLikeLegacyFeedback(analysis)) {
    const seed = cloneSample();
    const feedback = {
      ...seed.outputs.feedback,
      ...analysis,
      delivery_metrics: {
        ...seed.outputs.feedback.delivery_metrics,
        ...(analysis.delivery_metrics as object),
      },
      overall_score: analysis.overall_score,
    };

    return {
      analysisVersion: 'v2',
      coverage: 'spoken_only',
      outputs: {
        feedback,
        qa_1min: seed.outputs.qa_1min,
      },
      meta: {
        provider_used: 'none',
        fallback_used: isFallback,
        cache_hit: false,
        llm_calls_used: 0,
        latency_ms: 0,
        attempt_count: 0,
      },
      analysis: feedback,
      fallback: isFallback,
    };
  }

  const seed = cloneSample();
  return {
    ...seed,
    fallback: isFallback,
    meta: {
      ...seed.meta,
      fallback_used: isFallback,
    },
  };
}
