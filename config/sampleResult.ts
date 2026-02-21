import type { AnalysisResult } from '@/types/analysis';

export interface FallbackSampleResult {
  fallback: true;
  analysis: AnalysisResult;
}

export const SAMPLE_RESULT: FallbackSampleResult = {
  fallback: true,
  analysis: {
    overall_score: 62,
    one_line_verdict:
      'Strong problem framing, but evidence and market detail need to be more concrete for investors.',
    rubric_breakdown: [
      {
        category: 'structure',
        score: 15,
        max_score: 20,
        rationale:
          'Flow is understandable, but transitions into market and ask are abrupt.',
      },
      {
        category: 'clarity',
        score: 14,
        max_score: 20,
        rationale:
          'Core message is understandable, but some filler and hedging weaken confidence.',
      },
      {
        category: 'evidence',
        score: 11,
        max_score: 20,
        rationale:
          'Some traction is implied, but specific metrics and named proof points are limited.',
      },
      {
        category: 'market',
        score: 10,
        max_score: 20,
        rationale:
          'Market opportunity is mentioned without a clear sizing framework or competitive map.',
      },
      {
        category: 'delivery',
        score: 12,
        max_score: 20,
        rationale:
          'Pace is acceptable, but filler words and repeated phrases reduce polish.',
      },
    ],
    top_fixes: [
      {
        rank: 1,
        category: 'evidence',
        issue:
          'Claims are broad without enough concrete traction data to prove momentum.',
        fix: 'Add 2-3 hard metrics (ARR, growth rate, user count) and name one customer or pilot.',
        impact: 'high',
      },
      {
        rank: 2,
        category: 'market',
        issue:
          'No clear competitor positioning or sourced market sizing in the narrative.',
        fix: 'Include a concise TAM/SAM statement and name direct alternatives with your differentiation.',
        impact: 'high',
      },
      {
        rank: 3,
        category: 'clarity',
        issue: 'Hedging language weakens conviction during key parts of the pitch.',
        fix: 'Replace qualifiers with direct statements and shorten long sentences.',
        impact: 'medium',
      },
      {
        rank: 4,
        category: 'structure',
        issue: 'Ask section does not land with a crisp final line.',
        fix: 'End with a direct ask and one sentence tying capital to measurable milestones.',
        impact: 'medium',
      },
      {
        rank: 5,
        category: 'delivery',
        issue: 'Repeated phrases and filler words reduce investor confidence.',
        fix: 'Practice the closing verbatim and cut repeated two-word phrases.',
        impact: 'low',
      },
    ],
    rewrite_script:
      'We are building an AI pitch coach that helps founders deliver investor-ready pitches with clarity and confidence. Founders today rely on inconsistent feedback from friends or mentors, which slows iteration and leaves major weaknesses unresolved. Pitchr provides a structured score across five investor-facing categories, then gives the top fixes in priority order so founders know exactly what to change next.\n\nOur wedge is speed and repeatability: a founder can practice, get a score, apply fixes, and rerun in minutes. In early usage, users report better confidence and sharper messaging after just a few iterations. We are now focused on turning this into a repeatable workflow for accelerators and fundraising teams.\n\nWe are raising capital to expand model quality, complete delivery analytics, and scale distribution partnerships. With this raise, we expect to accelerate product maturity and convert early engagement into durable recurring revenue.',
    delivery_metrics: {
      wpm: 140,
      duration_seconds: 120,
      filler_words: [
        { word: 'um', count: 1 },
        { word: 'like', count: 1 },
      ],
      repeated_phrases: [{ phrase: 'our platform', count: 2 }],
      within_time_limit: true,
    },
  },
};
