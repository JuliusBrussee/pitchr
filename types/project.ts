import type { PitchMode } from '@/types/pitch';

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
  /** @deprecated Projects no longer have an inherent type. */
  type?: ProjectTypeId;
  /** @deprecated Mode is now chosen in pre-session flow. */
  workflowMode?: PitchMode;
  isArchived: boolean;
  /** @deprecated No more seed projects. */
  isSeeded?: boolean;
  promptOverrides: ProjectPromptOverrides;
  createdAt: string;
  updatedAt: string;
}
