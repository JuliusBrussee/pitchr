import type { DeckRubricCategory, RubricCategory } from '@/types/analysis-v2';

export interface RubricCategoryDef<TId extends string = string> {
  id: TId;
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

export interface StageExpectationConfig {
  stage: 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'university_hack' | 'corporate_hack' | 'web3_hack' | 'science_hack';
  expectations: string[];
}

export const SPOKEN_RUBRIC_CATEGORIES: RubricCategoryDef<RubricCategory>[] = [
  {
    id: 'structure',
    label: 'Structure',
    weight: 20,
    description:
      'Clear flow with logical transitions and a strong ask at the end.',
    scoringCriteria:
      'Penalize missing beats or circular flow. Beat sequence depends on pitch mode.',
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

export const DECK_RUBRIC_CATEGORIES: RubricCategoryDef<DeckRubricCategory>[] = [
  {
    id: 'deck_narrative',
    label: 'Deck Narrative',
    weight: 20,
    description:
      'Deck progresses with a clear narrative arc from problem to ask.',
    scoringCriteria:
      'Reward coherent flow and slide sequencing. Penalize disjointed story flow.',
  },
  {
    id: 'deck_clarity',
    label: 'Deck Clarity',
    weight: 20,
    description:
      'Slides are concise and readable with clear headlines and message hierarchy.',
    scoringCriteria:
      'Reward concise slides with one key message each. Penalize dense text walls.',
  },
  {
    id: 'deck_evidence',
    label: 'Deck Evidence',
    weight: 20,
    description:
      'Deck includes verifiable proof points, metrics, and supporting references.',
    scoringCriteria:
      'Reward quantified traction, references, and benchmarked claims.',
  },
  {
    id: 'deck_design',
    label: 'Deck Design',
    weight: 20,
    description:
      'Visual system supports credibility through consistency and focus.',
    scoringCriteria:
      'Reward legibility, consistency, and visual prioritization. Penalize clutter.',
  },
  {
    id: 'deck_ask',
    label: 'Deck Ask',
    weight: 20,
    description:
      'Fundraise ask is explicit, specific, and tied to milestones.',
    scoringCriteria:
      'Reward concrete use-of-funds and milestone alignment. Penalize vague ask.',
  },
];

export const STAGE_EXPECTATIONS: StageExpectationConfig[] = [
  {
    stage: 'pre_seed',
    expectations: [
      'Credible founder insight and clear problem ownership.',
      'Sharp wedge and clear ICP over broad platform claims.',
      'Evidence of speed: prototypes, pilots, or early demand signals.',
    ],
  },
  {
    stage: 'seed',
    expectations: [
      'Early repeatability in acquisition or retention.',
      'Cohesive narrative connecting product to measurable traction.',
      'Capital ask tied to explicit 12-18 month milestones.',
    ],
  },
  {
    stage: 'series_a',
    expectations: [
      'Clear growth mechanics with channel efficiency evidence.',
      'Defensible differentiation under competitive pressure.',
      'Mature forecasting and GTM execution plan.',
    ],
  },
  {
    stage: 'series_b',
    expectations: [
      'Scalable operating model with durable unit economics.',
      'Multi-year category strategy and moat articulation.',
      'Clear expansion plan with accountable KPI ownership.',
    ],
  },
  {
    stage: 'university_hack',
    expectations: [
      'Creativity and originality in problem framing.',
      'Learning signal: what the team built and learned.',
      'Team collaboration and role clarity.',
    ],
  },
  {
    stage: 'corporate_hack',
    expectations: [
      'Sponsor challenge alignment and enterprise feasibility.',
      'Polish and production readiness of the demo.',
      'Clear business value proposition.',
    ],
  },
  {
    stage: 'web3_hack',
    expectations: [
      'On-chain demo or protocol integration shown.',
      'Practicality and UX quality of the dApp.',
      'Novel use of blockchain technology.',
    ],
  },
  {
    stage: 'science_hack',
    expectations: [
      'Scientific rigor and methodology clarity.',
      'Impact measurement and real-world applicability.',
      'Completeness of implementation and data pipeline.',
    ],
  },
];

export const RUBRIC_CATEGORIES = SPOKEN_RUBRIC_CATEGORIES;
export const RUBRIC_TOTAL_WEIGHT = 100;

export const SCORE_BANDS: ScoreBand[] = [
  { min: 0, max: 39, label: 'Needs Work', color: '#ef4444' },
  { min: 40, max: 59, label: 'Getting There', color: '#ffaa33' },
  { min: 60, max: 79, label: 'Solid', color: '#3b82f6' },
  { min: 80, max: 100, label: 'Investor-Ready', color: '#22c55e' },
];

