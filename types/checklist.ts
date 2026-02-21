import type { PitchMode } from '@/types/pitch';

export type ChecklistItemId =
  | 'intro_hook'
  | 'problem_statement'
  | 'solution_overview'
  | 'market_opportunity'
  | 'business_model'
  | 'traction_metrics'
  | 'team'
  | 'ask';

export type ChecklistStatus = 'uncovered' | 'partial' | 'completed';

export type ChecklistUpdateSource = 'openrouter' | 'heuristic';

export interface ChecklistDefinition {
  id: ChecklistItemId;
  label: string;
  description: string;
  order: number;
  requiredModes: PitchMode[];
  cuePatterns: string[];
  semanticHints: string[];
}

export interface RealtimeChecklistItemState {
  id: ChecklistItemId;
  label: string;
  status: ChecklistStatus;
  confidence: number;
  evidence: string;
  required: boolean;
  lastUpdatedAt: string;
}

export interface RealtimeChecklistProgress {
  completed: number;
  total: number;
}

export interface RealtimeChecklistUpdateMessage {
  type: 'checklist_update';
  mode: PitchMode;
  source: ChecklistUpdateSource;
  items: RealtimeChecklistItemState[];
  progress: RealtimeChecklistProgress;
  nextHint: string | null;
  updatedAt: string;
}

export interface RealtimeChecklistErrorMessage {
  type: 'checklist_error';
  error: string;
}
