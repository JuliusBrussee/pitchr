import type { AnalysisResult } from '@/types/analysis';

export type PitchMode = 'elevator' | 'vc_pitch';
export type InputType = 'audio' | 'text';

export interface Run {
  id: string;
  createdAt: string;
  mode: PitchMode;
  inputType: InputType;
  transcript: string;
  audioUrl?: string;
  analysis: AnalysisResult;
  overallScore: number;
  fallback?: boolean;
}

export interface CreatePitchRunRequest {
  mode: PitchMode;
  transcript: string;
  inputType: InputType;
  audioUrl?: string;
}

export interface CreatePitchRunResponse {
  runId: string;
  status: 'complete';
  analysis: AnalysisResult;
  fallback?: boolean;
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
