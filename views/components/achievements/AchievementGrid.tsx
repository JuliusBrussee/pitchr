'use client';

import { useState } from 'react';
import { AchievementCard } from './AchievementCard';
import {
  type AchievementCategory,
  type AchievementState,
  ACHIEVEMENT_DEFS,
  CATEGORY_LABELS,
} from '@/lib/achievements';

interface AchievementGridProps {
  state: AchievementState;
}

const ALL_CATEGORIES: (AchievementCategory | 'all')[] = [
  'all', 'sessions', 'scores', 'streaks', 'mastery', 'improvement', 'special',
];

export function AchievementGrid({ state }: AchievementGridProps) {
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');

  const earnedCount = Object.keys(state).length;
  const totalCount = ACHIEVEMENT_DEFS.length;
  const percent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const filtered = filter === 'all'
    ? ACHIEVEMENT_DEFS
    : ACHIEVEMENT_DEFS.filter((d) => d.category === filter);

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {earnedCount} / {totalCount} achievements unlocked
          </span>
          <span className="text-xs font-semibold" style={{ color: '#ff5941' }}>
            {percent}%
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background: 'linear-gradient(90deg, #ff5941, #ffaa33)',
            }}
          />
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ALL_CATEGORIES.map((cat) => {
          const isActive = filter === cat;
          const label = cat === 'all' ? 'All' : CATEGORY_LABELS[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200"
              style={{
                backgroundColor: isActive ? 'rgba(255, 89, 65, 0.12)' : 'var(--bg-surface-hover)',
                color: isActive ? '#ff5941' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'rgba(255, 89, 65, 0.25)' : 'var(--border-color)'}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((def) => (
          <AchievementCard
            key={def.id}
            def={def}
            state={state[def.id]}
            isLocked={!state[def.id]}
          />
        ))}
      </div>
    </div>
  );
}
