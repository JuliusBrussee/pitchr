/* ——— Mock data for the animated product demo ——— */

export const DEMO_TRANSCRIPT =
  'We are building Ledgr, a fintech platform that automates expense reconciliation for mid-market SaaS companies. ' +
  'Today, finance teams spend an average of fourteen hours per week manually matching invoices to bank transactions, ' +
  'leading to delayed closes and costly errors. Ledgr connects directly to your ERP and banking feeds, ' +
  'uses machine learning to auto-match ninety-two percent of transactions on day one, ' +
  'and flags anomalies before they become audit findings. ' +
  'In six months we have onboarded thirty-eight companies, reached two hundred thousand in ARR, ' +
  'and reduced close time by sixty percent for our customers. ' +
  'We are raising a one-point-five million seed round to expand our integrations and hire our first three enterprise reps.';

export const DEMO_SCORE = 72;

export const DEMO_VERDICT =
  'Clear problem framing and strong structure, but evidence and market differentiation need sharper proof points.';

export const DEMO_RUBRIC = [
  { category: 'structure' as const, score: 16, max_score: 20, rationale: 'Logical flow from problem through solution to ask. Transitions are smooth.' },
  { category: 'clarity' as const, score: 15, max_score: 20, rationale: 'Core message lands clearly, though some phrasing could be tighter.' },
  { category: 'evidence' as const, score: 13, max_score: 20, rationale: 'Good metrics cited but could use named comparisons and growth rates.' },
  { category: 'market' as const, score: 12, max_score: 20, rationale: 'Market opportunity is implied but competitors are not named or differentiated.' },
  { category: 'delivery' as const, score: 16, max_score: 20, rationale: 'Strong pacing with minimal filler. Confident tone throughout.' },
];

export const DEMO_FIXES = [
  {
    rank: 1,
    category: 'evidence',
    issue: 'ARR figure lacks growth context — no prior period comparison.',
    fix: 'Add month-over-month growth rate and customer retention metric.',
    impact: 'high' as const,
  },
  {
    rank: 2,
    category: 'market',
    issue: 'No named competitors or clear differentiation wedge.',
    fix: 'Name top alternative and state your single strongest advantage.',
    impact: 'high' as const,
  },
  {
    rank: 3,
    category: 'structure',
    issue: 'Ask does not tie raise amount to specific milestones.',
    fix: 'Link the $1.5M to 3 concrete 12-month milestones.',
    impact: 'medium' as const,
  },
  {
    rank: 4,
    category: 'clarity',
    issue: 'Opening sentence uses generic startup language.',
    fix: 'Lead with a surprising stat or customer pain quote instead.',
    impact: 'low' as const,
  },
];

export const DEMO_DELIVERY = {
  wpm: 148,
  duration_seconds: 63,
  word_count: 155,
  filler_count: 2,
  filler_words: [
    { word: 'um', count: 1 },
    { word: 'basically', count: 1 },
  ],
  repeated_phrases: [{ phrase: 'we are', count: 2 }],
};

export const DEMO_REWRITE_HUNKS = [
  {
    before: 'We are building Ledgr, a fintech platform that automates expense reconciliation for mid-market SaaS companies.',
    after: 'Finance teams at mid-market SaaS companies waste fourteen hours a week on manual reconciliation — Ledgr eliminates that entirely.',
  },
  {
    before: 'In six months we have onboarded thirty-eight companies, reached two hundred thousand in ARR.',
    after: 'In six months: 38 customers, $200K ARR growing 40% month-over-month, with 95% net retention.',
  },
  {
    before: 'We are raising a one-point-five million seed round to expand our integrations and hire our first three enterprise reps.',
    after: 'We are raising $1.5M to hit $1M ARR in 12 months: 8 new ERP integrations, 3 enterprise reps, and SOC 2 certification.',
  },
];

export const DEMO_CHECKLIST = [
  { label: 'Problem statement', state: 'complete' as const },
  { label: 'Solution overview', state: 'complete' as const },
  { label: 'Key metrics', state: 'partial' as const },
  { label: 'Market size', state: 'uncovered' as const },
  { label: 'Competition', state: 'uncovered' as const },
  { label: 'Business model', state: 'partial' as const },
  { label: 'Team', state: 'uncovered' as const },
  { label: 'The ask', state: 'complete' as const },
];

export const DEMO_RECENT_RUNS = [
  { id: '1', mode: 'vc_pitch' as const, date: 'Mar 7, 2026', score: 72, title: 'Series A Pitch v3' },
  { id: '2', mode: 'elevator' as const, date: 'Mar 5, 2026', score: 65, title: 'Elevator — Investor Day' },
  { id: '3', mode: 'vc_pitch' as const, date: 'Mar 2, 2026', score: 58, title: 'Series A Pitch v2' },
];

export const DEMO_SPARKLINE = [42, 48, 52, 58, 61, 65, 68, 72];

export type ChecklistState = 'complete' | 'partial' | 'uncovered';

/* Step definitions for the camera walkthrough */

export interface DemoStep {
  screen: 'dashboard' | 'session' | 'results' | 'analyzing' | 'cta';
  transform: string;
  duration: number; // ms
  urlText: string;
  label: string;
  subtitle?: string;
}

export const DEMO_STEPS: DemoStep[] = [
  { screen: 'dashboard', transform: 'scale(0.68) translate(0, 0)', duration: 3000, urlText: 'app.pitchr.com/dashboard', label: 'Dashboard Overview', subtitle: 'Your pitch coaching command center' },
  { screen: 'dashboard', transform: 'scale(1.8) translate(-5%, -2%)', duration: 2000, urlText: 'app.pitchr.com/dashboard', label: 'Start a Session', subtitle: 'One click to begin recording' },
  { screen: 'session', transform: 'scale(0.68) translate(0, 0)', duration: 2000, urlText: 'app.pitchr.com/session', label: 'Live Session', subtitle: 'Record or paste your pitch' },
  { screen: 'session', transform: 'scale(1.6) translate(-55%, -15%)', duration: 3000, urlText: 'app.pitchr.com/session', label: 'Real-Time Transcript', subtitle: 'Every word captured and analyzed' },
  { screen: 'session', transform: 'scale(1.6) translate(-55%, -40%)', duration: 2000, urlText: 'app.pitchr.com/session', label: 'Live Checklist', subtitle: 'Track what you have covered' },
  { screen: 'analyzing', transform: 'scale(1.0) translate(0, 0)', duration: 2000, urlText: 'app.pitchr.com/session', label: 'AI Analysis', subtitle: 'Five rubric dimensions scored' },
  { screen: 'results', transform: 'scale(0.68) translate(0, 0)', duration: 2000, urlText: 'app.pitchr.com/results', label: 'Results', subtitle: 'Your complete pitch report' },
  { screen: 'results', transform: 'scale(1.5) translate(-12%, -5%)', duration: 3000, urlText: 'app.pitchr.com/results', label: 'Score Breakdown', subtitle: 'Rubric-based scoring out of 100' },
  { screen: 'results', transform: 'scale(1.4) translate(-12%, -45%)', duration: 3000, urlText: 'app.pitchr.com/results', label: 'Top Fixes', subtitle: 'Ranked by investor impact' },
  { screen: 'results', transform: 'scale(1.4) translate(-12%, -65%)', duration: 3000, urlText: 'app.pitchr.com/results', label: 'Rewrite Diff', subtitle: 'Before and after comparison' },
  { screen: 'results', transform: 'scale(1.4) translate(-50%, -65%)', duration: 2500, urlText: 'app.pitchr.com/results', label: 'Delivery Metrics', subtitle: 'Pacing, fillers, and timing' },
  { screen: 'results', transform: 'scale(0.68) translate(0, 0)', duration: 2000, urlText: 'app.pitchr.com/results', label: 'Full Report', subtitle: 'Everything in one view' },
  { screen: 'cta', transform: 'scale(1.0) translate(0, 0)', duration: 3000, urlText: 'app.pitchr.com', label: 'Ready to Pitch?', subtitle: 'Start coaching your pitch today' },
];
