import type { PitchMode } from '@/types/pitch';

export type ProjectTypeId = 'two_min_pitch' | 'elevator_pitch';

export interface ProjectPromptOverrides {
  analysis_system_prompt?: string;
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

