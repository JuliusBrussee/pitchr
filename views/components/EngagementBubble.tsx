'use client';

import type { HeadTrackingState } from '@/lib/headTracking/useHeadTracking';

interface EngagementBubbleProps {
  score: number;
  state: HeadTrackingState;
  visible: boolean;
}

export function EngagementBubble({ score, state, visible }: EngagementBubbleProps) {
  if (!visible) return null;

  const isNoFace = state === 'no_face';
  const displayValue = isNoFace ? 'N/A' : String(Math.round(score));

  return (
    <div
      className="min-w-[84px] rounded-full border px-3 py-2 text-center"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
      }}
      aria-label={isNoFace ? 'Engagement unavailable' : `Engagement score ${displayValue}`}
    >
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Engagement
      </div>
      <div
        className="text-sm font-semibold tabular-nums"
        style={{ color: isNoFace ? 'var(--text-muted)' : 'var(--text-primary)' }}
      >
        {displayValue}
      </div>
    </div>
  );
}
