'use client';

import { Zap, Presentation, Trophy, GraduationCap } from 'lucide-react';
import type { PitchMode } from '@/types/pitch';

interface UseCaseStepProps {
  onSelect: (mode: PitchMode) => void;
}

const MODES = [
  {
    mode: 'elevator' as PitchMode,
    label: 'Elevator Pitch',
    description: '30-second intro to an investor',
    icon: Zap,
    timer: '30 sec',
  },
  {
    mode: 'vc_pitch' as PitchMode,
    label: 'VC Pitch',
    description: 'Full fundraising pitch walkthrough',
    icon: Presentation,
    timer: '5 min',
  },
  {
    mode: 'hackathon' as PitchMode,
    label: 'Hackathon Pitch',
    description: 'Demo your hack and win the judges',
    icon: Trophy,
    timer: '3 min',
  },
  {
    mode: 'final_year' as PitchMode,
    label: 'Final Year Project',
    description: 'Present your research to academic panels',
    icon: GraduationCap,
    timer: '4 min',
  },
];

export function UseCaseStep({ onSelect }: UseCaseStepProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <h2
        className="text-2xl font-bold mb-2 text-center"
        style={{ color: 'var(--text-primary)' }}
      >
        What are you pitching?
      </h2>
      <p
        className="text-sm mb-8 text-center"
        style={{ color: 'var(--text-secondary)' }}
      >
        We&apos;ll set the timer and scoring rubric for you.
      </p>

      <div className="w-full max-w-sm space-y-3">
        {MODES.map(({ mode, label, description, icon: Icon, timer }) => (
          <button
            key={mode}
            onClick={() => onSelect(mode)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: 'rgba(255,89,65,0.1)' }}
            >
              <Icon size={20} style={{ color: '#ff5941' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {label}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </p>
            </div>
            <span
              className="text-xs font-medium px-2 py-1 rounded-md"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-muted)',
              }}
            >
              {timer}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
