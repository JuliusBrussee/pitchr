import type {
  AnalysisMeta,
  AnalysisOutputs,
  Coverage,
  PitchStage,
  TranscriptSegment,
} from '@/types/analysis-v2';
import type { AnalysisResult } from '@/types/analysis';
import type { QASessionSummary } from '@/types/qna';

export type PitchMode = 'elevator' | 'vc_pitch';
export type InputType = 'audio' | 'text';
export type RunStatus = 'queued' | 'running' | 'complete' | 'failed';

export interface Run {
  id: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  mode: PitchMode;
  status: RunStatus;
  error?: string;
  inputType: InputType;
  transcript: string;
  audioUrl?: string;
  deckId?: string;
  deckText?: string;
  stage?: PitchStage;
  analysis?: AnalysisResult;
  analysisVersion?: 'v1' | 'v2';
  coverage?: Coverage;
  outputs?: AnalysisOutputs;
  meta?: AnalysisMeta;
  qaSessionsSummary?: QASessionSummary[];
  overallScore: number;
  fallback?: boolean;
}

export interface CreatePitchRunRequest {
  mode: PitchMode;
  transcript: string;
  inputType: InputType;
  audioUrl?: string;
  deckId?: string;
  deckText?: string;
  transcriptSegments?: TranscriptSegment[];
  stage?: PitchStage;
  regenerate?: 'feedback' | 'qa_1min';
}

export interface CreatePitchRunResponse {
  runId: string;
  status: RunStatus;
  analysisVersion?: 'v2';
  coverage?: Coverage;
  outputs?: AnalysisOutputs;
  meta?: AnalysisMeta;
  analysis?: AnalysisResult;
  fallback?: boolean;
  provider_used?: AnalysisMeta['provider_used'];
  warning?: string;
  error?: string;
}

export interface CreatePitchRunErrorResponse {
  error: string;
  fallback?: boolean;
  analysis?: AnalysisResult;
}

export interface RunStats {
  totalRuns: number;
  averageScore: number;
  bestScore: number;
  trend: number[];
}

export interface ListPitchRunsResponse {
  runs: Run[];
  stats: RunStats;
}
