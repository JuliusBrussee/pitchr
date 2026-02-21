import type { RubricCategory } from '@/types/analysis';

export interface RubricCategoryDef {
  id: RubricCategory;
  label: string;
  weight: number;
  description: string;
  scoringCriteria: string;
}

export interface ScoreBand {
  min: number;
  max: number;
  label: string;
  color: string;
}

export const RUBRIC_CATEGORIES: RubricCategoryDef[] = [
  {
    id: 'structure',
    label: 'Structure',
    weight: 20,
    description:
      'Clear flow with logical transitions and a strong ask at the end.',
    scoringCriteria:
      'Problem -> Solution -> Why Now -> Traction -> Ask. Penalize missing beats or circular flow.',
  },
  {
    id: 'clarity',
    label: 'Clarity & Concision',
    weight: 20,
    description:
      'Direct language, minimal jargon, concise phrasing that is easy to follow.',
    scoringCriteria:
      'Every sentence should earn its place. Penalize jargon and unnecessary qualifiers.',
  },
  {
    id: 'evidence',
    label: 'Evidence & Traction',
    weight: 20,
    description:
      'Concrete numbers, milestones, and proof points that build investor confidence.',
    scoringCriteria:
      'Reward specific metrics (users, revenue, growth, pilots, customers). Penalize vague claims.',
  },
  {
    id: 'market',
    label: 'Market & Differentiation',
    weight: 20,
    description:
      'Clear market sizing, competitor framing, and defensible differentiation.',
    scoringCriteria:
      'Expect TAM/SAM framing, competitors named, and a clear moat or positioning edge.',
  },
  {
    id: 'delivery',
    label: 'Delivery',
    weight: 20,
    description:
      'Appropriate pace, low filler usage, low repetition, and time-limit compliance.',
    scoringCriteria:
      'Use local metrics for pace/fillers/repetition/time-limit adherence.',
  },
];

export const RUBRIC_TOTAL_WEIGHT = 100;

export const SCORE_BANDS: ScoreBand[] = [
  { min: 0, max: 39, label: 'Needs Work', color: '#ef4444' },
  { min: 40, max: 59, label: 'Getting There', color: '#ffaa33' },
  { min: 60, max: 79, label: 'Solid', color: '#3b82f6' },
  { min: 80, max: 100, label: 'Investor-Ready', color: '#22c55e' },
];
