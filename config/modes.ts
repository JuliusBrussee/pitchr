import type { PitchMode } from '@/types/pitch';

export interface PitchModeConfig {
  id: PitchMode;
  label: string;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  targetDurationSeconds: number;
  structureBeats: string[];
}

export const PITCH_MODE_CONFIG: Record<PitchMode, PitchModeConfig> = {
  elevator: {
    id: 'elevator',
    label: 'Elevator Pitch',
    minDurationSeconds: 30,
    maxDurationSeconds: 45,
    targetDurationSeconds: 45,
    structureBeats: ['Problem', 'Solution', 'Why Us'],
  },
  vc_pitch: {
    id: 'vc_pitch',
    label: 'VC Pitch',
    minDurationSeconds: 90,
    maxDurationSeconds: 120,
    targetDurationSeconds: 120,
    structureBeats: [
      'Problem',
      'Solution',
      'Why Now',
      'Traction',
      'Market',
      'Ask',
    ],
  },
};
