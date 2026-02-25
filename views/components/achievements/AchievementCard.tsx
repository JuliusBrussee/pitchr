'use client';

import * as Icons from 'lucide-react';
import type { AchievementDef, AchievementState } from '@/lib/achievements';

interface AchievementCardProps {
  def: AchievementDef;
  state?: AchievementState[string];
  isLocked: boolean;
  compact?: boolean;
  index?: number;
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
  });
}

export function AchievementCard({ def, state, isLocked, compact, index = 0 }: AchievementCardProps) {
  const color = CATEGORY_COLORS[def.category] ?? '#6b7280';
  const Icon = getIcon(def.icon);
  const delay = index * 40;

  /* ——— Hidden achievement ——— */
  if (isLocked && def.isHidden) {
    return (
      <div
        className="ach-card group relative rounded-xl border p-3 text-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          opacity: 0.35,
          animationDelay: `${delay}ms`,
        }}
      >
        <div
          className="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <Icons.HelpCircle size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          ???
        </div>
        <div className="text-[9px] leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Hidden
        </div>
      </div>
    );
  }

  /* ——— Compact badge (for collapsed shelf) ——— */
  if (compact) {
    return (
      <div
        className="ach-compact-badge group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-default"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: `${color}30`,
          boxShadow: `0 0 0 1px ${color}08, 0 1px 3px ${color}10`,
          animationDelay: `${delay}ms`,
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: `${color}18`, boxShadow: `0 0 8px ${color}15` }}
        >
          <Icon size={12} style={{ color }} />
        </div>
        <span
          className="text-[10px] font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {def.name}
        </span>
      </div>
    );
  }

  /* ——— Full card ——— */
  return (
    <div
      className="ach-card group relative rounded-xl border p-3 text-center transition-all duration-300 cursor-default overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isLocked ? 'var(--border-color)' : `${color}30`,
        opacity: isLocked ? 0.4 : 1,
        boxShadow: isLocked ? 'none' : `0 2px 8px ${color}10`,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Subtle shine on hover for unlocked cards */}
      {!isLocked && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 40%, ${color}08 50%, transparent 60%)`,
          }}
        />
      )}

      <div
        className={`w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center transition-all duration-300 ${
          !isLocked ? 'group-hover:scale-110' : ''
        }`}
        style={{
          backgroundColor: isLocked ? 'var(--bg-surface-hover)' : `${color}15`,
          boxShadow: isLocked ? 'none' : `0 0 12px ${color}18`,
        }}
      >
        {isLocked ? (
          <Icons.Lock size={13} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <Icon size={16} style={{ color }} />
        )}
      </div>

      <div
        className="text-[11px] font-semibold leading-tight"
        style={{ color: isLocked ? 'var(--text-secondary)' : 'var(--text-primary)' }}
      >
        {def.name}
      </div>
      <div className="text-[9px] leading-tight mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
        {def.description}
      </div>
      {state?.unlockedAt && (
        <div
          className="text-[8px] mt-1 font-medium"
          style={{ color: `${color}90` }}
        >
          {formatDate(state.unlockedAt)}
        </div>
      )}
    </div>
  );
}
