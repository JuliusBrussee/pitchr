import type { PitchMode } from '@/types/pitch';
import type { PitchStage } from '@/types/analysis-v2';

export interface PitchModeConfig {
  id: PitchMode;
  label: string;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  targetDurationSeconds: number;
  targetWpm: number;
  structureBeats: string[];
}

export const PITCH_MODE_CONFIG: Record<PitchMode, PitchModeConfig> = {
  elevator: {
    id: 'elevator',
    label: 'Elevator Pitch',
    minDurationSeconds: 30,
    maxDurationSeconds: 45,
    targetDurationSeconds: 38,
    targetWpm: 150,
    structureBeats: ['Problem', 'Solution', 'Why Us'],
  },
  vc_pitch: {
    id: 'vc_pitch',
    label: 'VC Pitch',
    minDurationSeconds: 110,
    maxDurationSeconds: 130,
    targetDurationSeconds: 120,
    targetWpm: 140,
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

export const STAGE_LABELS: Record<PitchStage, string> = {
  pre_seed: 'Pre-Seed',
  seed: 'Seed',
  series_a: 'Series A',
  series_b: 'Series B',
};
