'use client';

import type { HeadTrackingEngagementBand } from '@/lib/headTracking/engagementBand';
import type { HeadTrackingState } from '@/lib/headTracking/useHeadTracking';

interface EngagementBubbleProps {
  band: HeadTrackingEngagementBand;
  state: HeadTrackingState;
  visible: boolean;
}

const BAND_LABELS: Record<HeadTrackingEngagementBand, string> = {
  good: 'Good',
  could_improve: 'Could Be Improved',
  bad: 'Bad',
  no_face: 'No Face',
};

const BAND_COLORS: Record<HeadTrackingEngagementBand, string> = {
  good: '#22c55e',
  could_improve: '#f59e0b',
  bad: '#ef4444',
  no_face: 'var(--text-muted)',
};

const BAND_ARIA: Record<HeadTrackingEngagementBand, string> = {
  good: 'Engagement good',
  could_improve: 'Engagement could be improved',
  bad: 'Engagement bad',
  no_face: 'Engagement unavailable',
};

export function EngagementBubble({ band, state, visible }: EngagementBubbleProps) {
  if (!visible) return null;

  const effectiveBand = state === 'no_face' ? 'no_face' : band;

  return (
    <div
      className="min-w-[132px] rounded-full border px-3 py-2 text-center"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
      }}
      aria-label={BAND_ARIA[effectiveBand]}
    >
      <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        Engagement
      </div>
      <div
        className="text-sm font-semibold"
        style={{ color: BAND_COLORS[effectiveBand] }}
      >
        {BAND_LABELS[effectiveBand]}
      </div>
    </div>
  );
}
