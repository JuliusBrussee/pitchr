import { SAMPLE_RESULT } from '@/config/sampleResult';
import { completeWithLlmRouter } from '@/lib/llm/router';
import { buildRewritePrompt } from '@/lib/prompts/rewrite';
import { buildRepairPrompt, buildRubricPrompt } from '@/lib/prompts/rubric';
import { ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts/system';
import { calculateDeliveryMetrics } from '@/services/scoringService';
import type {
  AnalysisResult,
  DeliveryMetrics,
  Fix,
  RubricCategory,
  RubricScore,
} from '@/types/analysis';
import type { PitchMode } from '@/types/pitch';

export interface AnalyzePitchInput {
  transcript: string;
  mode: PitchMode;
}

export interface AnalyzePitchResult {
  analysis: AnalysisResult;
  fallback: boolean;
}

const RUBRIC_CATEGORIES: RubricCategory[] = [
  'structure',
  'clarity',
  'evidence',
  'market',
  'delivery',
];

const FIX_IMPACTS = new Set(['high', 'medium', 'low']);

function isRubricCategory(value: unknown): value is RubricCategory {
  return typeof value === 'string' && RUBRIC_CATEGORIES.includes(value as RubricCategory);
}

function isRubricScore(value: unknown): value is RubricScore {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    isRubricCategory(item.category) &&
    typeof item.score === 'number' &&
    typeof item.max_score === 'number' &&
    typeof item.rationale === 'string'
  );
}

function isFix(value: unknown): value is Fix {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.rank === 'number' &&
    isRubricCategory(item.category) &&
    typeof item.issue === 'string' &&
    typeof item.fix === 'string' &&
    typeof item.impact === 'string' &&
    FIX_IMPACTS.has(item.impact)
  );
}

function isDeliveryMetrics(value: unknown): value is DeliveryMetrics {
  if (!value || typeof value !== 'object') return false;
  const metrics = value as Record<string, unknown>;
  return (
    typeof metrics.wpm === 'number' &&
    typeof metrics.duration_seconds === 'number' &&
    Array.isArray(metrics.filler_words) &&
    Array.isArray(metrics.repeated_phrases) &&
    typeof metrics.within_time_limit === 'boolean'
  );
}

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  if (
    typeof payload.overall_score !== 'number' ||
    typeof payload.one_line_verdict !== 'string' ||
    !Array.isArray(payload.rubric_breakdown) ||
    !Array.isArray(payload.top_fixes) ||
    typeof payload.rewrite_script !== 'string' ||
    !isDeliveryMetrics(payload.delivery_metrics)
  ) {
    return false;
  }

  if (payload.rubric_breakdown.length !== 5) return false;
  if (!payload.rubric_breakdown.every(isRubricScore)) return false;
  if (!payload.top_fixes.every(isFix)) return false;

  return true;
}

function parseJsonPayload(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Model output is not valid JSON');
    }
    return JSON.parse(raw.slice(start, end + 1));
  }
}

function withInjectedDeliveryMetrics(
  analysis: AnalysisResult,
  deliveryMetrics: DeliveryMetrics,
): AnalysisResult {
  return {
    ...analysis,
    delivery_metrics: deliveryMetrics,
    rubric_breakdown: analysis.rubric_breakdown.map((item) =>
      item.category === 'delivery'
        ? {
            ...item,
            score: Math.max(0, Math.min(20, item.score)),
          }
        : item,
    ),
  };
}

async function maybeGenerateRewrite(
  analysis: AnalysisResult,
  transcript: string,
  mode: PitchMode,
): Promise<AnalysisResult> {
  if (analysis.rewrite_script.trim().length > 0) {
    return analysis;
  }

  try {
    const rewrite = await completeWithLlmRouter({
      systemPrompt:
        'You rewrite startup pitches for spoken delivery. Return plain text only.',
      userPrompt: buildRewritePrompt({
        mode,
        transcript,
        topFixes: analysis.top_fixes,
      }),
      responseFormat: 'text',
      temperature: 0.3,
      maxTokens: 1200,
    });

    if (rewrite.trim().length > 0) {
      return {
        ...analysis,
        rewrite_script: rewrite.trim(),
      };
    }
  } catch {
    // Keep original analysis when rewrite fallback fails.
  }

  return analysis;
}

function cloneFallbackAnalysis(): AnalysisResult {
  return JSON.parse(JSON.stringify(SAMPLE_RESULT.analysis)) as AnalysisResult;
}

export async function analyzePitch({
  transcript,
  mode,
}: AnalyzePitchInput): Promise<AnalyzePitchResult> {
  const deliveryMetrics = calculateDeliveryMetrics(transcript, mode);
  const userPrompt = buildRubricPrompt({ transcript, mode });

  let rawOutput: string | null = null;
  let parsed: AnalysisResult | null = null;

  try {
    rawOutput = await completeWithLlmRouter({
      systemPrompt: ANALYSIS_SYSTEM_PROMPT,
      userPrompt,
      responseFormat: 'json',
      temperature: 0.3,
      maxTokens: 4096,
    });

    const candidate = parseJsonPayload(rawOutput);
    if (isAnalysisResult(candidate)) {
      parsed = candidate;
    }
  } catch {
    parsed = null;
  }

  if (!parsed && rawOutput) {
    try {
      const repaired = await completeWithLlmRouter({
        systemPrompt: ANALYSIS_SYSTEM_PROMPT,
        userPrompt: buildRepairPrompt({
          invalidOutput: rawOutput,
          transcript,
          mode,
        }),
        responseFormat: 'json',
        temperature: 0.3,
        maxTokens: 4096,
      });

      const repairedCandidate = parseJsonPayload(repaired);
      if (isAnalysisResult(repairedCandidate)) {
        parsed = repairedCandidate;
      }
    } catch {
      parsed = null;
    }
  }

  if (!parsed) {
    return {
      analysis: withInjectedDeliveryMetrics(
        cloneFallbackAnalysis(),
        deliveryMetrics,
      ),
      fallback: true,
    };
  }

  const rewritten = await maybeGenerateRewrite(parsed, transcript, mode);

  return {
    analysis: withInjectedDeliveryMetrics(rewritten, deliveryMetrics),
    fallback: false,
  };
}
