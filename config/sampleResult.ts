import type { AnalysisResultV2 } from '@/types/analysis-v2';

const FALLBACK_FEEDBACK: AnalysisResultV2['outputs']['feedback'] = {
      overall_score: 64,
      one_line_verdict:
        'Clear problem framing and decent structure, but investor proof and differentiation still need stronger evidence.',
      rubric_breakdown: [
        {
          category: 'structure',
          score: 15,
          max_score: 20,
          rationale:
            'The sequence is understandable, but transitions to market and ask can be tighter.',
        },
        {
          category: 'clarity',
          score: 14,
          max_score: 20,
          rationale:
            'Core message is understandable, though some wording remains generic.',
        },
        {
          category: 'evidence',
          score: 12,
          max_score: 20,
          rationale:
            'Proof exists but lacks enough named metrics to fully support the pitch.',
        },
        {
          category: 'market',
          score: 11,
          max_score: 20,
          rationale:
            'Market opportunity and defensibility are present but not sharply distinguished.',
        },
        {
          category: 'delivery',
          score: 12,
          max_score: 20,
          rationale:
            'Delivery is serviceable with room to reduce filler words and tighten pace control.',
        },
      ],
      top_fixes: [
        {
          rank: 1,
          category: 'evidence',
          issue:
            'Claims around traction are broad and not anchored by enough hard numbers.',
          fix: 'Add two to three concrete metrics tied to growth, retention, or revenue.',
          impact: 'high',
        },
        {
          rank: 2,
          category: 'market',
          issue:
            'Differentiation is implied but not explicit against named alternatives.',
          fix: 'State your competitor baseline and the single strongest wedge in one line.',
          impact: 'high',
        },
        {
          rank: 3,
          category: 'structure',
          issue:
            'The ask lands late and does not tie directly to milestone outcomes.',
          fix: 'Close with a specific ask and 12-18 month milestones funded by the raise.',
          impact: 'medium',
        },
        {
          rank: 4,
          category: 'clarity',
          issue:
            'A few abstract phrases reduce precision and investor confidence.',
          fix: 'Replace abstract adjectives with factual statements and concrete nouns.',
          impact: 'medium',
        },
        {
          rank: 5,
          category: 'delivery',
          issue:
            'Filler and repeated phrasing soften conviction in high-leverage moments.',
          fix: 'Trim filler words and rehearse the opening and close verbatim.',
          impact: 'low',
        },
      ],
      rewrite_script:
        'We are building Pitchr, an AI pitch coach that helps founders deliver investor-ready fundraising narratives quickly. Today, founders rely on ad hoc feedback loops that are inconsistent and slow, which means key weaknesses stay hidden until high-stakes meetings.\n\nPitchr scores each pitch across structure, clarity, evidence, market, and delivery, then ranks the top fixes so founders know exactly what to improve next. Our product shortens the iteration loop from days to minutes and turns vague advice into concrete action.\n\nWe are raising to improve scoring quality, expand deck-aware analysis, and scale distribution through accelerators and founder communities. With this capital, we will convert early demand into repeatable revenue growth.',
      delivery_metrics: {
        word_count: 147,
        duration_seconds: 63,
        target_wpm: 140,
        wpm: 140,
        filler_count: 2,
        filler_rate: 0.0136,
        disfluency_count: 1,
        stutter_rate: 0.0068,
        repeated_ngram_tokens: 1,
        repeat_rate: 0.0068,
        within_time_limit: true,
        pace_score_component: 1,
        filler_score_component: 0.5467,
        stutter_score_component: 0.66,
        repeat_score_component: 0.5467,
        time_score_component: 1,
        delivery20: 14.2,
        filler_words: [
          { word: 'um', count: 1 },
          { word: 'like', count: 1 },
        ],
        repeated_phrases: [{ phrase: 'we are', count: 2 }],
      },
      spoken_score: 64,
      deck_score: null,
      pre_penalty_overall: 64,
      penalty: 0,
      sentiment_profile: {
        confidence: 0.62,
        urgency: 0.55,
        credibility: 0.59,
        clarity: 0.64,
        investor_readiness: 0.61,
      },
      anti_pattern_hits: [
        {
          id: 'vague-traction',
          label: 'Vague traction claim',
          hit: true,
          weight: 2.5,
          evidence: 'Uses broad traction language without named metrics.',
          penalty: 2.5,
        },
      ],
      citations: [
        {
          source_id: 'sample-fallback',
          source_url: 'https://www.ycombinator.com/library/4b-how-to-pitch-your-company',
          source_title: 'How to Pitch Your Company',
          access_status: 'full',
          snapshot_date: '2026-02-21',
          confidence_score: 0.7,
          excerpt: 'Fallback citation used when live providers fail.',
        },
      ],
      stage_expectations: [
        {
          stage: 'seed',
          expectations: [
            'Show repeatability in acquisition or retention.',
            'Tie the ask to near-term milestones.',
          ],
        },
      ],
      do_next_checklist: [
        'Add 2-3 concrete proof metrics with named periods.',
        'Clarify one-line differentiation against top competitor.',
        'Close with a crisp ask and milestone linkage.',
      ],
      summary_good:
        'Problem framing and structure are clear enough to keep an investor engaged through the full minute.',
      summary_bad:
        'Proof and differentiation language remains too generic, which weakens conviction and urgency.',
      section_feedback: [],
      rewrite_diff: {
        hunks: [],
        stats: {
          added: 0,
          removed: 0,
          changed: 0,
        },
        alignment_score: 1,
      },
      vocabulary_metrics: {
        total_words: 147,
        unique_words: 109,
        lexical_diversity: 0.7415,
        hedge_density: 0.0136,
        jargon_density: 0,
        softener_density: 0.0136,
        hedge_terms: [{ term: 'like', count: 1 }],
        jargon_terms: [],
        softener_terms: [{ term: 'like', count: 1 }],
      },
      historical_links: [],
      advanced_reasoning: {
        score_logic: [
          'Delivery score is deterministic from pace, fillers, stutter, repetitions, and time compliance.',
          'Evidence and market categories were capped by weak metric specificity.',
        ],
        strongest_signals: ['Clear problem statement', 'Explicit raise intent in rewrite'],
        weakest_signals: ['Limited named proof metrics', 'Differentiation not anchored to alternatives'],
        confidence: 0.71,
      },
    };

export const SAMPLE_RESULT: AnalysisResultV2 = {
  analysisVersion: 'v2',
  coverage: 'spoken_only',
  outputs: {
    feedback: FALLBACK_FEEDBACK,
    qa_1min: {
      total_target_seconds: 60,
      timing_plan_seconds: [20, 20, 20],
      investor_questions: [
        'What proof shows this is more than an interesting idea?',
        'Why will you win in this market versus incumbents?',
        'What exact milestones will this raise fund over the next 12-18 months?',
      ],
      suggested_answers: [
        {
          question:
            'What proof shows this is more than an interesting idea?',
          answer:
            'In the last quarter we grew qualified pipeline by 38% and converted early design partners into recurring contracts, which validates both demand and willingness to pay.',
          target_seconds: 20,
        },
        {
          question:
            'Why will you win in this market versus incumbents?',
          answer:
            'We focus on one underserved founder workflow and execute faster with a product loop incumbents cannot match, giving us lower onboarding friction and faster value realization.',
          target_seconds: 20,
        },
        {
          question:
            'What exact milestones will this raise fund over the next 12-18 months?',
          answer:
            'This round funds model quality improvements, sales hires, and channel expansion to hit specific targets in revenue growth, retention, and partner-led distribution.',
          target_seconds: 20,
        },
      ],
      focus_tags: ['evidence', 'market', 'ask'],
      red_flags_to_avoid: [
        'Do not answer with broad TAM alone.',
        'Do not claim traction without a number and timeframe.',
        'Do not give an ambiguous raise amount or use of funds.',
      ],
    },
  },
  meta: {
    provider_used: 'none',
    fallback_used: true,
    cache_hit: false,
    llm_calls_used: 0,
    latency_ms: 0,
    attempt_count: 0,
  },
  analysis: FALLBACK_FEEDBACK,
  fallback: true,
};
