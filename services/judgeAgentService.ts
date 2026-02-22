import { completeWithLlmRouterWithTelemetry } from '@/lib/llm/router';
import {
  buildJudgeRepairPrompt,
  buildJudgeUserPrompt,
  JUDGE_RESPONSE_SCHEMA_TEXT,
  JUDGE_SYSTEM_PROMPT,
} from '@/lib/prompts/judge';
import type {
  AnalysisMeta,
  Citation,
  Fix,
  OneMinuteQAPack,
  RubricScore,
  ScoringContext,
  SentimentProfile,
} from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

const SPOKEN_CATEGORIES = new Set([
  'structure',
  'clarity',
  'evidence',
  'market',
  'delivery',
] as const);

const DECK_CATEGORIES = new Set([
  'deck_narrative',
  'deck_clarity',
  'deck_evidence',
  'deck_design',
  'deck_ask',
] as const);

export interface JudgeAgentInput {
  mode: PitchMode;
  transcript: string;
  deckText?: string;
  context: ScoringContext;
}

export interface JudgeAgentPayload {
  feedback: {
    one_line_verdict: string;
    rubric_breakdown: RubricScore[];
    top_fixes: Fix[];
    rewrite_script: string;
    sentiment_profile: SentimentProfile;
    citations: Citation[];
    do_next_checklist: string[];
  };
  qa_1min: OneMinuteQAPack | null;
}

export interface JudgeAgentResult {
  payload: JudgeAgentPayload;
  meta: AnalysisMeta;
  raw: string;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new Error('Judge response is not valid JSON.');
    }
    return JSON.parse(raw.slice(start, end + 1));
  }
}

function isCitation(value: unknown): value is Citation {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.source_id === 'string' &&
    typeof entry.source_url === 'string' &&
    typeof entry.source_title === 'string' &&
    typeof entry.access_status === 'string' &&
    typeof entry.snapshot_date === 'string' &&
    typeof entry.confidence_score === 'number' &&
    typeof entry.excerpt === 'string'
  );
}

function isRubricScore(value: unknown): value is RubricScore {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.category === 'string' &&
    typeof entry.score === 'number' &&
    typeof entry.max_score === 'number' &&
    typeof entry.rationale === 'string'
  );
}

function isFix(value: unknown): value is Fix {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.rank === 'number' &&
    typeof entry.category === 'string' &&
    typeof entry.issue === 'string' &&
    typeof entry.fix === 'string' &&
    (entry.impact === 'high' || entry.impact === 'medium' || entry.impact === 'low')
  );
}

function isSentimentProfile(value: unknown): value is SentimentProfile {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.confidence === 'number' &&
    typeof entry.urgency === 'number' &&
    typeof entry.credibility === 'number' &&
    typeof entry.clarity === 'number' &&
    typeof entry.investor_readiness === 'number'
  );
}

function isQAPack(value: unknown): value is OneMinuteQAPack {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  if (
    entry.total_target_seconds !== 60 ||
    !Array.isArray(entry.timing_plan_seconds) ||
    entry.timing_plan_seconds.length !== 3 ||
    !Array.isArray(entry.investor_questions) ||
    entry.investor_questions.length !== 3 ||
    !Array.isArray(entry.suggested_answers) ||
    entry.suggested_answers.length !== 3 ||
    !Array.isArray(entry.focus_tags) ||
    !Array.isArray(entry.red_flags_to_avoid)
  ) {
    return false;
  }

  const questionsOk = entry.investor_questions.every((item) => typeof item === 'string');
  const answersOk = entry.suggested_answers.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const answer = item as Record<string, unknown>;
    return (
      typeof answer.question === 'string' &&
      typeof answer.answer === 'string' &&
      typeof answer.target_seconds === 'number'
    );
  });
  return questionsOk && answersOk;
}

function validatePayload(
  payload: unknown,
  coverage: ScoringContext['coverage'],
): JudgeAgentPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Judge payload must be an object.');
  }
  const root = payload as Record<string, unknown>;
  const feedback = root.feedback as Record<string, unknown> | undefined;
  const qaPack = root.qa_1min;

  if (!feedback) {
    throw new Error('Judge payload missing feedback.');
  }
  if (
    typeof feedback.one_line_verdict !== 'string' ||
    !Array.isArray(feedback.rubric_breakdown) ||
    !feedback.rubric_breakdown.every(isRubricScore) ||
    !Array.isArray(feedback.top_fixes) ||
    !feedback.top_fixes.every(isFix) ||
    typeof feedback.rewrite_script !== 'string' ||
    !isSentimentProfile(feedback.sentiment_profile) ||
    !Array.isArray(feedback.citations) ||
    !feedback.citations.every(isCitation) ||
    !Array.isArray(feedback.do_next_checklist)
  ) {
    throw new Error(`Judge payload failed schema validation.\n${JUDGE_RESPONSE_SCHEMA_TEXT}`);
  }

  const spokenScores = feedback.rubric_breakdown.filter((item) =>
    SPOKEN_CATEGORIES.has(item.category as never),
  );
  const deckScores = feedback.rubric_breakdown.filter((item) =>
    DECK_CATEGORIES.has(item.category as never),
  );
  if (spokenScores.length !== 5) {
    throw new Error('Judge payload requires exactly 5 spoken rubric scores.');
  }
  if (coverage === 'spoken+deck' && deckScores.length !== 5) {
    throw new Error('Judge payload requires exactly 5 deck rubric scores when deck exists.');
  }

  const validQaPack = isQAPack(qaPack) ? qaPack : null;

  return {
    feedback: {
      one_line_verdict: feedback.one_line_verdict,
      rubric_breakdown: feedback.rubric_breakdown,
      top_fixes: feedback.top_fixes,
      rewrite_script: feedback.rewrite_script,
      sentiment_profile: feedback.sentiment_profile,
      citations: feedback.citations,
      do_next_checklist: feedback.do_next_checklist as string[],
    },
    qa_1min: validQaPack,
  };
}

export async function runJudgeAgent(input: JudgeAgentInput): Promise<JudgeAgentResult> {
  let response: Awaited<ReturnType<typeof completeWithLlmRouterWithTelemetry>>;
  try {
    response = await completeWithLlmRouterWithTelemetry({
      systemPrompt: JUDGE_SYSTEM_PROMPT,
      userPrompt: buildJudgeUserPrompt({
        mode: input.mode,
        transcript: input.transcript,
        deckText: input.deckText,
        context: input.context,
      }),
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 4096,
      timeoutMs: 45_000,
      maxAttempts: 1,
    });
  } catch (error) {
    const telemetry =
      (error as { telemetry?: AnalysisMeta & { failedAttempts?: unknown } })?.telemetry ??
      undefined;
    console.error('[judge-agent] provider failure', {
      message: error instanceof Error ? error.message : String(error),
      telemetry,
    });
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = parseJson(response.text);
  } catch {
    throw new Error('Judge response is not valid JSON.');
  }

  let totalLlmCalls = response.telemetry.llmCallsUsed;
  let totalLatency = response.telemetry.latencyMs;

  try {
    const payload = validatePayload(parsed, input.context.coverage);
    return {
      payload,
      meta: {
        provider_used: response.telemetry.providerUsed,
        fallback_used: response.telemetry.fallbackUsed,
        cache_hit: false,
        llm_calls_used: totalLlmCalls,
        latency_ms: totalLatency,
        attempt_count: response.telemetry.attemptCount,
        error_details: undefined,
      },
      raw: response.text,
    };
  } catch (validationError) {
    console.warn('[judge-agent] validation failed, attempting repair', {
      message: validationError instanceof Error ? validationError.message : String(validationError),
    });

    const repairResponse = await completeWithLlmRouterWithTelemetry({
      systemPrompt: JUDGE_SYSTEM_PROMPT,
      userPrompt: buildJudgeRepairPrompt(response.text),
      responseFormat: 'json',
      temperature: 0.1,
      maxTokens: 4096,
      timeoutMs: 30_000,
      maxAttempts: 1,
    });

    totalLlmCalls += repairResponse.telemetry.llmCallsUsed;
    totalLatency += repairResponse.telemetry.latencyMs;

    const repairedPayload = validatePayload(
      parseJson(repairResponse.text),
      input.context.coverage,
    );

    return {
      payload: repairedPayload,
      meta: {
        provider_used: response.telemetry.providerUsed,
        fallback_used: true,
        cache_hit: false,
        llm_calls_used: totalLlmCalls,
        latency_ms: totalLatency,
        attempt_count: response.telemetry.attemptCount + 1,
        error_details: undefined,
      },
      raw: repairResponse.text,
    };
  }
}
