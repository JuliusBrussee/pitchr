export const TRY_STEPS = [
  'hook',
  'problem',
  'feature-flash',
  'use-case',
  'record',
  'analysis',
  'gated-results',
] as const;

export type TryStep = typeof TRY_STEPS[number];

// Score shown in fake analysis (intentionally mediocre to create urgency)
export const TRY_DEMO_SCORE = 42;
