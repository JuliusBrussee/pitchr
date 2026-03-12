export interface ProjectPromptOverrideMetadata {
  updated_at?: string;
  updated_by?: string;
}

export interface RubricPolicyCapRule {
  id: string;
  scope: 'all' | 'category';
  category?: string;
  required_term: string;
  max_score: number;
  evidence: string;
}

export interface RubricPolicy {
  version: 'v1';
  source_hash: string;
  source_chars: number;
  required_terms: string[];
  hard_caps: RubricPolicyCapRule[];
  parse_warnings: string[];
}

export interface ProjectPromptOverrides {
  analysis_system_prompt?: string;
  analysis_system_prompt_meta?: ProjectPromptOverrideMetadata;
  analysis_system_prompt_policy?: RubricPolicy;
  [key: string]: unknown;
}

export type PitchModeProject = 'elevator' | 'vc_pitch' | 'hackathon' | 'final_year';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  targetMarket: string | null;
  keyMetrics: string | null;
  extraNotes: string | null;
  isArchived: boolean;
  defaultMode: PitchModeProject | null;
  promptOverrides: ProjectPromptOverrides;
  createdAt: string;
  updatedAt: string;
}
