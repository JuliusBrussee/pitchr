import { describe, expect, it } from 'vitest';
import { SAMPLE_RESULT } from '@/config/sampleResult';
import { calibrateFeedbackWithKnowledge } from '@/services/knowledgeCalibrationService';
import type { ScoringContext } from '@/types/analysis-v2';

function buildContext(): ScoringContext {
  return {
    mode: 'vc_pitch',
    stage: 'seed',
    coverage: 'spoken_only',
    normalized_transcript: 'sample transcript',
    normalized_deck_text: '',
    transcript_word_count: 120,
    deck_word_count: 0,
    beats: [],
    detected_anti_patterns: [
      {
        id: 'ap-no-proof',
        label: 'no_proof',
        hit: true,
        weight: 2.8,
        evidence: 'No concrete numeric proof points detected.',
        penalty: 1,
      },
    ],
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
      do_rules: [
        'Open with one sentence: what you do, for whom, and why now.',
        'Quantify traction with metric, timeframe, and denominator.',
      ],
      dont_rules: [
        'Do not claim market size without execution proof.',
        'Do not end without a specific ask and use of funds.',
      ],
      category_guidance: {
        structure: ['Use problem -> solution -> proof -> ask in that order.'],
        clarity: ['Replace abstract claims with plain-English statements.'],
        evidence: ['Attach a metric, timeframe, and denominator to major claims.'],
        market: ['Define the first beachhead customer before TAM expansion.'],
        delivery: ['Remove filler words from opening and close first.'],
      },
      anti_pattern_playbook: {
        no_proof: 'Replace one abstract claim with one metric + timeframe + denominator.',
      },
      digest_version: 'v1.2.0-digest.1',
    },
    knowledge_digest_chars: 540,
    knowledge_digest_rules_count: 8,
    retrieved_patterns: [],
    stage_expectations: [],
    benchmark_profiles: {
      yc_top_decile: [],
      yc_median: [],
      common_failures: [],
    },
    source_weights: {},
    knowledge_version: 'v1.2.0',
    prompt_version: 'judge-v2.1.0',
    rubric_version: 'rubric-v2.0.0',
  };
}

describe('calibrateFeedbackWithKnowledge', () => {
  it('upgrades generic fixes with actionable knowledge guidance', () => {
    const feedback = JSON.parse(
      JSON.stringify(SAMPLE_RESULT.outputs.feedback),
    ) as typeof SAMPLE_RESULT.outputs.feedback;

    feedback.top_fixes[0] = {
      ...feedback.top_fixes[0],
      issue: 'Needs improvement.',
      fix: 'Be more specific.',
    };

    const result = calibrateFeedbackWithKnowledge(feedback, buildContext());

    expect(result.rulesUsedCount).toBeGreaterThan(0);
    expect(result.feedback.top_fixes[0].issue).not.toBe('Needs improvement.');
    expect(result.feedback.top_fixes[0].fix).not.toBe('Be more specific.');
    expect(result.feedback.top_fixes[0].fix.toLowerCase()).toContain('metric');
  });

  it('strips explicit source references from user-facing fields', () => {
    const feedback = JSON.parse(
      JSON.stringify(SAMPLE_RESULT.outputs.feedback),
    ) as typeof SAMPLE_RESULT.outputs.feedback;

    feedback.one_line_verdict = 'YC says this is solid.';
    feedback.top_fixes[0] = {
      ...feedback.top_fixes[0],
      issue: 'According to YC, this is vague.',
      fix: 'Use YC-style framing from https://example.com',
    };

    const result = calibrateFeedbackWithKnowledge(feedback, buildContext());

    expect(result.feedback.one_line_verdict.toLowerCase()).not.toContain('yc');
    expect(result.feedback.top_fixes[0].issue.toLowerCase()).not.toContain('according to');
    expect(result.feedback.top_fixes[0].fix.toLowerCase()).not.toContain('http');
  });
});
