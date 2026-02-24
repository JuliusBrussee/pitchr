import { describe, expect, it, vi, beforeEach } from 'vitest';
import { applyHardGateCaps, analyzePitch } from '@/services/analysisService';
import type { RubricScore, ScoringContext } from '@/types/analysis-v2';

// ---------------------------------------------------------------------------
// Mock all external dependencies for analyzePitch
// ---------------------------------------------------------------------------

vi.mock('@/services/prepAgentService', () => ({
  buildScoringContext: vi.fn().mockResolvedValue({
    mode: 'vc_pitch',
    stage: 'seed',
    coverage: 'spoken_only',
    normalized_transcript: 'we build tools for teams',
    normalized_deck_text: '',
    transcript_word_count: 5,
    deck_word_count: 0,
    beats: [],
    detected_anti_patterns: [],
    delivery_metrics: {
      word_count: 5,
      duration_seconds: 30,
      target_wpm: 140,
      wpm: 10,
      filler_count: 0,
      filler_rate: 0,
      disfluency_count: 0,
      stutter_rate: 0,
      repeated_ngram_tokens: 0,
      repeat_rate: 0,
      within_time_limit: false,
      pace_score_component: 0,
      filler_score_component: 1,
      stutter_score_component: 1,
      repeat_score_component: 1,
      time_score_component: 0,
      delivery20: 6,
      filler_words: [],
      repeated_phrases: [],
      events: [],
    },
    knowledge_digest: {
      do_rules: [],
      dont_rules: [],
      category_guidance: { structure: [], clarity: [], evidence: [], market: [], delivery: [] },
      anti_pattern_playbook: {},
      digest_version: 'test',
    },
    knowledge_digest_chars: 0,
    knowledge_digest_rules_count: 0,
    retrieved_patterns: [],
    stage_expectations: [],
    knowledge_version: 'test',
    prompt_version: 'test',
    rubric_version: 'test',
  }),
}));

vi.mock('@/services/judgeAgentService', () => ({
  runJudgeAgent: vi.fn().mockResolvedValue({
    payload: {
      feedback: {
        one_line_verdict: 'Test verdict',
        rubric_breakdown: [
          { category: 'structure', score: 14, max_score: 20, rationale: 'Solid structure.' },
          { category: 'clarity', score: 12, max_score: 20, rationale: 'Clear enough.' },
          { category: 'evidence', score: 10, max_score: 20, rationale: 'Needs numbers.' },
          { category: 'market', score: 11, max_score: 20, rationale: 'Market present.' },
          { category: 'delivery', score: 15, max_score: 20, rationale: 'LLM estimate.' },
        ],
        top_fixes: [
          { rank: 1, category: 'evidence', issue: 'No metrics', fix: 'Add ARR', impact: 'high' },
        ],
        rewrite_script: 'Improved pitch text.',
        sentiment_profile: { tone: 'neutral', confidence: 0.8 },
        citations: [],
        do_next_checklist: ['Add metrics'],
      },
      qa_1min: null,
    },
    meta: {
      provider_used: 'anthropic',
      fallback_used: false,
      cache_hit: false,
      llm_calls_used: 1,
      latency_ms: 1500,
      attempt_count: 1,
      telemetry: {},
    },
  }),
}));

vi.mock('@/services/analysisCacheService', () => ({
  buildAnalysisCacheKey: vi.fn().mockReturnValue('test-cache-key'),
  getCachedAnalysis: vi.fn().mockResolvedValue(null),
  setCachedAnalysis: vi.fn().mockResolvedValue(undefined),
  withInFlightDedup: vi.fn().mockImplementation((_key: string, fn: () => Promise<unknown>) => fn()),
}));

vi.mock('@/services/sectionAgentService', () => ({
  runSectionAgent: vi.fn().mockResolvedValue({
    sections: [
      { beat: 'problem', quotes: ['data silos'], rewrite: 'Better problem framing.' },
    ],
  }),
}));

vi.mock('@/services/knowledgeCalibrationService', () => ({
  calibrateFeedbackWithKnowledge: vi.fn().mockImplementation((feedback: unknown) => ({
    feedback,
    rulesUsedCount: 0,
  })),
}));

vi.mock('@/services/runComparisonService', () => ({
  buildHistoricalLinks: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/services/deckLinkingService', () => ({
  linkSectionFeedbackToDeck: vi.fn().mockResolvedValue({ sections: [], averageConfidence: 0 }),
}));

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

function baseScoringContext(
  antiPatternLabels: string[] = [],
): ScoringContext {
  return {
    mode: 'vc_pitch',
    stage: 'seed',
    coverage: 'spoken_only',
    normalized_transcript: 'test',
    normalized_deck_text: '',
    transcript_word_count: 10,
    deck_word_count: 0,
    beats: [],
    detected_anti_patterns: antiPatternLabels.map((label, i) => ({
      id: `ap-${i}`,
      label,
      hit: true,
      weight: 2,
      evidence: `${label} detected`,
      penalty: 1,
    })),
    delivery_metrics: {
      word_count: 120,
      duration_seconds: 60,
      target_wpm: 140,
      wpm: 120,
      filler_count: 0,
      filler_rate: 0,
      disfluency_count: 0,
      stutter_rate: 0,
      repeated_ngram_tokens: 0,
      repeat_rate: 0,
      within_time_limit: true,
      pace_score_component: 1,
      filler_score_component: 1,
      stutter_score_component: 1,
      repeat_score_component: 1,
      time_score_component: 1,
      delivery20: 20,
      filler_words: [],
      repeated_phrases: [],
    },
    knowledge_digest: {
      do_rules: [],
      dont_rules: [],
      category_guidance: { structure: [], clarity: [], evidence: [], market: [], delivery: [] },
      anti_pattern_playbook: {},
      digest_version: 'test',
    },
    knowledge_digest_chars: 0,
    knowledge_digest_rules_count: 0,
    retrieved_patterns: [],
    stage_expectations: [],
    knowledge_version: 'test',
    prompt_version: 'test',
    rubric_version: 'test',
  };
}

// ---------------------------------------------------------------------------
// applyHardGateCaps (exported, tested directly)
// ---------------------------------------------------------------------------

describe('applyHardGateCaps', () => {
  it('does not modify scores when no anti-patterns hit', () => {
    const rubric: RubricScore[] = [
      { category: 'evidence', score: 18, max_score: 20, rationale: 'Strong proof.' },
      { category: 'structure', score: 16, max_score: 20, rationale: 'Clear structure.' },
    ];
    const context = baseScoringContext([]);
    const result = applyHardGateCaps(rubric, context);
    expect(result[0].score).toBe(18);
    expect(result[1].score).toBe(16);
  });

  it('caps evidence at 8 when no_proof is hit', () => {
    const rubric: RubricScore[] = [
      { category: 'evidence', score: 16, max_score: 20, rationale: 'Some proof.' },
    ];
    const result = applyHardGateCaps(rubric, baseScoringContext(['no_proof']));
    expect(result[0].score).toBe(8);
    expect(result[0].rationale).toContain('capped');
  });

  it('caps structure at 12 and deck_ask at 8 when no_ask is hit', () => {
    const rubric: RubricScore[] = [
      { category: 'structure', score: 18, max_score: 20, rationale: 'Good.' },
      { category: 'deck_ask', score: 14, max_score: 20, rationale: 'OK.' },
    ];
    const result = applyHardGateCaps(rubric, baseScoringContext(['no_ask']));
    expect(result.find((r) => r.category === 'structure')!.score).toBe(12);
    expect(result.find((r) => r.category === 'deck_ask')!.score).toBe(8);
  });

  it('caps market at 10 when tam_only is hit', () => {
    const rubric: RubricScore[] = [
      { category: 'market', score: 19, max_score: 20, rationale: 'Good.' },
    ];
    const result = applyHardGateCaps(rubric, baseScoringContext(['tam_only']));
    expect(result[0].score).toBe(10);
  });

  it('does not cap score already below threshold', () => {
    const rubric: RubricScore[] = [
      { category: 'evidence', score: 5, max_score: 20, rationale: 'Weak.' },
    ];
    const result = applyHardGateCaps(rubric, baseScoringContext(['no_proof']));
    expect(result[0].score).toBe(5); // Already below 8 cap
  });

  it('applies multiple caps when multiple anti-patterns hit', () => {
    const rubric: RubricScore[] = [
      { category: 'evidence', score: 18, max_score: 20, rationale: 'Good.' },
      { category: 'market', score: 16, max_score: 20, rationale: 'Good.' },
    ];
    const result = applyHardGateCaps(rubric, baseScoringContext(['no_proof', 'tam_only']));
    expect(result.find((r) => r.category === 'evidence')!.score).toBe(8);
    expect(result.find((r) => r.category === 'market')!.score).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// analyzePitch (full pipeline with mocked deps)
// ---------------------------------------------------------------------------

describe('analyzePitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns v2 analysis result with correct structure', async () => {
    const result = await analyzePitch({
      supabase: {} as any,
      transcript: 'We build tools for teams.',
      mode: 'vc_pitch',
    });

    expect(result.analysis.analysisVersion).toBe('v2');
    expect(result.analysis.coverage).toBe('spoken_only');
    expect(result.analysis.outputs.feedback).toBeDefined();
    expect(result.analysis.outputs.qa_1min).toBeDefined();
    expect(result.fallback).toBe(false);
  });

  it('includes deterministic delivery score overriding LLM delivery', async () => {
    const result = await analyzePitch({
      supabase: {} as any,
      transcript: 'We build tools for teams.',
      mode: 'vc_pitch',
    });

    const deliveryRubric = result.analysis.outputs.feedback.rubric_breakdown.find(
      (r) => r.category === 'delivery',
    );
    expect(deliveryRubric).toBeDefined();
    // Should use the deterministic delivery20 from context, not LLM's guess
    expect(deliveryRubric!.score).toBe(6); // matches mock context delivery20
  });

  it('produces a QA pack even when judge returns null', async () => {
    const result = await analyzePitch({
      supabase: {} as any,
      transcript: 'We build tools for teams.',
      mode: 'vc_pitch',
    });

    const qaPack = result.analysis.outputs.qa_1min;
    expect(qaPack).toBeDefined();
    expect(qaPack.investor_questions).toHaveLength(3);
    expect(qaPack.suggested_answers).toHaveLength(3);
    expect(qaPack.total_target_seconds).toBe(60);
  });

  it('includes vocabulary metrics in output', async () => {
    const result = await analyzePitch({
      supabase: {} as any,
      transcript: 'We build tools for teams.',
      mode: 'vc_pitch',
    });

    expect(result.analysis.outputs.feedback.vocabulary_metrics).toBeDefined();
    expect(result.analysis.outputs.feedback.vocabulary_metrics!.total_words).toBeGreaterThan(0);
  });

  it('includes advanced reasoning', async () => {
    const result = await analyzePitch({
      supabase: {} as any,
      transcript: 'We build tools for teams.',
      mode: 'vc_pitch',
    });

    const reasoning = result.analysis.outputs.feedback.advanced_reasoning;
    expect(reasoning).toBeDefined();
    expect(reasoning!.score_logic.length).toBeGreaterThan(0);
    expect(reasoning!.strongest_signals.length).toBeGreaterThan(0);
    expect(reasoning!.weakest_signals.length).toBeGreaterThan(0);
    expect(reasoning!.confidence).toBeGreaterThanOrEqual(0.35);
    expect(reasoning!.confidence).toBeLessThanOrEqual(0.95);
  });

  it('falls back to sample result when judge agent fails', async () => {
    const { runJudgeAgent } = await import('@/services/judgeAgentService');
    (runJudgeAgent as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('LLM timeout'),
    );

    const result = await analyzePitch({
      supabase: {} as any,
      transcript: 'We build tools for teams.',
      mode: 'vc_pitch',
    });

    expect(result.fallback).toBe(true);
    expect(result.analysis.fallback).toBe(true);
    expect(result.analysis.meta.fallback_used).toBe(true);
  });

  it('uses cached result when available and appropriate', async () => {
    const { getCachedAnalysis } = await import('@/services/analysisCacheService');
    const cachedAnalysis = {
      analysisVersion: 'v2' as const,
      coverage: 'spoken_only' as const,
      outputs: { feedback: {} as any, qa_1min: {} as any },
      meta: {
        provider_used: 'anthropic' as const,
        fallback_used: false,
        cache_hit: false,
        llm_calls_used: 1,
        latency_ms: 1000,
        attempt_count: 1,
      },
      analysis: {} as any,
      fallback: false,
    };
    (getCachedAnalysis as ReturnType<typeof vi.fn>).mockResolvedValueOnce(cachedAnalysis);

    const result = await analyzePitch({
      supabase: {} as any,
      transcript: 'We build tools for teams.',
      mode: 'vc_pitch',
    });

    expect(result.analysis.meta.cache_hit).toBe(true);
    expect(result.analysis.meta.llm_calls_used).toBe(0);
  });
});
