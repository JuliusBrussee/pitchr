'use client';

import { Award, Lock, Shield, Star, Trophy, Zap } from 'lucide-react';
import type { Badge } from '@/types/arena';
import type { BadgeRarity } from '@/config/arena';
import { BADGES } from '@/config/arena';

/* ——————————————————————————————————————————————————————————
 * BadgeDisplay
 *
 * Responsive grid of earned (and optionally locked) badges.
 * Each tile shows a rarity-colored icon, name, description,
 * and earned date.
 * —————————————————————————————————————————————————————————— */

/* ——— Constants ——— */

const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: '#94a3b8',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
};

const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
};

function getRarityIcon(rarity: BadgeRarity) {
  switch (rarity) {
    case 'common': return Award;
    case 'uncommon': return Shield;
    case 'rare': return Star;
    case 'epic': return Trophy;
  }
}

function formatEarnedDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ——— Props ——— */

interface BadgeDisplayProps {
  badges: Badge[];
  allBadges?: typeof BADGES;
  showLocked?: boolean;
}

/* ——— Earned Badge Tile ——— */

function EarnedBadgeTile({ badge }: { badge: Badge }) {
  const color = RARITY_COLORS[badge.rarity];
  const Icon = getRarityIcon(badge.rarity);

  return (
    <div
      className="relative rounded-xl border p-4 flex flex-col items-center gap-2 text-center transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: `${color}33`,
      }}
    >
      {/* Rarity label */}
      <span
        className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
        style={{
          color,
          backgroundColor: `${color}15`,
        }}
      >
        {RARITY_LABELS[badge.rarity]}
      </span>

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: `${color}1a`,
          boxShadow: `0 0 12px ${color}20`,
        }}
      >
        <Icon size={22} style={{ color }} />
      </div>

      {/* Name */}
      <span
        className="text-sm font-bold leading-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {badge.name}
      </span>

      {/* Description */}
      <span
        className="text-xs leading-snug"
        style={{ color: 'var(--text-muted)' }}
      >
        {badge.description}
      </span>

      {/* Earned date */}
      <span
        className="text-[10px] font-medium"
        style={{ color: `${color}99` }}
      >
        {formatEarnedDate(badge.earnedAt)}
      </span>
    </div>
  );
}

/* ——— Locked Badge Tile ——— */

function LockedBadgeTile({ def }: { def: typeof BADGES[number] }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col items-center gap-2 text-center opacity-40"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-surface-hover)' }}
      >
        <Lock size={20} style={{ color: 'var(--text-muted)' }} />
      </div>

      {/* Name */}
      <span
        className="text-sm font-bold leading-tight"
        style={{ color: 'var(--text-muted)' }}
      >
        {def.name}
      </span>

      {/* Description */}
      <span
        className="text-xs leading-snug"
        style={{ color: 'var(--text-muted)' }}
      >
        {def.description}
      </span>

      {/* Locked label */}
      <span
        className="text-[10px] font-medium flex items-center gap-1"
        style={{ color: 'var(--text-muted)' }}
      >
        <Lock size={10} />
        Locked
      </span>
    </div>
  );
}

/* ——— Main Component ——— */

export function BadgeDisplay({ badges, allBadges = BADGES, showLocked = true }: BadgeDisplayProps) {
  const earnedIds = new Set(badges.map((b) => b.id));

  // Map earned badges by id for quick lookup
  const badgeMap = new Map(badges.map((b) => [b.id, b]));

  // Build ordered list: earned first, then locked
  const earnedDefs = allBadges.filter((def) => earnedIds.has(def.id));
  const lockedDefs = allBadges.filter((def) => !earnedIds.has(def.id));

  if (badges.length === 0 && !showLocked) {
    return (
      <div
        className="flex flex-col items-center gap-2 py-8"
      >
        <Zap size={24} style={{ color: 'var(--text-muted)' }} />
        <span
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          No badges earned yet. Keep pitching!
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {earnedDefs.map((def) => {
        const badge = badgeMap.get(def.id)!;
        return <EarnedBadgeTile key={badge.id} badge={badge} />;
      })}
      {showLocked && lockedDefs.map((def) => (
        <LockedBadgeTile key={def.id} def={def} />
      ))}
    </div>
  );
}
