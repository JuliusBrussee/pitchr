export type RubricCategory =
  | 'structure'
  | 'clarity'
  | 'evidence'
  | 'market'
  | 'delivery';

export type DeckRubricCategory =
  | 'deck_narrative'
  | 'deck_clarity'
  | 'deck_evidence'
  | 'deck_design'
  | 'deck_ask';

export type ScoreCategory = RubricCategory | DeckRubricCategory;

export type FixImpact = 'high' | 'medium' | 'low';
export type PitchStage = 'pre_seed' | 'seed' | 'series_a' | 'series_b';
export type Coverage = 'spoken_only' | 'spoken+deck';

export interface RubricScore {
  category: ScoreCategory;
  score: number;
  max_score: number;
  rationale: string;
}

export interface Fix {
  rank: number;
  category: ScoreCategory;
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

export interface SentimentProfile {
  confidence: number;
  urgency: number;
  credibility: number;
  clarity: number;
  investor_readiness: number;
}

export interface AntiPatternHit {
  id: string;
  label: string;
  hit: boolean;
  weight: number;
  evidence: string;
  penalty: number;
}

export interface Citation {
  source_id: string;
  source_url: string;
  source_title: string;
  access_status: 'full' | 'partial' | 'gated';
  snapshot_date: string;
  confidence_score: number;
  excerpt: string;
}

export interface StageExpectation {
  stage: PitchStage;
  expectations: string[];
}

export interface DeliveryMetrics {
  word_count: number;
  duration_seconds: number;
  target_wpm: number;
  wpm: number;
  filler_count: number;
  filler_rate: number;
  disfluency_count: number;
  stutter_rate: number;
  repeated_ngram_tokens: number;
  repeat_rate: number;
  within_time_limit: boolean;
  pace_score_component: number;
  filler_score_component: number;
  stutter_score_component: number;
  repeat_score_component: number;
  time_score_component: number;
  delivery20: number;
  filler_words: FillerWord[];
  repeated_phrases: RepeatedPhrase[];
}

export interface FeedbackOutput {
  overall_score: number;
  one_line_verdict: string;
  rubric_breakdown: RubricScore[];
  top_fixes: Fix[];
  rewrite_script: string;
  delivery_metrics: DeliveryMetrics;
  spoken_score: number;
  deck_score: number | null;
  pre_penalty_overall: number;
  penalty: number;
  sentiment_profile: SentimentProfile;
  anti_pattern_hits: AntiPatternHit[];
  citations: Citation[];
  stage_expectations: StageExpectation[];
  do_next_checklist: string[];
}

export interface OneMinuteQASuggestedAnswer {
  question: string;
  answer: string;
  target_seconds: number;
}

export interface OneMinuteQAPack {
  total_target_seconds: 60;
  timing_plan_seconds: [number, number, number];
  investor_questions: [string, string, string];
  suggested_answers: [
    OneMinuteQASuggestedAnswer,
    OneMinuteQASuggestedAnswer,
    OneMinuteQASuggestedAnswer,
  ];
  focus_tags: string[];
  red_flags_to_avoid: string[];
}

export interface AnalysisMeta {
  provider_used: 'openrouter' | 'anthropic' | 'none';
  fallback_used: boolean;
  cache_hit: boolean;
  llm_calls_used: number;
  latency_ms: number;
  attempt_count: number;
  economics?: RunEconomics;
  error_details?: {
    message: string;
    timeout?: boolean;
    provider_attempts?: Array<{
      provider: 'openrouter' | 'anthropic';
      message: string;
    }>;
  };
}

export interface PaidSyncMeta {
  status: 'sent' | 'skipped' | 'failed';
  sent_at: string;
  error?: string;
}

export interface RunEconomics {
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_cost_usd: number;
  manual_baseline_minutes: number;
  agent_runtime_minutes: number;
  time_saved_minutes: number;
  score_delta_vs_previous_mode_run: number;
  quality_bonus_usd: number;
  estimated_value_usd: number;
  roi_multiple: number;
  gross_margin_usd: number;
  paid_sync?: PaidSyncMeta;
}

export interface AnalysisOutputs {
  feedback: FeedbackOutput;
  qa_1min: OneMinuteQAPack;
}

export interface AnalysisResultV2 {
  analysisVersion: 'v2';
  coverage: Coverage;
  outputs: AnalysisOutputs;
  meta: AnalysisMeta;
  analysis: FeedbackOutput;
  fallback?: boolean;
}

export interface BeatMatch {
  beat:
    | 'one_liner'
    | 'problem'
    | 'mechanism'
    | 'proof'
    | 'differentiation'
    | 'wedge'
    | 'ask';
  evidence: string;
}

export interface PatternSnippet {
  id: string;
  type: 'positive' | 'anti';
  title: string;
  text: string;
  stage: PitchStage | 'all';
  weight: number;
}

export interface ScoringContext {
  mode: 'elevator' | 'vc_pitch';
  stage: PitchStage;
  coverage: Coverage;
  normalized_transcript: string;
  normalized_deck_text: string;
  transcript_word_count: number;
  deck_word_count: number;
  beats: BeatMatch[];
  detected_anti_patterns: AntiPatternHit[];
  delivery_metrics: DeliveryMetrics;
  retrieved_patterns: PatternSnippet[];
  stage_expectations: StageExpectation[];
  benchmark_profiles?: {
    yc_top_decile: string[];
    yc_median: string[];
    common_failures: string[];
  };
  source_weights?: Record<string, number>;
  knowledge_version: string;
  prompt_version: string;
  rubric_version: string;
}
