'use client';

import Link from 'next/link';
import * as Icons from 'lucide-react';
import type { AchievementState, AchievementProgress } from '@/lib/achievements';
import { ACHIEVEMENT_DEFS } from '@/lib/achievements';

interface AchievementSummaryProps {
  state: AchievementState;
  progress: AchievementProgress[];
}

const CATEGORY_COLORS: Record<string, string> = {
  sessions: '#3b82f6',
  scores: '#22c55e',
  streaks: '#f97316',
  mastery: '#a78bfa',
  improvement: '#06b6d4',
  special: '#eab308',
};

function getIcon(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComp = (Icons as any)[name];
  return IconComp ?? Icons.Award;
}

export function AchievementSummary({ state, progress }: AchievementSummaryProps) {
  const earnedCount = Object.keys(state).length;
  const totalCount = ACHIEVEMENT_DEFS.length;

  // Recent unlocks (up to 4, sorted by most recent)
  const recentUnlocks = Object.entries(state)
    .sort(([, a], [, b]) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 4)
    .map(([id, s]) => ({
      def: ACHIEVEMENT_DEFS.find((d) => d.id === id)!,
      unlockedAt: s.unlockedAt,
    }))
    .filter((u) => u.def);

  // Next closest achievements (up to 3)
  const nextUp = progress.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icons.Award size={16} style={{ color: '#eab308' }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-primary)' }}
          >
            Achievements
          </span>
        </div>
        <Link
          href="/settings?tab=rewards"
          className="text-[10px] font-medium no-underline transition-colors hover:opacity-80"
          style={{ color: '#ff5941' }}
        >
          View All ({earnedCount}/{totalCount})
        </Link>
      </div>

      {/* Recent unlocks */}
      {recentUnlocks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {recentUnlocks.map(({ def }) => {
            const color = CATEGORY_COLORS[def.category] ?? '#6b7280';
            const Icon = getIcon(def.icon);
            return (
              <div
                key={def.id}
                className="rounded-lg border p-2 text-center"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: `${color}33`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center"
                  style={{ backgroundColor: `${color}1a` }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {def.name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Next up - progress bars */}
      {nextUp.length > 0 && (
        <div className="space-y-2">
          <div
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            Next up
          </div>
          {nextUp.map(({ def, current, target, percent }) => {
            const color = CATEGORY_COLORS[def.category] ?? '#6b7280';
            return (
              <div key={def.id} className="flex items-center gap-2">
                <span className="text-[10px] font-medium w-24 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {def.name}
                </span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: color }}
                  />
                </div>
                <span className="text-[9px] font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {current}/{target}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {earnedCount === 0 && nextUp.length === 0 && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
          Complete your first pitch to start earning achievements.
        </p>
      )}
    </div>
  );
}
