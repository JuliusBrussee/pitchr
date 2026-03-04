'use client';

import { ArrowUp, ArrowDown, Shield } from 'lucide-react';

type ZoneType = 'promotion' | 'safe' | 'demotion';

interface PromotionZoneSeparatorProps {
  type: 'promotion' | 'demotion';
}

const ZONE_CONFIG = {
  promotion: {
    label: 'Promotion Zone',
    color: '#22c55e',
    Icon: ArrowUp,
  },
  demotion: {
    label: 'Demotion Zone',
    color: '#ef4444',
    Icon: ArrowDown,
  },
} as const;

export function PromotionZoneSeparator({ type }: PromotionZoneSeparatorProps) {
  const { label, color, Icon } = ZONE_CONFIG[type];

  return (
    <div className="flex items-center gap-2 py-1.5 px-3">
      <div
        className="flex-1 h-px"
        style={{ backgroundColor: color, opacity: 0.3 }}
      />
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color }} />
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color }}
        >
          {label}
        </span>
      </div>
      <div
        className="flex-1 h-px"
        style={{ backgroundColor: color, opacity: 0.3 }}
      />
    </div>
  );
}

/* ——————————————————————————————————————————————————————————
 * Zone indicator — colored left border on each row
 * —————————————————————————————————————————————————————————— */

interface ZoneIndicatorProps {
  zone: ZoneType;
  children: React.ReactNode;
}

const ZONE_BORDER_COLORS: Record<ZoneType, string> = {
  promotion: '#22c55e',
  safe: 'transparent',
  demotion: '#ef4444',
};

export function ZoneIndicator({ zone, children }: ZoneIndicatorProps) {
  return (
    <div
      className="relative"
      style={{
        borderLeftWidth: zone !== 'safe' ? '3px' : '0px',
        borderLeftStyle: 'solid',
        borderLeftColor: ZONE_BORDER_COLORS[zone],
      }}
    >
      {children}
    </div>
  );
}

/* ——————————————————————————————————————————————————————————
 * Zone badge — small pill shown in league header area
 * —————————————————————————————————————————————————————————— */

interface ZoneBadgeProps {
  zone: ZoneType;
}

const ZONE_BADGE_CONFIG: Record<ZoneType, { label: string; color: string; Icon: typeof ArrowUp }> = {
  promotion: { label: 'Promoting', color: '#22c55e', Icon: ArrowUp },
  safe: { label: 'Safe', color: 'var(--text-muted)', Icon: Shield },
  demotion: { label: 'At Risk', color: '#ef4444', Icon: ArrowDown },
};

export function ZoneBadge({ zone }: ZoneBadgeProps) {
  const { label, color, Icon } = ZONE_BADGE_CONFIG[zone];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{
        color,
        backgroundColor: `${typeof color === 'string' && color.startsWith('#') ? color : 'currentColor'}15`,
        border: `1px solid ${typeof color === 'string' && color.startsWith('#') ? color : 'currentColor'}30`,
      }}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}
