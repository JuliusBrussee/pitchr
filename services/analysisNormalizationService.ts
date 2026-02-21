import { SAMPLE_RESULT } from '@/config/sampleResult';
import type { AnalysisResult } from '@/types/analysis';
import type { AnalysisResultV2 } from '@/types/analysis-v2';

function cloneSample(): AnalysisResultV2 {
  return JSON.parse(JSON.stringify(SAMPLE_RESULT)) as AnalysisResultV2;
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
    return analysis;
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

