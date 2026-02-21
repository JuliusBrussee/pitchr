import { describe, expect, it } from 'vitest';
import { buildJudgeUserPrompt } from '@/lib/prompts/judge';
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

    const prompt = buildJudgeUserPrompt({
      mode: 'vc_pitch',
      transcript: 'hello '.repeat(2000),
      context,
    });

    expect(prompt.length).toBeLessThanOrEqual(9000);
    expect(prompt.includes(hugePattern)).toBe(false);
  });
});
