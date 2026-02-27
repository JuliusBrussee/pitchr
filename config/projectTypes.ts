import type { PitchMode } from '@/types/pitch';
import type { ProjectTypeId } from '@/types/project';

export interface ProjectTypeConfig {
  id: ProjectTypeId;
  label: string;
  description: string;
  workflowMode: PitchMode;
  seedName: string;
}

export const PROJECT_TYPE_CONFIG: Record<ProjectTypeId, ProjectTypeConfig> = {
  two_min_pitch: {
    id: 'two_min_pitch',
    label: '2-Minute Pitch',
    description: 'Full investor pitch practice with detailed feedback.',
    workflowMode: 'vc_pitch',
    seedName: '2-Minute Pitch',
  },
  elevator_pitch: {
    id: 'elevator_pitch',
    label: 'Elevator Pitch',
    description: 'Fast, concise pitch practice for high-signal intros.',
    workflowMode: 'elevator',
    seedName: 'Elevator Pitch',
  },
};

export const PROJECT_TYPE_OPTIONS = Object.values(PROJECT_TYPE_CONFIG);

