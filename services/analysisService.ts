import { SAMPLE_RESULT } from '@/config/sampleResult';
import { HARD_GATE_CAPS } from '@/config/strictness';
import {
  buildAnalysisCacheKey,
  getCachedAnalysis,
  setCachedAnalysis,
  withInFlightDedup,
} from '@/services/analysisCacheService';
import { linkSectionFeedbackToDeck } from '@/services/deckLinkingService';
import { buildScoringContext } from '@/services/prepAgentService';
import { runJudgeAgent } from '@/services/judgeAgentService';
import { buildRewriteDiff, buildSectionRewriteDiff } from '@/services/rewriteDiffService';
import { runSectionAgent } from '@/services/sectionAgentService';
import { buildHistoricalLinks } from '@/services/runComparisonService';
import { buildSectionFeedback } from '@/services/sectionFeedbackService';
import { buildSectionSlices } from '@/services/sectioningService';
import { calculateCompositeScore } from '@/services/scoringService';
import { buildVocabularyEvents, calculateVocabularyMetrics } from '@/services/vocabularyService';
import type {
  AnalysisResultV2,
  DeckRubricCategory,
  FeedbackOutput,
  OneMinuteQAPack,
  RubricCategory,
  RubricScore,
  ScoringContext,
  ScoreCategory,
  TranscriptSegment,
} from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

interface AnalyzePitchInput {
  transcript: string;
  mode: PitchMode;
  runId?: string;
  deckId?: string;
  deckText?: string;
  stage?: 'pre_seed' | 'seed' | 'series_a' | 'series_b';
  transcriptSegments?: TranscriptSegment[];
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

const ENABLE_SECTION_FEEDBACK = process.env.ENABLE_SECTION_FEEDBACK !== 'false';
const ENABLE_REWRITE_DIFF = process.env.ENABLE_REWRITE_DIFF !== 'false';

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

function mergeDeliveryEvents(
  deliveryEvents: NonNullable<FeedbackOutput['delivery_metrics']['events']>,
  vocabEvents: ReturnType<typeof buildVocabularyEvents>,
): FeedbackOutput['delivery_metrics']['events'] {
  const merged = [...deliveryEvents, ...vocabEvents].sort(
    (left, right) => left.start_sec - right.start_sec,
  );

  const seen = new Set<string>();
  const unique = merged.filter((event) => {
    const key = `${event.type}:${event.start_sec}:${event.end_sec}:${event.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.slice(0, 80);
}

function deriveGoodBadSummary(feedback: FeedbackOutput): {
  good: string;
  bad: string;
} {
  const strongest = [...feedback.rubric_breakdown].sort((left, right) => right.score - left.score)[0];
  const weakest = [...feedback.rubric_breakdown].sort((left, right) => left.score - right.score)[0];
  const strongestFix = feedback.top_fixes[0];

  const good = strongest
    ? `Strongest signal: ${strongest.category} scored ${strongest.score}/${strongest.max_score}. ${strongest.rationale}`
    : 'Strongest signal: clear baseline pitch structure was detected.';
  const bad = weakest
    ? `Main risk: ${weakest.category} scored ${weakest.score}/${weakest.max_score}. ${strongestFix?.issue ?? weakest.rationale}`
    : strongestFix?.issue ?? 'Main risk: the pitch needs sharper proof and phrasing.';

  return { good, bad };
}

function buildAdvancedReasoning(feedback: FeedbackOutput, context: ScoringContext) {
  const strongestSignals = [...feedback.rubric_breakdown]
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((item) => `${item.category}: ${item.rationale}`);
  const weakestSignals = [...feedback.rubric_breakdown]
    .sort((left, right) => left.score - right.score)
    .slice(0, 2)
    .map((item) => `${item.category}: ${item.rationale}`);

  return {
    score_logic: [
      'Delivery is deterministic from local pace, filler, stutter, repetition, and time-limit signals.',
      context.coverage === 'spoken+deck'
        ? 'Overall score blends spoken and deck tracks with anti-pattern penalties.'
        : 'Overall score combines spoken rubric and anti-pattern penalties.',
      'Top fixes are prioritized by impact and weakest rubric categories.',
    ],
    strongest_signals: strongestSignals,
    weakest_signals: weakestSignals,
    confidence: Math.max(0.35, Math.min(0.95, 1 - feedback.penalty / 15)),
  } satisfies NonNullable<FeedbackOutput['advanced_reasoning']>;
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
    const vocabularyMetrics = calculateVocabularyMetrics(input.transcript);
    const vocabEvents = buildVocabularyEvents(
      vocabularyMetrics,
      input.transcript,
      input.transcriptSegments,
    );

    feedback.delivery_metrics.events = mergeDeliveryEvents(
      feedback.delivery_metrics.events ?? [],
      vocabEvents,
    );
    feedback.vocabulary_metrics = vocabularyMetrics;

    const summary = deriveGoodBadSummary(feedback);
    feedback.summary_good = summary.good;
    feedback.summary_bad = summary.bad;
    feedback.advanced_reasoning = buildAdvancedReasoning(feedback, context);

    let sectioningConfidence = 0;
    let deckLinkConfidence = 0;
    if (ENABLE_SECTION_FEEDBACK) {
      try {
        const sectionResult = await runSectionAgent({
          mode: input.mode,
          transcript: input.transcript,
          globalVerdict: feedback.one_line_verdict,
          topFixes: feedback.top_fixes.map((fix) => fix.fix),
        });
        for (const section of sectionResult.sections) {
          section.rewrite_diff = buildSectionRewriteDiff(
            section.quotes,
            section.rewrite,
          );
        }
        let sectionFeedback = sectionResult.sections;
        sectioningConfidence = 0.8;
        if (input.deckId) {
          const linked = await linkSectionFeedbackToDeck(sectionFeedback, input.deckId);
          sectionFeedback = linked.sections;
          deckLinkConfidence = linked.averageConfidence;
        }
        feedback.section_feedback = sectionFeedback;
      } catch (sectionError) {
        console.warn('[analysis] section agent failed, falling back to regex', {
          message: sectionError instanceof Error ? sectionError.message : String(sectionError),
        });
        const slices = buildSectionSlices({
          transcript: input.transcript,
          mode: input.mode,
          segments: input.transcriptSegments,
        });
        sectioningConfidence =
          slices.length === 0
            ? 0
            : slices.reduce((sum, slice) => sum + slice.confidence, 0) / slices.length;
        let sectionFeedback = buildSectionFeedback(slices, feedback);
        if (input.deckId) {
          const linked = await linkSectionFeedbackToDeck(sectionFeedback, input.deckId);
          sectionFeedback = linked.sections;
          deckLinkConfidence = linked.averageConfidence;
        }
        feedback.section_feedback = sectionFeedback;
      }
    }

    if (ENABLE_REWRITE_DIFF) {
      feedback.rewrite_diff = buildRewriteDiff(input.transcript, feedback.rewrite_script);
    }

    try {
      feedback.historical_links = await buildHistoricalLinks({
        mode: input.mode,
        currentFeedback: feedback,
        currentRunId: input.runId,
      });
    } catch {
      feedback.historical_links = [];
    }

    const qaPack = ensureQaPack(judged.payload.qa_1min, feedback, context);
    const analysis: AnalysisResultV2 = {
      analysisVersion: 'v2',
      coverage: context.coverage,
      outputs: {
        feedback,
        qa_1min: qaPack,
      },
      meta: {
        ...judged.meta,
        telemetry: {
          ...(judged.meta.telemetry ?? {}),
          sectioning_confidence: Number(sectioningConfidence.toFixed(4)),
          deck_link_confidence: Number(deckLinkConfidence.toFixed(4)),
        },
      },
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
    const vocabularyMetrics = calculateVocabularyMetrics(input.transcript);
    const vocabEvents = buildVocabularyEvents(
      vocabularyMetrics,
      input.transcript,
      input.transcriptSegments,
    );
    fallback.outputs.feedback.delivery_metrics.events = mergeDeliveryEvents(
      fallback.outputs.feedback.delivery_metrics.events ?? [],
      vocabEvents,
    );
    fallback.outputs.feedback.vocabulary_metrics = vocabularyMetrics;

    const summary = deriveGoodBadSummary(fallback.outputs.feedback);
    fallback.outputs.feedback.summary_good = summary.good;
    fallback.outputs.feedback.summary_bad = summary.bad;
    fallback.outputs.feedback.advanced_reasoning = buildAdvancedReasoning(
      fallback.outputs.feedback,
      context,
    );

    let sectioningConfidence = 0;
    let deckLinkConfidence = 0;
    if (ENABLE_SECTION_FEEDBACK) {
      const slices = buildSectionSlices({
        transcript: input.transcript,
        mode: input.mode,
        segments: input.transcriptSegments,
      });
      sectioningConfidence =
        slices.length === 0
          ? 0
          : slices.reduce((sum, slice) => sum + slice.confidence, 0) / slices.length;
      let sectionFeedback = buildSectionFeedback(slices, fallback.outputs.feedback);
      if (input.deckId) {
        const linked = await linkSectionFeedbackToDeck(sectionFeedback, input.deckId);
        sectionFeedback = linked.sections;
        deckLinkConfidence = linked.averageConfidence;
      }
      fallback.outputs.feedback.section_feedback = sectionFeedback;
    }

    if (ENABLE_REWRITE_DIFF) {
      fallback.outputs.feedback.rewrite_diff = buildRewriteDiff(
        input.transcript,
        fallback.outputs.feedback.rewrite_script,
      );
    }

    try {
      fallback.outputs.feedback.historical_links = await buildHistoricalLinks({
        mode: input.mode,
        currentFeedback: fallback.outputs.feedback,
        currentRunId: input.runId,
      });
    } catch {
      fallback.outputs.feedback.historical_links = [];
    }

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
      telemetry: {
        sectioning_confidence: Number(sectioningConfidence.toFixed(4)),
        deck_link_confidence: Number(deckLinkConfidence.toFixed(4)),
      },
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
    deckId: input.deckId,
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

  const shouldUseCache = !input.regenerate && !input.deckId && !input.runId;
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
