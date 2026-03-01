'use client';

import type { RubricScore } from '@/types/analysis-v2';
import { getScoreColor } from '@/views/components/ui/colors';
import { SourceRefChips } from '@/views/components/results/SourceRefChips';

interface RubricBreakdownProps {
  breakdown: RubricScore[];
}

const RING_RADIUS = 16;
const RING_STROKE = 4;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function RubricBreakdown({ breakdown }: RubricBreakdownProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {breakdown.map((item, index) => {
        const pct = clamp(item.max_score > 0 ? item.score / item.max_score : 0, 0, 1);
        const color = getScoreColor(item.max_score > 0 ? (item.score / item.max_score) * 100 : 0);
        const label = item.category.replace(/_/g, ' ');
        const dashOffset = RING_CIRCUMFERENCE * (1 - pct);

        return (
          <article
            key={item.category}
            className="rounded-lg border px-2.5 py-2 flex items-center gap-2.5 results-card-enter"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              '--card-delay': `${index * 80}ms`,
            } as React.CSSProperties}
          >
            <div className="relative w-10 h-10 shrink-0">
              <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
                <circle
                  cx="20"
                  cy="20"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={`${color}26`}
                  strokeWidth={RING_STROKE}
                />
                <circle
                  cx="20"
                  cy="20"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  className="results-rubric-ring-progress"
                  style={{
                    stroke: color,
                    '--ring-circumference': RING_CIRCUMFERENCE,
                    '--ring-offset': dashOffset,
                    '--ring-delay': `${180 + index * 80}ms`,
                    transform: 'rotate(-90deg)',
                    transformOrigin: '20px 20px',
                  } as React.CSSProperties}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold tabular-nums leading-none" style={{ color }}>
                  {item.score}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <p
                  className="text-xs font-medium capitalize"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {label}
                </p>
                <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  /{item.max_score}
                </span>
              </div>
              <p
                className="text-[11px] leading-snug mt-0.5 line-clamp-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {item.rationale}
              </p>
              <SourceRefChips refs={item.evidence_refs} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
