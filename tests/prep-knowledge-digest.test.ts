import { describe, expect, it } from 'vitest';
import { buildKnowledgeDigest, normalizeBeatForScoring } from '@/services/prepAgentService';
import type { AntiPatternHit, StageExpectation } from '@/types/analysis-v2';

function antiPattern(label: string, hit: boolean): AntiPatternHit {
  return {
    id: `ap-${label}`,
    label,
    hit,
    weight: 2,
    evidence: `${label} evidence`,
    penalty: hit ? 1 : 0,
  };
}

describe('buildKnowledgeDigest', () => {
  it('builds a non-empty digest within size budget', () => {
    const digest = buildKnowledgeDigest({
      patterns: {
        knowledge_version: 'v1.2.0',
        judge_guidance: {
          do_rules: ['Open clearly.', 'Use metrics with timeframe.'],
          dont_rules: ['Do not be vague.'],
          category_guidance: {
            structure: ['Use problem -> solution -> proof -> ask.'],
            clarity: ['Use plain language.'],
            evidence: ['Cite one metric and period.'],
            market: ['Define a beachhead customer.'],
            delivery: ['Pause before proof statements.'],
          },
          anti_pattern_playbook: {
            no_proof: 'Replace one abstract claim with one metric + timeframe + denominator.',
          },
          digest_version: 'v1.2.0-digest.1',
        },
      },
      stage: 'seed',
      mode: 'vc_pitch',
      antiPatterns: [antiPattern('no_proof', true), antiPattern('no_ask', false)],
      stageExpectations: [
        {
          stage: 'seed',
          expectations: ['Connect ask to 12-18 month milestones.'],
        } as StageExpectation,
      ],
    });

    const chars = JSON.stringify(digest).length;
    expect(digest.do_rules.length).toBeGreaterThan(0);
    expect(digest.dont_rules.length).toBeGreaterThan(0);
    expect(chars).toBeLessThanOrEqual(1200);
    expect(chars).toBeGreaterThanOrEqual(320);
  });

  it('prioritizes anti-pattern playbook guidance when hits exist', () => {
    const digest = buildKnowledgeDigest({
      patterns: {
        knowledge_version: 'v1.2.0',
        judge_guidance: {
          do_rules: ['General rule'],
          dont_rules: ['General dont'],
          category_guidance: {
            structure: ['Structure rule'],
            clarity: ['Clarity rule'],
            evidence: ['Evidence rule'],
            market: ['Market rule'],
            delivery: ['Delivery rule'],
          },
          anti_pattern_playbook: {
            no_ask: 'State amount raised, runway months, and 2-3 milestone outcomes.',
          },
          digest_version: 'v1.2.0-digest.1',
        },
      },
      stage: 'seed',
      mode: 'elevator',
      antiPatterns: [antiPattern('no_ask', true)],
      stageExpectations: [],
    });

    expect(
      digest.do_rules.some((rule) => rule.toLowerCase().includes('amount raised')),
    ).toBe(true);
  });
});

describe('normalizeBeatForScoring', () => {
  it('maps hackathon-specific beats to canonical scoring beats', () => {
    expect(normalizeBeatForScoring('demo', 'hackathon')).toBe('mechanism');
    expect(normalizeBeatForScoring('innovation', 'hackathon')).toBe('differentiation');
    expect(normalizeBeatForScoring('impact', 'hackathon')).toBe('wedge');
  });

  it('maps final_year-specific beats to canonical scoring beats', () => {
    expect(normalizeBeatForScoring('methodology', 'final_year')).toBe('mechanism');
    expect(normalizeBeatForScoring('results', 'final_year')).toBe('proof');
    expect(normalizeBeatForScoring('evaluation', 'final_year')).toBe('proof');
    expect(normalizeBeatForScoring('limitations', 'final_year')).toBe('wedge');
  });

  it('keeps canonical beats unchanged', () => {
    expect(normalizeBeatForScoring('problem', 'hackathon')).toBe('problem');
    expect(normalizeBeatForScoring('ask', 'final_year')).toBe('ask');
    expect(normalizeBeatForScoring('one_liner', 'vc_pitch')).toBe('one_liner');
  });
});
