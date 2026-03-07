import type { PitchMode } from '@/types/pitch';

export interface ProjectTypeDefinition {
  id: string;
  label: string;
  workflowMode: PitchMode;
  description: string;
}

/**
 * Source of truth for project types used by rubric matrix runner generation.
 * Add new project types here to automatically scaffold terminal runner scripts
 * and update docs/rubric-matrix-runners.md via sync:rubric-matrix-runners.
 */
export const PROJECT_TYPE_DEFINITIONS: ProjectTypeDefinition[] = [
  {
    id: 'two_min_pitch',
    label: 'Two-Minute Pitch',
    workflowMode: 'vc_pitch',
    description: 'Standard VC-style two-minute pitch evaluation.',
  },
  {
    id: 'elevator_pitch',
    label: 'Elevator Pitch',
    workflowMode: 'elevator',
    description: 'Short-form elevator pitch evaluation.',
  },
];
