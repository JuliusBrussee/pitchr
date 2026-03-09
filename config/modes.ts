import type { PitchMode } from '@/types/pitch';
import type { PitchStage } from '@/types/analysis-v2';

export interface PitchModeConfig {
  id: PitchMode;
  label: string;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  targetDurationSeconds: number;
  defaultDurationSeconds: number;
  targetWpm: number;
  structureBeats: string[];
}

export const DURATION_SLIDER_MIN = 30;
export const DURATION_SLIDER_MAX = 300;
export const DURATION_SLIDER_STEP = 15;
export const OVERTIME_LIMIT_SECONDS = 60;

export function computeTimingWindow(targetSeconds: number): { min: number; max: number } {
  return {
    min: Math.round(targetSeconds * 0.85),
    max: Math.round(targetSeconds * 1.15),
  };
}

export const PITCH_MODE_CONFIG: Record<PitchMode, PitchModeConfig> = {
  elevator: {
    id: 'elevator',
    label: 'Elevator Pitch',
    minDurationSeconds: 25,
    maxDurationSeconds: 35,
    targetDurationSeconds: 30,
    defaultDurationSeconds: 60,
    targetWpm: 165,
    structureBeats: ['One-liner', 'Problem', 'Solution', 'Proof', 'Ask'],
  },
  vc_pitch: {
    id: 'vc_pitch',
    label: 'VC Pitch',
    minDurationSeconds: 110,
    maxDurationSeconds: 130,
    targetDurationSeconds: 120,
    defaultDurationSeconds: 120,
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
  hackathon: {
    id: 'hackathon',
    label: 'Hackathon Pitch',
    minDurationSeconds: 150,
    maxDurationSeconds: 210,
    targetDurationSeconds: 180,
    defaultDurationSeconds: 180,
    targetWpm: 150,
    structureBeats: [
      'Hook',
      'Problem',
      'Demo',
      'Innovation',
      'Impact',
      'Ask',
    ],
  },
};

export const STAGE_LABELS: Record<PitchStage, string> = {
  pre_seed: 'Pre-Seed',
  seed: 'Seed',
  series_a: 'Series A',
  series_b: 'Series B',
  university_hack: 'University Hackathon',
  corporate_hack: 'Corporate Hackathon',
  web3_hack: 'Web3 Hackathon',
  science_hack: 'Science Hackathon',
};
