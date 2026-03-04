'use client';

import { Clock, Mic, Zap, Award, Flame } from 'lucide-react';
import { GlassCard } from '@/views/components/ui/GlassCard';
import { DIFFICULTY_SETTINGS } from '@/config/arena';
import type { Difficulty } from '@/config/arena';

interface GameModePanelProps {
  onSelectDifficulty: (difficulty: Difficulty) => void;
  isLoading: boolean;
}

const DIFFICULTY_META: Record<Difficulty, {
  icon: React.ReactNode;
  description: string;
  borderColor: string;
  accentColor: string;
}> = {
  starter: {
    icon: <Zap size={20} />,
    description: 'Full brief with generous read time. Great for warming up.',
    borderColor: '#ffaa33',
    accentColor: '#ffaa33',
  },
  pro: {
    icon: <Award size={20} />,
    description: 'Less read time, same pitch window. Think fast, pitch strong.',
    borderColor: '#ff5941',
    accentColor: '#ff5941',
  },
  expert: {
    icon: <Flame size={20} />,
    description: 'Minimal brief, tight window. Only the essentials. Can you improvise?',
    borderColor: '#e63b26',
    accentColor: '#e63b26',
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function GameModePanel({ onSelectDifficulty, isLoading }: GameModePanelProps) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Game Mode
        </h2>
        <p
          className="text-sm max-w-md"
          style={{ color: 'var(--text-secondary)' }}
        >
          Pick a difficulty, read the scenario brief, then pitch before time runs out.
          Harder difficulties earn more XP.
        </p>
      </div>

      {/* Difficulty Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((diff, i) => {
          const settings = DIFFICULTY_SETTINGS[diff];
          const meta = DIFFICULTY_META[diff];

          return (
            <GlassCard
              key={diff}
              animationDelay={`${0.1 + i * 0.08}s`}
              className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              style={{
                borderColor: `${meta.borderColor}40`,
              }}
              onClick={() => !isLoading && onSelectDifficulty(diff)}
            >
              <div className="flex flex-col items-center text-center gap-3">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${meta.accentColor}1a`,
                    color: meta.accentColor,
                  }}
                >
                  {meta.icon}
                </div>

                {/* Label */}
                <h3
                  className="text-base font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {settings.label}
                </h3>

                {/* Description */}
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {meta.description}
                </p>

                {/* Time pills */}
                <div className="flex flex-col gap-1.5 w-full mt-1">
                  <div
                    className="flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg py-1.5"
                    style={{
                      backgroundColor: 'var(--bg-surface-hover)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Clock size={12} />
                    Read: {formatTime(settings.readTimeSec)}
                  </div>
                  <div
                    className="flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg py-1.5"
                    style={{
                      backgroundColor: 'var(--bg-surface-hover)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Mic size={12} />
                    Pitch: {formatTime(settings.pitchTimeSec)}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{
              borderColor: 'var(--border-color)',
              borderTopColor: '#ff5941',
            }}
          />
          <span
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Loading scenario...
          </span>
        </div>
      )}
    </div>
  );
}
