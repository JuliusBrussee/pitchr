import type { PitchMode } from '@/types/pitch';

export interface PitchModeOption {
  key: PitchMode;
  label: string;
  description: string;
  icon: 'zap' | 'bar-chart';
  color: string;
  targetDurationLabel: string;
}

export const PITCH_MODE_OPTIONS: PitchModeOption[] = [
  {
    key: 'elevator',
    label: 'Elevator Pitch',
    description: '60 seconds. Hook them fast with a clear, concise intro.',
    icon: 'zap',
    color: '#f97316',
    targetDurationLabel: '~60s',
  },
  {
    key: 'vc_pitch',
    label: 'VC Pitch',
    description: 'Full 2-minute pitch. Cover your deck and close the round.',
    icon: 'bar-chart',
    color: '#ff5941',
    targetDurationLabel: '~2 min',
  },
];
