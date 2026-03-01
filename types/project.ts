import type { PitchMode } from '@/types/pitch';

export type ProjectTypeId = 'two_min_pitch' | 'elevator_pitch';

export type AnalysisPromptMode = 'auto' | 'custom';

export interface ProjectPromptOverrides {
  analysis_system_prompt?: string;
  analysis_prompt_mode?: AnalysisPromptMode;
  analysis_prompt_template_version?: string;
  analysis_prompt_generated_at?: string;
  project_context_notes?: string;
  perfect_pitch_criteria?: string[];
  [key: string]: unknown;
}

export type DocumentSourceType = 'word_doc' | 'plain_text';
export type DocumentStatus = 'processing' | 'ready' | 'failed';

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  sourceType: DocumentSourceType;
  status: DocumentStatus;
  errorMessage: string | null;
  fileUrl: string | null;
  fileSizeBytes: number | null;
  isDefaultContext: boolean;
  blockCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectTypeId;
  workflowMode: PitchMode;
  isArchived: boolean;
  isSeeded: boolean;
  promptOverrides: ProjectPromptOverrides;
  createdAt: string;
  updatedAt: string;
}

