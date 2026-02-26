export const ONBOARDING_STEPS = [
  'hook',
  'problem',
  'session-demo',
  'realtime-intel',
  'rubric',
  'scoring-demo',
  'rewrite-demo',
  'personalization',
] as const;

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

// Bad pitch used in scoring demo (Screen 6) and rewrite demo (Screen 7)
export const DEMO_BAD_PITCH = `We're building a platform that helps companies do better. Our solution leverages AI and machine learning to optimize workflows. We think the market is really big and we have some traction. We're looking to raise some money to grow faster.`;

// AI-rewritten version for Screen 7
export const DEMO_REWRITTEN_PITCH = `We're building Pitchr, an AI pitch coach that scores your fundraising pitch in under 30 seconds. Today, founders practice alone with no structured feedback -- 73% walk into investor meetings with fixable weaknesses they never caught. Pitchr identifies exactly what to fix, rewrites your weak lines, and tracks improvement over time. We've onboarded 240 founders in 8 weeks with 62% weekly retention. The pitch coaching market is $2.1B and growing 18% annually -- we're the only tool that scores and rewrites in real-time. We're raising $1.5M to hire 3 engineers and launch our deck analysis feature by Q3.`;

// Predetermined scores for the demo (Screen 6)
export const DEMO_SCORES = {
  overall: 34,
  verdict: 'Vague claims, no numbers, no differentiation. An investor stops listening after sentence two.',
  rubric: [
    { category: 'structure', label: 'Structure', score: 8, maxScore: 20 },
    { category: 'clarity', label: 'Clarity', score: 7, maxScore: 20 },
    { category: 'evidence', label: 'Evidence', score: 5, maxScore: 20 },
    { category: 'market', label: 'Market', score: 6, maxScore: 20 },
    { category: 'delivery', label: 'Delivery', score: 8, maxScore: 20 },
  ],
};

// Rewrite demo scores (Screen 7)
export const DEMO_REWRITE_SCORE = 81;

// Weak phrases to highlight in the bad pitch (red)
export const DEMO_BAD_HIGHLIGHTS = [
  'helps companies do better',
  'leverages AI and machine learning',
  'optimize workflows',
  'really big',
  'some traction',
  'some money',
  'grow faster',
];

// Strong phrases to highlight in the rewrite (green)
export const DEMO_GOOD_HIGHLIGHTS = [
  'scores your fundraising pitch in under 30 seconds',
  '73% walk into investor meetings with fixable weaknesses',
  '240 founders in 8 weeks',
  '62% weekly retention',
  '$2.1B and growing 18% annually',
  'raising $1.5M',
  'launch our deck analysis feature by Q3',
];

// Rubric explorer content (Screen 5)
export const RUBRIC_EXPLORER = [
  {
    id: 'structure',
    label: 'Structure',
    weight: 20,
    description: 'Problem -> Solution -> Why Now -> Traction -> Ask',
    good: 'Clear arc that builds urgency and ends with a specific ask.',
    bad: 'Jumps between topics with no logical flow.',
  },
  {
    id: 'clarity',
    label: 'Clarity',
    weight: 20,
    description: 'Every sentence earns its place',
    good: 'Concrete language, no jargon, each line advances the pitch.',
    bad: 'Buzzwords, filler phrases, vague claims.',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    weight: 20,
    description: 'Specific numbers, named customers',
    good: '"240 founders in 8 weeks with 62% retention."',
    bad: '"We have strong traction and growing demand."',
  },
  {
    id: 'market',
    label: 'Market',
    weight: 20,
    description: 'TAM sourced, competitors named, moat clear',
    good: '"$2.1B market growing 18% -- only real-time scoring tool."',
    bad: '"The market is huge and we have no real competitors."',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    weight: 20,
    description: '130-160 WPM, <3% filler words',
    good: 'Confident pace, clean delivery, no "um" or "like."',
    bad: 'Rushing at 200 WPM with "um" every other sentence.',
  },
];

// Coach toast messages shown after onboarding on first visit per page.
export const COACH_TOASTS: Record<string, string> = {
  dashboard: 'This is home base. Your scores, trends, and next moves all live here.',
  session: "Pick your mode, hit record, and let it rip. The AI's listening.",
  'session-from-try': "That was practice. Now let's get your real score with real feedback.",
  results: 'Scroll down. The fixes are ranked, and the top one has the biggest impact.',
  history: "Every pitch you've run lives here. Track your progress over time.",
  analytics: 'Use the range selector to spot trend lines and identify weak categories early.',
  deck: 'Upload your deck and practice slide-by-slide. The AI reads along.',
  progress: 'Your score timeline over time. Keep this line moving up.',
  settings: 'Replay onboarding or reset tours and tips any time from here.',
};
