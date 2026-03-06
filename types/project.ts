import type { PitchMode } from '@/types/pitch';

export type ProjectTypeId = 'two_min_pitch' | 'elevator_pitch';

export interface ProjectPromptOverrideMetadata {
  updated_at?: string;
  updated_by?: string;
}

export interface ProjectPromptOverrides {
  analysis_system_prompt?: string;
  analysis_system_prompt_meta?: ProjectPromptOverrideMetadata;
  [key: string]: unknown;
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
