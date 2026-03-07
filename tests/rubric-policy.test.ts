import { describe, expect, it } from 'vitest';
import {
  applyRubricPolicyToFeedback,
  buildRubricPolicy,
  resolveRubricPolicyFromPromptOverrides,
} from '@/supabase/functions/_shared/rubric-policy.ts';

function createFeedback() {
  return {
    overall_score: 78,
    one_line_verdict: 'Strong baseline pitch with evidence gaps.',
    rubric_breakdown: [
      { category: 'structure', score: 16, max_score: 20, rationale: 'Good sequencing.' },
      { category: 'clarity', score: 15, max_score: 20, rationale: 'Mostly clear language.' },
      { category: 'evidence', score: 14, max_score: 20, rationale: 'Some data included.' },
      { category: 'market', score: 17, max_score: 20, rationale: 'Market framing is specific.' },
      { category: 'delivery', score: 16, max_score: 20, rationale: 'Delivery is confident.' },
    ],
    top_fixes: [
      {
        rank: 1,
        category: 'evidence',
        issue: 'Proof points are too broad.',
        fix: 'Add conversion and retention numbers.',
        impact: 'high' as const,
      },
    ],
    do_next_checklist: ['Add one stronger customer proof point.'],
    sentiment_profile: {
      confidence: 0.7,
      urgency: 0.6,
      credibility: 0.6,
      clarity: 0.7,
      investor_readiness: 0.65,
    },
  };
}

describe('rubric-policy', () => {
  it('parses pineapple hard-cap rules from rubric text', () => {
    const policy = buildRubricPolicy(
      'If "pineapple" is absent, do not score any category above 6/20.',
    );

    expect(policy.required_terms).toContain('pineapple');
    expect(policy.hard_caps).toHaveLength(1);
    expect(policy.hard_caps[0]).toMatchObject({
      scope: 'all',
      required_term: 'pineapple',
      max_score: 6,
    });
  });

  it('enforces score caps when required rubric mention is missing', () => {
    const policy = buildRubricPolicy(
      'If "pineapple" is absent, do not score any category above 6/20.',
    );
    const feedback = createFeedback();

    const result = applyRubricPolicyToFeedback(feedback, {
      policy,
      transcript: 'We are raising to expand distribution and improve retention.',
    });

    expect(result.evaluation.applied).toBe(true);
    expect(result.evaluation.missing_terms).toContain('pineapple');
    expect(result.evaluation.adjustments.length).toBeGreaterThan(0);
    expect(result.feedback.rubric_breakdown.every((item) => item.score <= 6)).toBe(true);
    expect(result.feedback.overall_score).toBe(30);
    expect(result.feedback.one_line_verdict).toContain('Custom rubric penalty');
    expect(result.feedback.top_fixes?.[0]?.issue).toContain('pineapple');
    expect(result.feedback.do_next_checklist?.[0]).toContain('pineapple');
  });

  it('does not cap scores when required mention is present', () => {
    const policy = buildRubricPolicy(
      'If "pineapple" is absent, do not score any category above 6/20.',
    );
    const feedback = createFeedback();

    const result = applyRubricPolicyToFeedback(feedback, {
      policy,
      transcript: 'We explicitly mention pineapple in our product positioning.',
    });

    expect(result.evaluation.missing_terms).toEqual([]);
    expect(result.evaluation.adjustments).toEqual([]);
    expect(result.feedback.rubric_breakdown.map((item) => item.score)).toEqual([16, 15, 14, 17, 16]);
    expect(result.feedback.overall_score).toBe(78);
  });

  it('applies a minimum penalty when rubric requires mention without explicit cap', () => {
    const policy = buildRubricPolicy('You must mention pineapple in the pitch.');
    const feedback = createFeedback();

    const result = applyRubricPolicyToFeedback(feedback, {
      policy,
      transcript: 'We mention apples and oranges but not the required fruit.',
    });

    expect(result.evaluation.applied).toBe(true);
    expect(result.evaluation.missing_terms).toContain('pineapple');
    expect(result.evaluation.adjustments.length).toBeGreaterThan(0);
    expect(result.feedback.overall_score).toBeLessThan(78);
    expect(result.feedback.top_fixes?.[0]?.issue).toContain('pineapple');
  });

  it('resolves policy from prompt-overrides fallback text', () => {
    const resolved = resolveRubricPolicyFromPromptOverrides({
      analysis_system_prompt:
        'If "pineapple" is absent, do not score any category above 6/20.',
    });

    expect(resolved).toBeDefined();
    expect(resolved?.required_terms).toContain('pineapple');
    expect(resolved?.hard_caps).toHaveLength(1);
  });
});
