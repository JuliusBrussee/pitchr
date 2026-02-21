import type { DeckRubricCategory, RubricCategory } from '@/types/analysis-v2';

type ScoreCategory = RubricCategory | DeckRubricCategory;

export interface HardGateCap {
  antiPatternLabel: string;
  category: ScoreCategory;
  capScore: number;
  rationale: string;
}

export const YC_STRICTNESS_POLICY = {
  benchmark: 'yc_top_decile',
  scoreBandHint:
    '80+ should be rare and reserved for top-decile investor-ready quality.',
} as const;

export const HARD_GATE_CAPS: HardGateCap[] = [
  {
    antiPatternLabel: 'no_proof',
    category: 'evidence',
    capScore: 8,
    rationale: 'Evidence score capped due to missing concrete proof points.',
  },
  {
    antiPatternLabel: 'no_ask',
    category: 'structure',
    capScore: 12,
    rationale: 'Structure score capped because explicit fundraising ask is missing.',
  },
  {
    antiPatternLabel: 'no_ask',
    category: 'deck_ask',
    capScore: 8,
    rationale: 'Deck ask score capped because explicit ask/use-of-funds is missing.',
  },
  {
    antiPatternLabel: 'tam_only',
    category: 'market',
    capScore: 10,
    rationale: 'Market score capped because TAM framing lacks execution proof.',
  },
];
