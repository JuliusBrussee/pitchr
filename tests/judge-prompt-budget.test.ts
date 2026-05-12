import { describe, expect, it } from 'vitest';
import { buildJudgeUserPromptWithTelemetry } from '@/lib/prompts/judge';
import type { ScoringContext } from '@/types/analysis-v2';

describe('buildJudgeUserPrompt', () => {
  it('keeps prompt under budget with very large context payloads', () => {
    const hugePattern = 'alpha '.repeat(5000);
    const context: ScoringContext = {
      mode: 'vc_pitch',
      stage: 'seed',
      coverage: 'spoken_only',
      normalized_transcript: 'test transcript',
      normalized_deck_text: '',
      transcript_word_count: 2,
      deck_word_count: 0,
      beats: [{ beat: 'problem', evidence: 'customers lose hours each week' }],
      detected_anti_patterns: [
        {
          id: 'no-proof',
          label: 'no_proof',
          hit: true,
          weight: 2.8,
          evidence: 'No concrete numeric proof points detected.',
          penalty: 1,
        },
      ],
      delivery_metrics: {
        word_count: 200,
        duration_seconds: 120,
        target_wpm: 140,
        wpm: 135,
        filler_count: 2,
        filler_rate: 0.01,
        disfluency_count: 1,
        stutter_rate: 0.005,
        repeated_ngram_tokens: 3,
        repeat_rate: 0.015,
        within_time_limit: true,
        pace_score_component: 0.9,
        filler_score_component: 0.8,
        stutter_score_component: 0.9,
        repeat_score_component: 0.8,
        time_score_component: 1,
        delivery20: 16,
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
          'Do not end without a clear ask.',
        ],
        category_guidance: {
          structure: ['Use problem -> solution -> proof -> ask.'],
          clarity: ['Replace abstract claims with plain language.'],
          evidence: ['Attach a metric and timeframe to each major claim.'],
          market: ['Define beachhead ICP before TAM expansion.'],
          delivery: ['Remove filler words from opening and close.'],
        },
        anti_pattern_playbook: {
          no_proof: 'Replace one abstract claim with one metric + timeframe + denominator.',
          no_ask: 'State amount raised, runway months, and milestones funded.',
        },
        digest_version: 'v1.2.0-digest.1',
      },
      knowledge_digest_chars: 640,
      knowledge_digest_rules_count: 12,
      retrieved_patterns: [
        {
          id: 'huge-pattern',
          type: 'positive',
          title: 'Huge pattern',
          text: hugePattern,
          stage: 'all',
          weight: 1.2,
        },
      ],
      stage_expectations: [{ stage: 'seed', expectations: ['clear ask'] }],
      benchmark_profiles: {
        yc_top_decile: ['strong proof and clear ask'],
        yc_median: ['decent structure'],
        common_failures: ['vague claims'],
      },
      source_weights: { 'yc-how-to-pitch': 1 },
      knowledge_version: 'v1.1.0',
      prompt_version: 'judge-v2.1.0',
      rubric_version: 'rubric-v2.0.0',
    };

    const promptBuild = buildJudgeUserPromptWithTelemetry({
      mode: 'vc_pitch',
      transcript: 'hello '.repeat(2000),
      context,
    });

    expect(promptBuild.userPrompt.length).toBeLessThanOrEqual(9000);
    expect(promptBuild.userPrompt.includes(hugePattern)).toBe(false);
    expect(promptBuild.userPrompt.includes('knowledge_digest')).toBe(true);
    expect(promptBuild.knowledgeIncluded).toBe(true);
    expect(promptBuild.knowledgeChars).toBeGreaterThanOrEqual(320);
  });
});
