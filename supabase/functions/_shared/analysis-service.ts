// Shared analysis service for Supabase Edge Functions.
// Makes direct fetch() calls to Gemini API with retry, cached sample as fallback.
// Adapts prompts from lib/prompts/ for use in Deno runtime.

import { SAMPLE_RESULT } from './sample-result.ts';
import type { PitchMode } from './types.ts';
import {
  getAnalysisPromptProfile,
  type AnalysisPromptProfile,
} from './analysis-profiles.ts';
import { buildLayeredSystemPrompt } from './rubric-context.ts';
import {
  applyRubricPolicyToFeedback,
  type RubricPolicy,
} from './rubric-policy.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalysisFeedback {
  overall_score: number;
  one_line_verdict: string;
  rubric_breakdown: Array<{
    category: string;
    score: number;
    max_score: number;
    rationale: string;
  }>;
  top_fixes: Array<{
    rank: number;
    category: string;
    issue: string;
    fix: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  rewrite_script: string;
  delivery_metrics: {
    wpm: number;
    duration_seconds: number;
    filler_words: Array<{ word: string; count: number }>;
    repeated_phrases: Array<{ phrase: string; count: number }>;
    within_time_limit: boolean;
    word_count?: number;
    target_wpm?: number;
    filler_count?: number;
    filler_rate?: number;
    disfluency_count?: number;
    stutter_rate?: number;
    repeated_ngram_tokens?: number;
    repeat_rate?: number;
    pace_score_component?: number;
    filler_score_component?: number;
    stutter_score_component?: number;
    repeat_score_component?: number;
    time_score_component?: number;
    delivery20?: number;
  };
  sentiment_profile?: {
    confidence: number;
    urgency: number;
    credibility: number;
    clarity: number;
    investor_readiness: number;
  };
  citations?: Array<{
    source_id: string;
    source_url: string;
    source_title: string;
    access_status: string;
    snapshot_date: string;
    confidence_score: number;
    excerpt: string;
  }>;
  do_next_checklist?: string[];
  spoken_score?: number;
  deck_score?: number | null;
  pre_penalty_overall?: number;
  penalty?: number;
  anti_pattern_hits?: unknown[];
  stage_expectations?: unknown[];
  section_feedback?: unknown[];
  rewrite_diff?: unknown;
  vocabulary_metrics?: unknown;
  historical_links?: unknown[];
  summary_good?: string;
  summary_bad?: string;
  advanced_reasoning?: unknown;
}

interface QAPack {
  total_target_seconds: number;
  timing_plan_seconds: number[];
  investor_questions: string[];
  suggested_answers: Array<{
    question: string;
    answer: string;
    target_seconds: number;
  }>;
  focus_tags: string[];
  red_flags_to_avoid: string[];
}

// deno-lint-ignore no-explicit-any
interface AnalysisResultV2 {
  analysisVersion: 'v2';
  coverage: 'spoken_only' | 'spoken+deck';
  outputs: {
    feedback: AnalysisFeedback;
    qa_1min: QAPack;
  };
  meta: {
    provider_used: string;
    fallback_used: boolean;
    cache_hit: boolean;
    llm_calls_used: number;
    latency_ms: number;
    attempt_count: number;
    rubric_policy?: {
      applied: boolean;
      policy_hash?: string;
      rule_count: number;
      missing_terms: string[];
      adjustments: Array<{
        rule_id: string;
        category: string;
        required_term: string;
        max_score: number;
        before_score: number;
        after_score: number;
        reason: string;
      }>;
    };
    error_details?: {
      message: string;
      timeout: boolean;
    };
  };
  // deno-lint-ignore no-explicit-any
  analysis: any;
  fallback: boolean;
}

export interface AnalyzePitchResult {
  // deno-lint-ignore no-explicit-any
  analysis: any;
  fallback: boolean;
}

interface AnalyzePitchInput {
  transcript: string;
  mode: PitchMode;
  deckText?: string;
  systemPromptOverride?: string;
  rubricPolicy?: RubricPolicy;
  targetDurationSeconds?: number;
}

const DIAGNOSTIC_LOGS_ENABLED =
  Deno.env.get('PITCHR_DIAGNOSTIC_LOGS') === 'true' &&
  Deno.env.get('NODE_ENV') !== 'production';

function logDiagnostic(
  level: 'log' | 'warn' | 'error',
  message: string,
  details?: Record<string, unknown>,
): void {
  if (!DIAGNOSTIC_LOGS_ENABLED) return;
  if (details) {
    console[level](message, details);
    return;
  }
  console[level](message);
}

// ---------------------------------------------------------------------------
// Build user prompt (variable content only — static content in system prompt)
// ---------------------------------------------------------------------------

function buildUserPrompt(
  input: AnalyzePitchInput,
  profile: AnalysisPromptProfile,
): string {
  const config = profile.modeConfig;

  const parts = [
    `Mode: ${config.label}`,
    `Target duration: ${config.targetDurationSeconds} seconds`,
    `Target WPM: ${config.targetWpm}`,
    `Structure beats: ${config.structureBeats.join(' -> ')}`,
    '',
    'Original transcript:',
    input.transcript || '[empty transcript]',
  ];

  if (input.deckText) {
    parts.push('', 'Deck text:', input.deckText);
  }

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// LLM API callers
// ---------------------------------------------------------------------------

const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_RETRY_DELAY_MS = 2_000;

function geminiConfig(transcript: string, deckText?: string) {
  const inputLen = (transcript?.length ?? 0) + (deckText?.length ?? 0);
  const isLong = inputLen > 3000;
  return {
    timeout: isLong ? 120_000 : 60_000,
    maxAttempts: isLong ? 3 : 2,
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

interface CallGeminiOptions {
  timeoutMs: number;
  maxAttempts: number;
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: CallGeminiOptions,
): Promise<string> {
  const apiKey = (Deno.env.get('GOOGLE_AI_API_KEY') ?? Deno.env.get('GOOGLE_API_KEY'))?.trim();
  if (!apiKey) {
    throw new Error('Missing GOOGLE_AI_API_KEY or GOOGLE_API_KEY');
  }

  const timeoutMs = options?.timeoutMs ?? 60_000;
  const maxAttempts = options?.maxAttempts ?? 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [
              { role: 'user', parts: [{ text: userPrompt }] },
            ],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 16384,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        },
      );

      const payload = (await response.json()) as GeminiResponse;

      if (!response.ok) {
        const errorMessage =
          payload.error?.message ?? `Gemini request failed with status ${response.status}`;
        if (attempt < maxAttempts && (response.status === 429 || response.status >= 500)) {
          await new Promise((resolve) => setTimeout(resolve, GEMINI_RETRY_DELAY_MS));
          continue;
        }
        throw new Error(errorMessage);
      }

      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim();

      if (!text) {
        throw new Error('Gemini returned an empty completion');
      }

      return text;
    } catch (error) {
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, GEMINI_RETRY_DELAY_MS));
        continue;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gemini request timed out');
      }
      if (error instanceof TypeError) {
        throw new Error(`Gemini connection failed (network/DNS error): ${error.message}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('Gemini request failed after retries');
}

// ---------------------------------------------------------------------------
// JSON validation and normalization
// ---------------------------------------------------------------------------

const REQUIRED_CATEGORIES = ['structure', 'clarity', 'evidence', 'market', 'delivery'];

// deno-lint-ignore no-explicit-any
function validateAndNormalize(parsed: any): { feedback: AnalysisFeedback; qa_1min: QAPack } {
  const feedback = parsed.feedback;
  const qa = parsed.qa_1min;

  if (!feedback || !qa) {
    throw new Error('Missing feedback or qa_1min in LLM response');
  }

  // Normalize rubric: ensure all 5 spoken categories exist
  const rubricMap = new Map<string, typeof feedback.rubric_breakdown[0]>();
  for (const item of feedback.rubric_breakdown ?? []) {
    rubricMap.set(item.category, item);
  }

  feedback.rubric_breakdown = REQUIRED_CATEGORIES.map((category) => {
    const item = rubricMap.get(category);
    if (!item) {
      return {
        category,
        score: 0,
        max_score: 20,
        rationale: 'No score provided by judge.',
      };
    }
    return {
      ...item,
      score: Math.max(0, Math.min(20, item.score)),
      max_score: 20,
    };
  });

  // Compute overall_score from rubric
  const totalScore = feedback.rubric_breakdown.reduce(
    (sum: number, item: { score: number }) => sum + item.score,
    0,
  );
  feedback.overall_score = totalScore;

  // Ensure top_fixes have ranks
  if (feedback.top_fixes) {
    feedback.top_fixes = feedback.top_fixes.slice(0, 5).map(
      // deno-lint-ignore no-explicit-any
      (fix: any, index: number) => ({
        ...fix,
        rank: index + 1,
      }),
    );
  } else {
    feedback.top_fixes = [];
  }

  // Defaults for optional fields
  feedback.spoken_score = totalScore;
  feedback.deck_score = null;
  feedback.pre_penalty_overall = totalScore;
  feedback.penalty = 0;
  feedback.anti_pattern_hits = [];
  feedback.citations = feedback.citations ?? [];
  feedback.stage_expectations = [];
  feedback.do_next_checklist = feedback.do_next_checklist ?? [];
  feedback.section_feedback = [];
  feedback.rewrite_diff = { hunks: [], stats: { added: 0, removed: 0, changed: 0 }, alignment_score: 1 };
  feedback.vocabulary_metrics = null;
  feedback.historical_links = [];

  // Derive summary
  const strongest = [...feedback.rubric_breakdown].sort(
    (a: { score: number }, b: { score: number }) => b.score - a.score,
  )[0];
  const weakest = [...feedback.rubric_breakdown].sort(
    (a: { score: number }, b: { score: number }) => a.score - b.score,
  )[0];
  feedback.summary_good = strongest
    ? `Strongest signal: ${strongest.category} scored ${strongest.score}/${strongest.max_score}. ${strongest.rationale}`
    : 'Strongest signal: clear baseline pitch structure was detected.';
  feedback.summary_bad = weakest
    ? `Main risk: ${weakest.category} scored ${weakest.score}/${weakest.max_score}. ${feedback.top_fixes[0]?.issue ?? weakest.rationale}`
    : 'Main risk: the pitch needs sharper proof and phrasing.';

  // Ensure delivery_metrics defaults
  feedback.delivery_metrics = feedback.delivery_metrics ?? {};
  feedback.delivery_metrics.word_count = feedback.delivery_metrics.word_count ?? 0;
  feedback.delivery_metrics.target_wpm = feedback.delivery_metrics.target_wpm ?? 140;
  feedback.delivery_metrics.filler_count = feedback.delivery_metrics.filler_count ?? 0;
  feedback.delivery_metrics.filler_rate = feedback.delivery_metrics.filler_rate ?? 0;
  feedback.delivery_metrics.disfluency_count = feedback.delivery_metrics.disfluency_count ?? 0;
  feedback.delivery_metrics.stutter_rate = feedback.delivery_metrics.stutter_rate ?? 0;
  feedback.delivery_metrics.repeated_ngram_tokens = feedback.delivery_metrics.repeated_ngram_tokens ?? 0;
  feedback.delivery_metrics.repeat_rate = feedback.delivery_metrics.repeat_rate ?? 0;
  feedback.delivery_metrics.within_time_limit = feedback.delivery_metrics.within_time_limit ?? true;
  feedback.delivery_metrics.delivery20 = feedback.rubric_breakdown.find(
    (item: { category: string }) => item.category === 'delivery',
  )?.score ?? 12;
  feedback.delivery_metrics.filler_words = feedback.delivery_metrics.filler_words ?? [];
  feedback.delivery_metrics.repeated_phrases = feedback.delivery_metrics.repeated_phrases ?? [];

  // Ensure sentiment_profile defaults
  feedback.sentiment_profile = feedback.sentiment_profile ?? {
    confidence: 0.5,
    urgency: 0.5,
    credibility: 0.5,
    clarity: 0.5,
    investor_readiness: 0.5,
  };

  // Ensure qa_1min defaults
  qa.total_target_seconds = qa.total_target_seconds ?? 60;
  qa.timing_plan_seconds = qa.timing_plan_seconds ?? [20, 20, 20];
  qa.investor_questions = qa.investor_questions ?? [];
  qa.suggested_answers = qa.suggested_answers ?? [];
  qa.focus_tags = qa.focus_tags ?? [];
  qa.red_flags_to_avoid = qa.red_flags_to_avoid ?? [];

  return { feedback, qa_1min: qa };
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

function cloneSample(): AnalysisResultV2 {
  return JSON.parse(JSON.stringify(SAMPLE_RESULT)) as AnalysisResultV2;
}

export async function analyzePitch(input: AnalyzePitchInput): Promise<AnalyzePitchResult> {
  const startedAt = Date.now();
  const profile = getAnalysisPromptProfile(input.mode, input.targetDurationSeconds);
  const projectRubricContext = input.systemPromptOverride?.trim();
  const systemPrompt = projectRubricContext
    ? buildLayeredSystemPrompt(profile.systemPrompt, projectRubricContext)
    : profile.systemPrompt;
  const userPrompt = buildUserPrompt(input, profile);

  // Try Gemini (with retry), fall back to cached sample
  let llmCallsUsed = 0;
  let attemptCount = 0;

  const config = geminiConfig(input.transcript, input.deckText);

  try {
    attemptCount += 1;
    llmCallsUsed += 1;
    logDiagnostic('log', '[analysis] calling Gemini API...', {
      model: GEMINI_MODEL,
      timeout: config.timeout,
      maxAttempts: config.maxAttempts,
    });
    const rawText = await callGemini(systemPrompt, userPrompt, {
      timeoutMs: config.timeout,
      maxAttempts: config.maxAttempts,
    });
    const parsed = JSON.parse(rawText);
    const { feedback: rawFeedback, qa_1min } = validateAndNormalize(parsed);
    const rubricPolicyResult = applyRubricPolicyToFeedback(rawFeedback, {
      policy: input.rubricPolicy,
      transcript: input.transcript,
      deckText: input.deckText,
    });
    const feedback = rubricPolicyResult.feedback;

    const analysis: AnalysisResultV2 = {
      analysisVersion: 'v2',
      coverage: input.deckText ? 'spoken+deck' : 'spoken_only',
      outputs: { feedback, qa_1min },
      meta: {
        provider_used: 'gemini',
        fallback_used: false,
        cache_hit: false,
        llm_calls_used: llmCallsUsed,
        latency_ms: Date.now() - startedAt,
        attempt_count: attemptCount,
        rubric_policy: rubricPolicyResult.evaluation,
      },
      analysis: feedback,
      fallback: false,
    };

    logDiagnostic('log', '[analysis] Gemini succeeded', {
      overall_score: feedback.overall_score,
      latency_ms: analysis.meta.latency_ms,
    });

    return { analysis, fallback: false };
  } catch (geminiError) {
    const geminiMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
    logDiagnostic('error', '[analysis] Gemini failed, returning sample fallback', {
      error: geminiMsg,
    });

    // Fall back to sample result
    const fallback = cloneSample();
    fallback.coverage = input.deckText ? 'spoken+deck' : 'spoken_only';
    const rubricPolicyResult = applyRubricPolicyToFeedback(fallback.outputs.feedback, {
      policy: input.rubricPolicy,
      transcript: input.transcript,
      deckText: input.deckText,
    });
    fallback.outputs.feedback = rubricPolicyResult.feedback;
    fallback.meta = {
      provider_used: 'none',
      fallback_used: true,
      cache_hit: false,
      llm_calls_used: llmCallsUsed,
      latency_ms: Date.now() - startedAt,
      attempt_count: attemptCount,
      rubric_policy: rubricPolicyResult.evaluation,
      error_details: {
        message: `Gemini: ${geminiMsg}`,
        timeout: geminiMsg.toLowerCase().includes('timed out'),
      },
    };
    fallback.fallback = true;
    fallback.analysis = fallback.outputs.feedback;

    return { analysis: fallback, fallback: true };
  }
}
