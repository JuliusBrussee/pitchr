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
  { id: '1', mode: 'vc_pitch' as const, date: 'Mar 7, 2026', score: 72, title: 'Series A Pitch v3', duration: '1:03', verdict: 'Solid' },
  { id: '2', mode: 'elevator' as const, date: 'Mar 5, 2026', score: 65, title: 'Elevator — Investor Day', duration: '0:47', verdict: 'Solid' },
  { id: '3', mode: 'vc_pitch' as const, date: 'Mar 2, 2026', score: 58, title: 'Series A Pitch v2', duration: '1:12', verdict: 'Getting There' },
];

export const DEMO_SPARKLINE = [42, 48, 52, 58, 61, 65, 68, 72];

export type ChecklistState = 'complete' | 'partial' | 'uncovered';

/* ——— Dashboard enrichment data ——— */

export const DEMO_COACH_SUMMARY = {
  headline: 'Your pitch structure is strong — sharpen your evidence next.',
  detail: 'Your last session scored 72/100 with solid structure and delivery. The biggest opportunity is adding concrete growth metrics and naming competitors.',
  recommendation: 'Try a 60-second elevator pitch focused on your traction numbers.',
};

export const DEMO_RUBRIC_CATEGORIES = [
  { category: 'Structure', color: '#ff5941', score: 16, maxScore: 20 },
  { category: 'Clarity', color: '#ffaa33', score: 15, maxScore: 20 },
  { category: 'Evidence', color: '#22c55e', score: 13, maxScore: 20 },
  { category: 'Market', color: '#f97316', score: 12, maxScore: 20 },
  { category: 'Delivery', color: '#ef4444', score: 16, maxScore: 20 },
];

export const DEMO_INSIGHTS = [
  { type: 'strength' as const, text: 'Clear problem-solution narrative with smooth transitions' },
  { type: 'weakness' as const, text: 'Market size and competitive landscape not addressed' },
];

export const DEMO_RECOMMENDATIONS = [
  { text: 'Add MoM growth rate to your traction slide', category: 'Evidence' },
  { text: 'Name your top competitor and differentiation', category: 'Market' },
];

/* ——— Q&A mock data ——— */

export const DEMO_QA_TURNS = [
  { speaker: 'investor' as const, text: 'What is your current monthly burn rate and how long does your runway extend?' },
  { speaker: 'founder' as const, text: 'We are burning about $45K per month with 14 months of runway remaining from our pre-seed.' },
  { speaker: 'investor' as const, text: 'You mentioned 92% auto-match accuracy — what happens with the remaining 8%?' },
  { speaker: 'founder' as const, text: 'The remaining 8% gets flagged for manual review with suggested matches, cutting review time by 80%.' },
  { speaker: 'investor' as const, text: 'Your 38 customers in 6 months is impressive. What does retention look like?' },
  { speaker: 'founder' as const, text: 'Net retention is 95% with zero voluntary churn — the 5% is from two customers that were acquired.' },
];

/* ——— Step definitions for the camera walkthrough ——— */

export interface DemoStep {
  screen: 'dashboard' | 'session' | 'results' | 'analyzing' | 'cta' | 'qa';
  transform: string;
  duration: number; // ms
  urlText: string;
  label: string;
  subtitle?: string;
  cursor?: {
    x: number;       // target px within 1440x900 stage
    y: number;
    clickAt?: number; // ms delay before click animation
  };
  qaPhase?: 'gate' | 'connecting' | 'active' | 'complete';
  qaVisibleTurns?: number;
  scrollTo?: string; // CSS selector to scroll into view within .demo-main
}

/*
 * Transform coordinate reference (1440×900 stage, transform-origin: top left):
 *   scale(S) translate(tx%, ty%) → visible region:
 *     x: [-tx%*1440/100, -tx%*1440/100 + 1440/S]
 *     y: [-ty%*900/100, -ty%*900/100 + 900/S]
 *
 * Layout landmarks:
 *   Sidebar: x=12..232 | Main panel: x=244..1428
 *   Dashboard header: y≈40..85 | Coach card: y≈115..195 | Stats: y≈215..430
 *   Session right panel (transcript/checklist): x≈1088..1412
 *   Results header: y≈12..45 | Score hero: y≈70..210 | Fixes: y≈375..655
 */
export const DEMO_STEPS: DemoStep[] = [
  // ── Dashboard ──
  {
    screen: 'dashboard', transform: 'translate(0, 0)', duration: 4500,
    urlText: 'app.pitchr.com/dashboard', label: 'Dashboard Overview',
    subtitle: 'Your pitch coaching command center',
  },
  {
    // Zoom OUT so the full dashboard is visible with room to breathe — cursor clicks Start Session
    screen: 'dashboard', transform: 'scale(0.9) translate(5.5%, 5.5%)', duration: 2400,
    urlText: 'app.pitchr.com/dashboard', label: 'Start a Session',
    subtitle: 'One click to begin recording',
    cursor: { x: 1300, y: 55, clickAt: 1400 },
  },

  // ── Session ──
  {
    screen: 'session', transform: 'translate(0, 0)', duration: 3000,
    urlText: 'app.pitchr.com/session', label: 'Live Session',
    subtitle: 'Record or paste your pitch',
  },
  {
    // Zoom right panel — shows x=[504,1464] y=[18,618]
    screen: 'session', transform: 'scale(1.5) translate(-35%, -2%)', duration: 4000,
    urlText: 'app.pitchr.com/session', label: 'Real-Time Transcript',
    subtitle: 'Every word captured and analyzed',
  },
  {
    // Pan down right panel — shows x=[504,1464] y=[198,798]
    screen: 'session', transform: 'scale(1.5) translate(-35%, -22%)', duration: 3000,
    urlText: 'app.pitchr.com/session', label: 'Live Checklist',
    subtitle: 'Track what you have covered',
  },
  {
    // Pull back to full session view before analysis — dramatic zoom-out
    screen: 'session', transform: 'scale(0.88) translate(7%, 7%)', duration: 1800,
    urlText: 'app.pitchr.com/session', label: 'Session Complete',
    subtitle: 'Submitting for analysis',
  },

  // ── Analyzing ──
  {
    screen: 'analyzing', transform: 'translate(0, 0)', duration: 3000,
    urlText: 'app.pitchr.com/session', label: 'AI Analysis',
    subtitle: 'Five rubric dimensions scored',
  },

  // ── Results ──
  {
    screen: 'results', transform: 'translate(0, 0)', duration: 3000,
    urlText: 'app.pitchr.com/results', label: 'Results',
    subtitle: 'Your complete pitch report',
  },
  {
    // Score hero area — shows x=[216,1245] y=[9,652]
    screen: 'results', transform: 'scale(1.4) translate(-15%, -1%)', duration: 4000,
    urlText: 'app.pitchr.com/results', label: 'Score Breakdown',
    subtitle: 'Rubric-based scoring out of 100',
  },
  {
    // Pan down to fixes — shows x=[216,1245] y=[234,877]
    screen: 'results', transform: 'scale(1.4) translate(-15%, -26%)', duration: 4000,
    urlText: 'app.pitchr.com/results', label: 'Top Fixes',
    subtitle: 'Ranked by investor impact',
    scrollTo: '.demo-fixes',
  },
  {
    // Bottom of visible results — shows x=[187,1295] y=[315,900]
    screen: 'results', transform: 'scale(1.3) translate(-13%, -35%)', duration: 4500,
    urlText: 'app.pitchr.com/results', label: 'Rewrite Comparison',
    subtitle: 'Before and after, side by side',
    scrollTo: '.demo-rewrite',
  },
  {
    // Zoom OUT so the full results page is visible — cursor clicks Start Live Q&A
    screen: 'results', transform: 'scale(0.9) translate(5.5%, 5.5%)', duration: 2600,
    urlText: 'app.pitchr.com/results', label: 'Start Live Q&A',
    subtitle: 'Practice investor questions',
    cursor: { x: 1350, y: 25, clickAt: 1600 },
  },

  // ── Q&A ──
  {
    screen: 'qa', transform: 'translate(0, 0)', duration: 3500,
    urlText: 'app.pitchr.com/qa', label: 'Investor Q&A',
    subtitle: 'Simulate tough investor questions',
    qaPhase: 'gate', cursor: { x: 720, y: 550, clickAt: 2500 },
  },
  {
    screen: 'qa', transform: 'translate(0, 0)', duration: 2500,
    urlText: 'app.pitchr.com/qa', label: 'Connecting...',
    subtitle: 'Preparing your investor session',
    qaPhase: 'connecting',
  },
  {
    screen: 'qa', transform: 'translate(0, 0)', duration: 18000,
    urlText: 'app.pitchr.com/qa', label: 'Live Q&A Session',
    subtitle: 'Real-time investor dialogue',
    qaPhase: 'active', qaVisibleTurns: 6,
  },
  {
    screen: 'qa', transform: 'translate(0, 0)', duration: 3500,
    urlText: 'app.pitchr.com/qa', label: 'Session Complete',
    subtitle: 'Review your Q&A performance',
    qaPhase: 'complete',
  },

  // ── CTA ──
  {
    screen: 'cta', transform: 'translate(0, 0)', duration: 4000,
    urlText: 'app.pitchr.com', label: 'Ready to Pitch?',
    subtitle: 'Start coaching your pitch today',
  },
];
