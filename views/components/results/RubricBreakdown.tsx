'use client';

import type { RubricScore } from '@/types/analysis-v2';
import { getRubricColor } from '@/views/components/ui/colors';

interface RubricBreakdownProps {
  breakdown: RubricScore[];
}

export function RubricBreakdown({ breakdown }: RubricBreakdownProps) {
  return (
    <div className="flex flex-col gap-4">
      {breakdown.map((item, index) => {
        const pct = Math.max(0, Math.min(100, (item.score / item.max_score) * 100));
        const color = getRubricColor(item.category);
        const label = item.category.replace(/_/g, ' ');

        return (
          <div
            key={item.category}
            className="results-card-enter"
            style={{ '--card-delay': `${index * 100}ms` } as React.CSSProperties}
          >
            <div className="flex items-baseline justify-between mb-1.5">
              <span
                className="text-sm font-medium capitalize"
                style={{ color: 'var(--text-primary)' }}
              >
                {label}
              </span>
              <span className="text-sm font-semibold tabular-nums" style={{ color }}>
                {item.score}
                <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  /{item.max_score}
                </span>
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: `${color}1a` }}
            >
              <div
                className="h-full rounded-full results-rubric-bar"
                style={{
                  '--bar-width': `${pct}%`,
                  '--bar-delay': `${200 + index * 120}ms`,
                  backgroundColor: color,
                } as React.CSSProperties}
              />
            </div>
            <p
              className="text-xs mt-1.5 leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.rationale}
            </p>
          </div>
        );
      })}
    </div>
  );
}
