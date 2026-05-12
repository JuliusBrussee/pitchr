'use client';

import { getScoreColor, getScoreBgColor, getScoreBandLabel } from './colors';

interface ScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ScoreBadge({ score, showLabel = false, size = 'md' }: ScoreBadgeProps) {
  const color = getScoreColor(score);
  const bg = getScoreBgColor(score);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`font-bold tabular-nums rounded-lg ${
          size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'
        }`}
        style={{ color, backgroundColor: bg }}
      >
        {score}
      </span>
      {showLabel && (
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color }}
        >
          {getScoreBandLabel(score)}
        </span>
      )}
    </div>
  );
}
