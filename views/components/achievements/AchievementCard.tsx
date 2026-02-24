'use client';

import * as Icons from 'lucide-react';
import type { AchievementDef, AchievementState } from '@/lib/achievements';

interface AchievementCardProps {
  def: AchievementDef;
  state?: AchievementState[string];
  isLocked: boolean;
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AchievementCard({ def, state, isLocked }: AchievementCardProps) {
  const color = CATEGORY_COLORS[def.category] ?? '#6b7280';
  const Icon = getIcon(def.icon);

  if (isLocked && def.isHidden) {
    return (
      <div
        className="rounded-xl border p-3 text-center opacity-40"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div
          className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <Icons.HelpCircle size={20} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-secondary)' }}>
          ???
        </div>
        <div className="text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>
          Hidden achievement
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-3 text-center transition-all duration-200 ${isLocked ? 'opacity-40' : ''}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isLocked ? 'var(--border-color)' : `${color}33`,
      }}
    >
      <div
        className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
        style={{
          backgroundColor: isLocked ? 'var(--bg-surface-hover)' : `${color}1a`,
        }}
      >
        {isLocked ? (
          <Icons.Lock size={16} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <Icon size={20} style={{ color }} />
        )}
      </div>
      <div
        className="text-xs font-semibold mb-0.5"
        style={{ color: isLocked ? 'var(--text-secondary)' : 'var(--text-primary)' }}
      >
        {def.name}
      </div>
      <div className="text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>
        {def.description}
      </div>
      {state?.unlockedAt && (
        <div className="text-[9px] mt-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>
          {formatDate(state.unlockedAt)}
        </div>
      )}
    </div>
  );
}
