'use client';

import { useEffect, useState } from 'react';
import { Award, Shield, Star, Trophy, X } from 'lucide-react';
import type { Badge } from '@/types/arena';
import type { BadgeRarity } from '@/config/arena';

/* ——————————————————————————————————————————————————————————
 * BadgeUnlockToast
 *
 * Slide-in toast notifications for newly earned badges.
 * Shows rarity-colored glow, icon, name, and description.
 * Auto-dismisses after 4 seconds per badge.
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

/* ——— Props ——— */

interface BadgeUnlockToastProps {
  badges: Badge[];
  onDismiss: () => void;
}

/* ——— Single Toast ——— */

function SingleBadgeToast({
  badge,
  onDismiss,
  delay,
}: {
  badge: Badge;
  onDismiss: () => void;
  delay: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Stagger entrance based on index
    const enterTimer = setTimeout(() => setVisible(true), 50 + delay);

    // Auto-dismiss after 4s (plus stagger delay)
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000 + delay);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss, delay]);

  const color = RARITY_COLORS[badge.rarity];
  const Icon = getRarityIcon(badge.rarity);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: `${color}44`,
        boxShadow: `0 4px 24px ${color}20, 0 0 0 1px ${color}15`,
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        maxWidth: 340,
      }}
    >
      {/* Badge icon with glow */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: `${color}1a`,
          boxShadow: `0 0 16px ${color}30`,
        }}
      >
        <Icon size={20} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color }}
          >
            Badge Unlocked
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{
              color,
              backgroundColor: `${color}15`,
            }}
          >
            {RARITY_LABELS[badge.rarity]}
          </span>
        </div>
        <div
          className="text-xs font-semibold mt-0.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {badge.name}
        </div>
        <div
          className="text-[10px] mt-0.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {badge.description}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="p-1 rounded-md hover:opacity-80 flex-shrink-0 border-0 cursor-pointer"
        style={{
          color: 'var(--text-muted)',
          backgroundColor: 'transparent',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ——— Container ——— */

export function BadgeUnlockToast({ badges, onDismiss }: BadgeUnlockToastProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (badges.length === 0) return null;

  const visibleBadges = badges.filter((b) => !dismissed.has(b.id));

  if (visibleBadges.length === 0) {
    // All dismissed — notify parent
    onDismiss();
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {visibleBadges.map((badge, idx) => (
        <SingleBadgeToast
          key={badge.id}
          badge={badge}
          delay={idx * 200}
          onDismiss={() => {
            setDismissed((prev) => {
              const next = new Set(prev);
              next.add(badge.id);
              return next;
            });
          }}
        />
      ))}
    </div>
  );
}
