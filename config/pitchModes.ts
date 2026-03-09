import type { PitchMode } from '@/types/pitch';

export interface PitchModeOption {
  key: PitchMode;
  label: string;
  description: string;
  icon: 'zap' | 'bar-chart' | 'trophy';
  color: string;
  targetDurationLabel: string;
}

export const PITCH_MODE_OPTIONS: PitchModeOption[] = [
  {
    key: 'elevator',
    label: 'Elevator Pitch',
    description: 'Hook them fast with a clear, concise intro.',
    icon: 'zap',
    color: '#f97316',
    targetDurationLabel: '~1 min',
  },
  {
    key: 'vc_pitch',
    label: 'VC Pitch',
    description: 'Full pitch. Cover your deck and close the round.',
    icon: 'bar-chart',
    color: '#ff5941',
    targetDurationLabel: '~2 min',
  },
  {
    key: 'hackathon',
    label: 'Hackathon Pitch',
    description: 'Demo your hack. Win the judges.',
    icon: 'trophy',
    color: '#8b5cf6',
    targetDurationLabel: '~3 min',
  },
];
