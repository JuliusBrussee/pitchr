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

export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  words: TranscriptWord[];
}

export type DeliveryEventType =
  | 'filler'
  | 'stutter'
  | 'hesitation'
  | 'repetition'
  | 'vocab';

export interface DeliveryEvent {
  id: string;
  type: DeliveryEventType;
  start_sec: number;
  end_sec: number;
  label: string;
  evidence: string;
  severity: 'low' | 'medium' | 'high';
  count?: number;
}

export interface VocabularyTermStat {
  term: string;
  count: number;
}

export interface VocabularyMetrics {
  total_words: number;
  unique_words: number;
  lexical_diversity: number;
  hedge_density: number;
  jargon_density: number;
  softener_density: number;
  hedge_terms: VocabularyTermStat[];
  jargon_terms: VocabularyTermStat[];
  softener_terms: VocabularyTermStat[];
}

export type SectionBeat =
  | 'intro'
  | 'problem'
  | 'solution'
  | 'market'
  | 'model'
  | 'traction'
  | 'team'
  | 'ask';

export interface DeckSlideLink {
  slide_num: number;
  confidence: number;
  matched_terms: string[];
  snippet?: string;
}

export interface SectionFeedback {
  beat: SectionBeat;
  start_sec: number;
  end_sec: number;
  good: string;
  bad: string;
  evidence: string;
  top_issues: string[];
  top_fixes: string[];
  slide_links?: DeckSlideLink[];
  confidence?: number;
}

export type RewriteDiffTokenKind = 'context' | 'add' | 'remove';

export type RewriteDiffGrammarTag =
  | 'punctuation'
  | 'article'
  | 'tense'
  | 'agreement'
  | 'word_choice'
  | 'other';

export interface RewriteDiffToken {
  kind: RewriteDiffTokenKind;
  value: string;
  grammar_tag?: RewriteDiffGrammarTag;
}

export interface RewriteDiffHunk {
  id: string;
  original_text: string;
  rewrite_text: string;
  tokens: RewriteDiffToken[];
  summary?: string;
}

export interface RewriteDiff {
  hunks: RewriteDiffHunk[];
  stats: {
    added: number;
    removed: number;
    changed: number;
  };
  alignment_score: number;
}

export interface HistoricalScoreDelta {
  category: ScoreCategory | 'overall';
  previous: number;
  current: number;
  delta: number;
}

export interface HistoricalLink {
  run_id: string;
  created_at: string;
  mode: 'elevator' | 'vc_pitch';
  overall_delta: number;
  score_deltas: HistoricalScoreDelta[];
  summary: string;
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
  events?: DeliveryEvent[];
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
  summary_good?: string;
  summary_bad?: string;
  section_feedback?: SectionFeedback[];
  rewrite_diff?: RewriteDiff;
  vocabulary_metrics?: VocabularyMetrics;
  historical_links?: HistoricalLink[];
  advanced_reasoning?: {
    score_logic: string[];
    strongest_signals: string[];
    weakest_signals: string[];
    confidence: number;
  };
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
  telemetry?: {
    sectioning_confidence?: number;
    deck_link_confidence?: number;
    qa_latency_ms_p50?: number;
    qa_cap_compliant?: boolean;
  };
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
  model_cost_usd: number;
  platform_overhead_usd: number;
  cost_floor_usd: number;
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_cost_usd: number;
  coach_hourly_rate_usd: number;
  savings_realization_rate: number;
  manual_baseline_minutes: number;
  agent_runtime_minutes: number;
  time_saved_minutes: number;
  money_saved_vs_coach_usd: number;
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
  deck_id?: string;
  normalized_transcript: string;
  normalized_deck_text: string;
  transcript_word_count: number;
  deck_word_count: number;
  transcript_segments?: TranscriptSegment[];
  beats: BeatMatch[];
  detected_anti_patterns: AntiPatternHit[];
  delivery_metrics: DeliveryMetrics;
  delivery_events?: DeliveryEvent[];
  vocabulary_metrics?: VocabularyMetrics;
  section_feedback?: SectionFeedback[];
  rewrite_diff?: RewriteDiff;
  historical_links?: HistoricalLink[];
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
