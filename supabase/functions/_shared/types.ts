// Shared types for Supabase Edge Functions
// These mirror the types from the main app's types/ directory.

export type PitchMode = 'elevator' | 'vc_pitch';
export type InputType = 'audio' | 'text' | 'upload';
export type RunStatus = 'queued' | 'running' | 'complete' | 'failed';
export type PitchStage = 'pre_seed' | 'seed' | 'series_a' | 'series_b';
export type Coverage = 'spoken_only' | 'spoken+deck';
export type ProjectTypeId = 'two_min_pitch' | 'elevator_pitch';

export interface ProjectPromptOverrides {
  analysis_system_prompt?: string;
  [key: string]: unknown;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  targetMarket: string | null;
  keyMetrics: string | null;
  extraNotes: string | null;
  /** @deprecated */
  type?: ProjectTypeId;
  /** @deprecated */
  workflowMode?: PitchMode;
  isArchived: boolean;
  /** @deprecated */
  isSeeded?: boolean;
  promptOverrides: ProjectPromptOverrides;
  createdAt: string;
  updatedAt: string;
}

export interface RunStats {
  totalRuns: number;
  averageScore: number;
  bestScore: number;
  trend: number[];
}

export interface Run {
  id: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  projectId: string;
  projectType?: ProjectTypeId;
  projectName?: string;
  mode: PitchMode;
  status: RunStatus;
  error?: string;
  inputType: InputType;
  transcript: string;
  audioUrl?: string;
  deckId?: string;
  // deno-lint-ignore no-explicit-any
  analysis?: any;
  analysisVersion?: 'v1' | 'v2';
  coverage?: Coverage;
  // deno-lint-ignore no-explicit-any
  outputs?: any;
  // deno-lint-ignore no-explicit-any
  meta?: any;
  qaSessionsSummary?: QASessionSummary[];
  overallScore: number;
  fallback?: boolean;
}

export interface ListPitchRunsResponse {
  runs: Run[];
  stats: RunStats;
}

export interface CreatePitchRunResponse {
  runId: string;
  status: RunStatus;
  projectId?: string;
  projectType?: ProjectTypeId;
  workflowMode?: PitchMode;
  overallScore?: number;
  fallback?: boolean;
  provider_used?: 'openrouter' | 'anthropic' | 'gemini' | 'none';
  warning?: string;
  error?: string;
}

export interface IntegrationHealthResponse {
  runtime: 'supabase-edge';
  analysis: {
    anthropic_ready: boolean;
    gemini_ready: boolean;
  };
  live_qa: {
    enabled: boolean;
    elevenlabs_key_ready: boolean;
    agent_id_ready: boolean;
    ready: boolean;
  };
  warnings: string[];
}

export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  words: TranscriptWord[];
}

// QA types
export type QASessionStatus =
  | 'created'
  | 'active'
  | 'completed'
  | 'expired'
  | 'failed';

export type QATurnSpeaker = 'investor' | 'founder' | 'system';

export interface QATurn {
  id: string;
  speaker: QATurnSpeaker;
  text: string;
  start_sec?: number;
  end_sec?: number;
  latency_ms?: number;
  created_at: string;
}

export interface QASessionEvaluation {
  overall_score?: number;
  strengths: string[];
  improvements: string[];
  notes?: string;
}

export interface QASession {
  id: string;
  runId: string;
  status: QASessionStatus;
  conversationId?: string;
  startedAt: string;
  completedAt?: string;
  durationLimitSeconds: number;
  durationSeconds?: number;
  turns: QATurn[];
  transcript?: string;
  evaluation?: QASessionEvaluation;
  meta?: Record<string, unknown>;
}

export interface QASessionSummary {
  qaSessionId: string;
  status: QASessionStatus;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
}

// Deck types
export interface DeckRecord {
  id: string;
  name: string;
  original_url: string;
  pdf_url: string;
  slide_count: number;
  thumbnail_url: string | null;
  project_id: string;
  created_at: string;
  user_id?: string;
}

export interface SlideRecord {
  id: string;
  deck_id: string;
  slide_num: number;
  text: string;
}

// Miro types
export type MiroFixStatus = 'todo' | 'doing' | 'done' | 'blocked';
export type FixImpact = 'high' | 'medium' | 'low';

export interface MiroTopFixInput {
  rank: number;
  category: string;
  impact: FixImpact;
  issue: string;
  fix: string;
}

export interface MiroFixBoardRequest {
  runId: string;
  mode: PitchMode;
  oneLineVerdict: string;
  rewriteScript: string;
  topFixes: MiroTopFixInput[];
  transcript?: string;
  recreate?: boolean;
}

export interface MiroFixPatchRequest {
  runId: string;
  rank: number;
  patch: {
    status?: MiroFixStatus;
    owner?: string;
    notes?: string;
  };
  clientUpdatedAt: string;
}

// Deck generation types
export type TemplateId =
  | 'minimal-dark'
  | 'corporate-clean'
  | 'bold-gradient'
  | 'startup-fresh';

export interface GenerateDeckRequest {
  companyName: string;
  description: string;
  templateId: TemplateId;
  projectId?: string;
}
