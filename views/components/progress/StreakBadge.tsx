'use client';

import {
  Trophy,
  TrendingUp,
  Target,
  Zap,
  Star,
  Flame,
  Lock,
} from 'lucide-react';
import type { Milestone } from '@/lib/progress';

interface StreakBadgeProps {
  milestones: Milestone[];
}

const ICON_MAP: Record<string, typeof Trophy> = {
  trophy: Trophy,
  'trending-up': TrendingUp,
  target: Target,
  zap: Zap,
  star: Star,
  flame: Flame,
};

const ICON_COLORS: Record<string, string> = {
  trophy: '#eab308',
  'trending-up': '#22c55e',
  target: '#3b82f6',
  zap: '#f97316',
  star: '#a78bfa',
  flame: '#ef4444',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function StreakBadge({ milestones }: StreakBadgeProps) {
  const achieved = milestones.filter((m) => m.achieved);
  const locked = milestones.filter((m) => !m.achieved);

  return (
    <div>
      {/* Achieved */}
      {achieved.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {achieved.map((milestone, index) => {
            const Icon = ICON_MAP[milestone.icon] ?? Star;
            const iconColor = ICON_COLORS[milestone.icon] ?? '#6b7280';

            return (
              <div
                key={milestone.id}
                className="rounded-xl border p-3 text-center transition-all duration-200 animate-fade-in-up"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: 'both',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: `${iconColor}1a` }}
                >
                  <Icon size={20} style={{ color: iconColor }} />
                </div>
                <div
                  className="text-xs font-semibold mb-0.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {milestone.label}
                </div>
                <div
                  className="text-[10px] leading-snug"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {milestone.description}
                </div>
                {milestone.achievedAt && (
                  <div
                    className="text-[9px] mt-1.5 font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {formatDate(milestone.achievedAt)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <div
            className="text-[10px] font-semibold uppercase tracking-wide mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Locked
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {locked.map((milestone, index) => (
              <div
                key={milestone.id}
                className="rounded-xl border p-3 text-center opacity-50 animate-fade-in-up"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  animationDelay: `${(achieved.length + index) * 60}ms`,
                  animationFillMode: 'both',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--bg-surface-hover)' }}
                >
                  <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div
                  className="text-xs font-semibold mb-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {milestone.label}
                </div>
                <div
                  className="text-[10px] leading-snug"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {milestone.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
