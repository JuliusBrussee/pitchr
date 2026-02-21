import { describe, expect, it } from 'vitest';
import { applyHardGateCaps } from '@/services/analysisService';
import type { RubricScore, ScoringContext } from '@/types/analysis-v2';

function baseContext(labels: string[]): ScoringContext {
  return {
    mode: 'vc_pitch',
    stage: 'seed',
    coverage: 'spoken+deck',
    normalized_transcript: 'sample',
    normalized_deck_text: 'sample deck',
    transcript_word_count: 10,
    deck_word_count: 10,
    beats: [],
    detected_anti_patterns: labels.map((label, index) => ({
      id: `ap-${index}`,
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
    retrieved_patterns: [],
    stage_expectations: [],
    knowledge_version: 'v1.1.0',
    prompt_version: 'judge-v2.1.0',
    rubric_version: 'rubric-v2.0.0',
  };
}

describe('YC hard gate caps', () => {
  it('caps evidence at 8 when no_proof is hit', () => {
    const rubric: RubricScore[] = [
      { category: 'evidence', score: 16, max_score: 20, rationale: 'good' },
    ];
    const capped = applyHardGateCaps(rubric, baseContext(['no_proof']));
    expect(capped[0].score).toBe(8);
  });

  it('caps structure and deck_ask when no_ask is hit', () => {
    const rubric: RubricScore[] = [
      { category: 'structure', score: 18, max_score: 20, rationale: 'good' },
      { category: 'deck_ask', score: 14, max_score: 20, rationale: 'good' },
    ];
    const capped = applyHardGateCaps(rubric, baseContext(['no_ask']));
    expect(capped.find((item) => item.category === 'structure')?.score).toBe(12);
    expect(capped.find((item) => item.category === 'deck_ask')?.score).toBe(8);
  });

  it('caps market at 10 when tam_only is hit', () => {
    const rubric: RubricScore[] = [
      { category: 'market', score: 19, max_score: 20, rationale: 'good' },
    ];
    const capped = applyHardGateCaps(rubric, baseContext(['tam_only']));
    expect(capped[0].score).toBe(10);
  });
});
