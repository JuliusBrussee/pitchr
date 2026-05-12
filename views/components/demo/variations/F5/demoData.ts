/* ——— Variation F5: Split-Screen Proof Mode — demoData ——— */

export {
  DEMO_TRANSCRIPT,
  DEMO_SCORE,
  DEMO_VERDICT,
  DEMO_RUBRIC,
  DEMO_FIXES,
  DEMO_DELIVERY,
  DEMO_REWRITE_HUNKS,
  DEMO_CHECKLIST,
  DEMO_RECENT_RUNS,
  DEMO_SPARKLINE,
  DEMO_COACH_SUMMARY,
  DEMO_RUBRIC_CATEGORIES,
  DEMO_INSIGHTS,
  DEMO_RECOMMENDATIONS,
  DEMO_QA_TURNS,
} from '@/views/components/demo/demoData';

export type { ChecklistState } from '@/views/components/demo/demoData';

import { DEMO_STEPS as BASE_STEPS } from '@/views/components/demo/demoData';
import type { DemoStep as BaseDemoStep } from '@/views/components/demo/demoData';

/* ——— Proof card types ——— */

export interface MetricCard {
  type: 'metric';
  value: string;
  label: string;
}

export interface QuoteCard {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface RubricCard {
  type: 'rubric';
  bars: { label: string; score: number; maxScore: number }[];
}

export interface StatRowCard {
  type: 'statrow';
  stats: { icon?: string; value: string; label: string }[];
}

export type ProofCard = MetricCard | QuoteCard | RubricCard | StatRowCard;

export interface ProofPanel {
  header: string;
  cards: ProofCard[];
}

export interface DemoStep extends BaseDemoStep {
  caption?: string;
  proofPanel?: ProofPanel;
}

/* ——— Captions (same as Variation F) ——— */

const CAPTIONS: (string | undefined)[] = [
  'Most founders walk into investor meetings *unprepared*.',       // 0
  'One click to change that.',                                      // 1
  'Record your pitch. *Pitchr* listens.',                           // 2
  'Every word transcribed in *real-time*.',                         // 3
  'Coverage tracked as you speak.',                                 // 4
  'Done. Now the *AI* takes over.',                                 // 5
  'Scored across *five* rubric dimensions.',                        // 6
  'Your *results* are in.',                                         // 7
  '*Know* exactly where to improve.',                               // 8
  'Fixes ranked by what *investors* care about most.',              // 9
  'Your exact words, rewritten *sharper*.',                         // 10
  'But the pitch is only half the *battle*.',                       // 11
  'AI investors that *drill* you before real ones do.',             // 12
  'Face the *tough* questions.',                                    // 13
  'Burn rate. Retention. Competitive moat. The *real* questions.',  // 14
  'Practice until you\u2019re *ready*.',                            // 15
  'Stop guessing. *Know*. Try *Pitchr* free.',                     // 16
];

/* ——— Proof panel definitions per step ——— */

const PROOF_PANELS: (ProofPanel | undefined)[] = [
  undefined, // 0
  undefined, // 1
  undefined, // 2
  undefined, // 3
  undefined, // 4
  undefined, // 5
  undefined, // 6

  // Step 7 — Results appear
  {
    header: 'The Numbers',
    cards: [
      { type: 'metric', value: '72/100', label: 'Pitch Score' },
      {
        type: 'rubric',
        bars: [
          { label: 'Structure', score: 16, maxScore: 20 },
          { label: 'Clarity', score: 15, maxScore: 20 },
          { label: 'Evidence', score: 13, maxScore: 20 },
          { label: 'Market', score: 12, maxScore: 20 },
          { label: 'Delivery', score: 16, maxScore: 20 },
        ],
      },
    ],
  },

  // Step 8 — Score Breakdown
  {
    header: 'The Numbers',
    cards: [
      {
        type: 'rubric',
        bars: [
          { label: 'Structure', score: 16, maxScore: 20 },
          { label: 'Clarity', score: 15, maxScore: 20 },
          { label: 'Evidence', score: 13, maxScore: 20 },
          { label: 'Market', score: 12, maxScore: 20 },
          { label: 'Delivery', score: 16, maxScore: 20 },
        ],
      },
    ],
  },

  // Step 9 — Top Fixes
  {
    header: 'Why Pitchr',
    cards: [
      {
        type: 'statrow',
        stats: [
          { icon: '\u{1F527}', value: '4', label: 'fixes ranked' },
          { icon: '\u26A1', value: '< 60s', label: 'analysis' },
        ],
      },
      {
        type: 'quote',
        text: 'Know exactly what to fix \u2014 ranked by what investors care about most.',
      },
    ],
  },

  // Step 10 — Rewrite
  {
    header: 'Why Pitchr',
    cards: [
      {
        type: 'quote',
        text: 'Finance teams waste 14 hours a week \u2014 Ledgr eliminates that.',
        attribution: 'Rewritten pitch opening',
      },
    ],
  },

  undefined, // 11
  undefined, // 12
  undefined, // 13

  // Step 14 — Live Q&A
  {
    header: 'The Numbers',
    cards: [
      {
        type: 'statrow',
        stats: [
          { icon: '\u{1F4AC}', value: '6', label: 'investor questions' },
          { icon: '\u23F1', value: '1 min', label: 'session' },
        ],
      },
      { type: 'metric', value: '95%', label: 'Retention Rate' },
    ],
  },

  // Step 15 — Session Complete
  {
    header: 'Why Pitchr',
    cards: [
      { type: 'metric', value: '3-day', label: 'Practice Streak' },
      {
        type: 'quote',
        text: 'Practice makes perfect \u2014 every session sharpens your edge.',
      },
    ],
  },

  // Step 16 — CTA
  {
    header: 'The Numbers',
    cards: [
      { type: 'metric', value: '72/100', label: 'Pitch Score' },
      { type: 'metric', value: '4 fixes', label: 'Ranked by Impact' },
      { type: 'metric', value: '< 60s', label: 'Full Analysis' },
    ],
  },
];

/* ——— Build final steps ——— */

export const DEMO_STEPS: DemoStep[] = BASE_STEPS.map((s, i) => ({
  ...s,
  caption: CAPTIONS[i],
  proofPanel: PROOF_PANELS[i],
}));
