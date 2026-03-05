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
  isArchived: boolean;
  promptOverrides: ProjectPromptOverrides;
  createdAt: string;
  updatedAt: string;
}
