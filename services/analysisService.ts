import { SAMPLE_RESULT } from '@/config/sampleResult';
import { HARD_GATE_CAPS } from '@/config/strictness';
import {
  buildAnalysisCacheKey,
  getCachedAnalysis,
  setCachedAnalysis,
  withInFlightDedup,
} from '@/services/analysisCacheService';
import { buildScoringContext } from '@/services/prepAgentService';
import { runJudgeAgent } from '@/services/judgeAgentService';
import { calculateCompositeScore } from '@/services/scoringService';
import type {
  AnalysisResultV2,
  DeckRubricCategory,
  FeedbackOutput,
  OneMinuteQAPack,
  RubricCategory,
  RubricScore,
  ScoringContext,
  ScoreCategory,
} from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

interface AnalyzePitchInput {
  transcript: string;
  mode: PitchMode;
  deckText?: string;
  stage?: 'pre_seed' | 'seed' | 'series_a' | 'series_b';
  transcriptSegments?: Array<{ text?: string; start?: number; end?: number }>;
  regenerate?: 'feedback' | 'qa_1min';
}

export interface AnalyzePitchResult {
  analysis: AnalysisResultV2;
  fallback: boolean;
}

const SPOKEN_CATEGORY_ORDER: RubricCategory[] = [
  'structure',
  'clarity',
  'evidence',
  'market',
  'delivery',
];

const DECK_CATEGORY_ORDER: DeckRubricCategory[] = [
  'deck_narrative',
  'deck_clarity',
  'deck_evidence',
  'deck_design',
  'deck_ask',
];

function cloneSample(): AnalysisResultV2 {
  return JSON.parse(JSON.stringify(SAMPLE_RESULT)) as AnalysisResultV2;
}

function normalizeRubric(
  rubric: RubricScore[],
  categories: ScoreCategory[],
): RubricScore[] {
  const byCategory = new Map<ScoreCategory, RubricScore>();
  for (const item of rubric) {
    byCategory.set(item.category, item);
  }

  return categories.map((category) => {
    const item = byCategory.get(category);
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
}

function isDeckCategory(category: ScoreCategory): category is DeckRubricCategory {
  return DECK_CATEGORY_ORDER.includes(category as DeckRubricCategory);
}

export function applyHardGateCaps(
  rubric: RubricScore[],
  context: ScoringContext,
): RubricScore[] {
  const hitLabels = new Set(
    context.detected_anti_patterns.filter((hit) => hit.hit).map((hit) => hit.label),
  );
  return rubric.map((item) => {
    const matchingCaps = HARD_GATE_CAPS.filter(
      (cap) => cap.category === item.category && hitLabels.has(cap.antiPatternLabel),
    );
    if (matchingCaps.length === 0) return item;
    const cap = matchingCaps[0];
    const cappedScore = Math.min(item.score, cap.capScore);
    if (cappedScore === item.score) return item;
    return {
      ...item,
      score: cappedScore,
      rationale: `${item.rationale} ${cap.rationale}`.trim(),
    };
  });
}

function ensureQaPack(
  qaPack: OneMinuteQAPack | null,
  feedback: FeedbackOutput,
  context: ScoringContext,
): OneMinuteQAPack {
  if (qaPack) return qaPack;

  const weakest = [...feedback.rubric_breakdown]
    .sort((left, right) => left.score - right.score)
    .slice(0, 3);

  const questions = weakest.map((item) => {
    switch (item.category) {
      case 'evidence':
      case 'deck_evidence':
        return 'What hard proof best validates your core claim right now?';
      case 'market':
      case 'deck_narrative':
      case 'deck_ask':
        return 'Why is this market timing right, and how will you win against alternatives?';
      case 'delivery':
        return 'What is the clean 20-second version of your key value proposition?';
      default:
        return 'What should investors remember first when your minute is over?';
    }
  });

  const answers = questions.map((question, index) => {
    const fix = feedback.top_fixes[index] ?? feedback.top_fixes[0];
    const stageHint = context.stage_expectations[0]?.expectations[index] ?? '';
    return {
      question,
      answer: `${fix?.fix ?? 'Lead with concrete evidence and a clear ask.'} ${stageHint}`.trim(),
      target_seconds: 20,
    };
  });

  return {
    total_target_seconds: 60,
    timing_plan_seconds: [20, 20, 20],
    investor_questions: [
      questions[0] ?? 'What proof is strongest today?',
      questions[1] ?? 'Why do you win this market now?',
      questions[2] ?? 'What milestones does this round fund?',
    ],
    suggested_answers: [
      answers[0] ?? {
        question: 'What proof is strongest today?',
        answer: 'Lead with current metrics and timeframe.',
        target_seconds: 20,
      },
      answers[1] ?? {
        question: 'Why do you win this market now?',
        answer: 'Show differentiation and execution velocity.',
        target_seconds: 20,
      },
      answers[2] ?? {
        question: 'What milestones does this round fund?',
        answer: 'Tie the raise amount to measurable milestones.',
        target_seconds: 20,
      },
    ],
    focus_tags: weakest.map((item) => item.category),
    red_flags_to_avoid: [
      'Do not avoid the question by repeating your pitch opening.',
      'Do not claim traction without numbers and timeframe.',
      'Do not state a vague ask without milestone linkage.',
    ],
  };
}

function applyDeterministicScoring(
  judgeFeedback: {
    one_line_verdict: string;
    rubric_breakdown: RubricScore[];
    top_fixes: FeedbackOutput['top_fixes'];
    rewrite_script: string;
    sentiment_profile: FeedbackOutput['sentiment_profile'];
    citations: FeedbackOutput['citations'];
    do_next_checklist: string[];
  },
  context: ScoringContext,
): FeedbackOutput {
  const normalizedSpokenRubric = normalizeRubric(
    judgeFeedback.rubric_breakdown.filter((item) => !isDeckCategory(item.category)),
    SPOKEN_CATEGORY_ORDER,
  );
  const normalizedDeckRubric = normalizeRubric(
    judgeFeedback.rubric_breakdown.filter((item) => isDeckCategory(item.category)),
    context.coverage === 'spoken+deck' ? DECK_CATEGORY_ORDER : [],
  );

  const withDeterministicDelivery = normalizedSpokenRubric.map((item) =>
    item.category === 'delivery'
      ? {
          ...item,
          score: context.delivery_metrics.delivery20,
          rationale:
            'Delivery score computed locally from deterministic pace/filler/stutter/repetition/time formula.',
        }
      : item,
  );
  const cappedSpokenRubric = applyHardGateCaps(withDeterministicDelivery, context);
  const cappedDeckRubric = applyHardGateCaps(normalizedDeckRubric, context);

  const composite = calculateCompositeScore({
    spokenRubric: cappedSpokenRubric,
    deckRubric: cappedDeckRubric,
    delivery20: context.delivery_metrics.delivery20,
    antiPatternHits: context.detected_anti_patterns,
    hasDeck: context.coverage === 'spoken+deck',
  });

  return {
    overall_score: composite.finalScore,
    one_line_verdict: judgeFeedback.one_line_verdict,
    rubric_breakdown: [...cappedSpokenRubric, ...cappedDeckRubric],
    top_fixes: judgeFeedback.top_fixes.slice(0, 5).map((fix, index) => ({
      ...fix,
      rank: index + 1,
    })),
    rewrite_script: judgeFeedback.rewrite_script.trim(),
    delivery_metrics: context.delivery_metrics,
    spoken_score: composite.spoken100,
    deck_score: composite.deck100,
    pre_penalty_overall: composite.overallBeforePenalty,
    penalty: composite.penalty,
    sentiment_profile: judgeFeedback.sentiment_profile,
    anti_pattern_hits: context.detected_anti_patterns,
    citations: judgeFeedback.citations,
    stage_expectations: context.stage_expectations,
    do_next_checklist: judgeFeedback.do_next_checklist.slice(0, 5),
  };
}

async function analyzeWithContext(
  input: AnalyzePitchInput,
  context: ScoringContext,
): Promise<AnalyzePitchResult> {
  try {
    const judged = await runJudgeAgent({
      mode: input.mode,
      transcript: input.transcript,
      deckText: input.deckText,
      context,
    });

    const feedback = applyDeterministicScoring(judged.payload.feedback, context);
    const qaPack = ensureQaPack(judged.payload.qa_1min, feedback, context);
    const analysis: AnalysisResultV2 = {
      analysisVersion: 'v2',
      coverage: context.coverage,
      outputs: {
        feedback,
        qa_1min: qaPack,
      },
      meta: judged.meta,
      analysis: feedback,
      fallback: false,
    };
    return { analysis, fallback: false };
  } catch (error) {
    const telemetry =
      (error as {
        telemetry?: {
          latencyMs?: number;
          attemptCount?: number;
          failedAttempts?: Array<{ provider: 'openrouter' | 'anthropic'; message: string }>;
        };
      })?.telemetry ?? undefined;
    const errorMessage = error instanceof Error ? error.message : 'Judge call failed.';
    const fallback = cloneSample();
    fallback.coverage = context.coverage;
    fallback.outputs.feedback.delivery_metrics = context.delivery_metrics;
    if (context.coverage === 'spoken+deck') {
      const existingDeck = fallback.outputs.feedback.rubric_breakdown.filter((item) =>
        DECK_CATEGORY_ORDER.includes(item.category as DeckRubricCategory),
      );
      if (existingDeck.length === 0) {
        fallback.outputs.feedback.rubric_breakdown.push(
          ...DECK_CATEGORY_ORDER.map((category) => ({
            category,
            score: 10,
            max_score: 20,
            rationale: 'Fallback deck score; regenerate when live LLM is available.',
          })),
        );
      }
      fallback.outputs.feedback.deck_score = 50;
      fallback.outputs.feedback.pre_penalty_overall = Math.round(
        0.65 * fallback.outputs.feedback.spoken_score + 0.35 * 50,
      );
      fallback.outputs.feedback.overall_score = Math.max(
        0,
        Math.round(
          fallback.outputs.feedback.pre_penalty_overall -
            fallback.outputs.feedback.penalty,
        ),
      );
    }
    fallback.analysis = fallback.outputs.feedback;
    fallback.meta = {
      provider_used: 'none',
      fallback_used: true,
      cache_hit: false,
      llm_calls_used: 0,
      latency_ms: telemetry?.latencyMs ?? 0,
      attempt_count: telemetry?.attemptCount ?? 0,
      error_details: {
        message: errorMessage,
        timeout: errorMessage.toLowerCase().includes('timed out'),
        provider_attempts: telemetry?.failedAttempts,
      },
    };
    fallback.fallback = true;
    return { analysis: fallback, fallback: true };
  }
}

export async function analyzePitch(input: AnalyzePitchInput): Promise<AnalyzePitchResult> {
  const context = await buildScoringContext({
    mode: input.mode,
    transcript: input.transcript,
    deckText: input.deckText,
    stage: input.stage,
    transcriptSegments: input.transcriptSegments,
  });

  const cacheKey = buildAnalysisCacheKey({
    normalizedTranscript: context.normalized_transcript,
    mode: context.mode,
    deckText: context.normalized_deck_text,
    stage: context.stage,
    promptVersion: context.prompt_version,
    rubricVersion: context.rubric_version,
    knowledgeVersion: context.knowledge_version,
  });

  const shouldUseCache = !input.regenerate;
  if (shouldUseCache) {
    const cached = await getCachedAnalysis(cacheKey);
    if (cached) {
      return {
        analysis: {
          ...cached,
          meta: {
            ...cached.meta,
            cache_hit: true,
            llm_calls_used: 0,
            attempt_count: 0,
            latency_ms: 0,
          },
        },
        fallback: Boolean(cached.fallback),
      };
    }
  }

  const run = async (): Promise<AnalyzePitchResult> => {
    const result = await analyzeWithContext(input, context);
    if (!input.regenerate) {
      await setCachedAnalysis(cacheKey, result.analysis);
    }
    return result;
  };

  if (shouldUseCache) {
    return withInFlightDedup(cacheKey, run);
  }
  return run();
}
