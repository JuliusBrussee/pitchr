export type RubricCategory =
  | 'structure'
  | 'clarity'
  | 'evidence'
  | 'market'
  | 'delivery';

export interface RubricScore {
  category: RubricCategory;
  score: number;
  max_score: number;
  rationale: string;
}

export type FixImpact = 'high' | 'medium' | 'low';

export interface Fix {
  rank: number;
  category: RubricCategory;
  issue: string;
  fix: string;
  impact: FixImpact;
}

export interface FillerWord {
  word: string;
  count: number;
}

export interface RepeatedPhrase {
  phrase: string;
  count: number;
}

export interface DeliveryMetrics {
  wpm: number;
  duration_seconds: number;
  filler_words: FillerWord[];
  repeated_phrases: RepeatedPhrase[];
  within_time_limit: boolean;
}

export interface AnalysisResult {
  overall_score: number;
  one_line_verdict: string;
  rubric_breakdown: RubricScore[];
  top_fixes: Fix[];
  rewrite_script: string;
  delivery_metrics: DeliveryMetrics;
}
