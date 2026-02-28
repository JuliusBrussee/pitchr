'use client';

import { Target } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  totalRuns: number;
  bestScore: number;
  targetScore?: number;
}

export function StreakBadge({ streak, totalRuns, bestScore, targetScore = 75 }: StreakBadgeProps) {
  const hasTarget = bestScore > 0 && bestScore < targetScore;
  const hitTarget = bestScore >= targetScore;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Streak */}
      {streak > 0 && (
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold animate-fade-in-up"
          style={{
            backgroundColor: streak >= 3 ? '#ff59411a' : 'var(--bg-surface-hover)',
            color: streak >= 3 ? '#ff5941' : 'var(--text-secondary)',
            animationDelay: '0.15s',
            animationFillMode: 'both',
          }}
        >
          <span>{streak >= 3 ? '🔥' : '⚡'}</span>
          <span>{streak}-day streak</span>
        </div>
      )}

      {/* Total sessions */}
      <div
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium animate-fade-in-up"
        style={{
          backgroundColor: 'var(--bg-surface-hover)',
          color: 'var(--text-secondary)',
          animationDelay: '0.18s',
          animationFillMode: 'both',
        }}
      >
        {totalRuns} session{totalRuns !== 1 ? 's' : ''} total
      </div>

      {/* Target goal */}
      {hasTarget && (
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium animate-fade-in-up"
          style={{
            backgroundColor: 'var(--bg-surface-hover)',
            color: 'var(--text-muted)',
            animationDelay: '0.21s',
            animationFillMode: 'both',
          }}
        >
          <Target size={12} />
          Target: {targetScore}/100
        </div>
      )}
      {hitTarget && (
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold animate-fade-in-up"
          style={{
            backgroundColor: '#22c55e1a',
            color: '#22c55e',
            animationDelay: '0.21s',
            animationFillMode: 'both',
          }}
        >
          ✓ Target reached
        </div>
      )}
    </div>
  );
}
