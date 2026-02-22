'use client';

import type { RubricScore } from '@/types/analysis-v2';
import { getRubricColor } from '@/views/components/ui/colors';

interface RubricBreakdownProps {
  breakdown: RubricScore[];
}

const RING_RADIUS = 24;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function RubricBreakdown({ breakdown }: RubricBreakdownProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {breakdown.map((item, index) => {
        const pct = clamp(item.max_score > 0 ? item.score / item.max_score : 0, 0, 1);
        const color = getRubricColor(item.category);
        const label = item.category.replace(/_/g, ' ');
        const dashOffset = RING_CIRCUMFERENCE * (1 - pct);

        return (
          <article
            key={item.category}
            className="rounded-xl border p-3 flex items-center gap-3 results-card-enter"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              '--card-delay': `${index * 100}ms`,
            } as React.CSSProperties}
          >
            <div className="relative w-20 h-20 shrink-0">
              <svg width="80" height="80" viewBox="0 0 64 64" aria-hidden>
                <circle
                  cx="32"
                  cy="32"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={`${color}26`}
                  strokeWidth={RING_STROKE}
                />
                <circle
                  cx="32"
                  cy="32"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  className="results-rubric-ring-progress"
                  style={{
                    stroke: color,
                    '--ring-circumference': RING_CIRCUMFERENCE,
                    '--ring-offset': dashOffset,
                    '--ring-delay': `${180 + index * 100}ms`,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '32px 32px',
                  } as React.CSSProperties}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold tabular-nums leading-none" style={{ color }}>
                  {item.score}
                </span>
                <span className="text-[10px] tabular-nums mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  /{item.max_score}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium capitalize"
                style={{ color: 'var(--text-primary)' }}
              >
                {label}
              </p>
              <p
                className="text-xs mt-1.5 leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.rationale}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
