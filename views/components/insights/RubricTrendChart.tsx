'use client';

import type { RubricTrendPoint } from '@/lib/insightsAnalytics';
import { INSIGHTS_CATEGORY_LABELS } from '@/lib/insightsAnalytics';
import { RUBRIC_COLORS, getRubricColor } from '@/views/components/ui';

export function RubricTrendChart({ data }: { data: RubricTrendPoint[] }) {
  const maxVal = 20;
  const yLabels = [20, 15, 10, 5, 0];
  const categories = Object.keys(RUBRIC_COLORS);

  return (
    <div>
      <div className="flex gap-0 h-[160px] sm:h-[220px]">
        {/* Y-axis labels */}
        <div
          className="flex flex-col justify-between pr-3 py-1"
          style={{ width: 36 }}
        >
          {yLabels.map((y) => (
            <span
              key={y}
              className="text-[10px] font-medium tabular-nums text-right leading-none"
              style={{ color: 'var(--text-muted)' }}
            >
              {y}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div className="flex-1 flex flex-col">
          <div
            className="flex-1 flex items-stretch gap-2 relative"
            style={{
              borderBottom: '1px solid var(--border-color)',
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            {/* Horizontal grid lines */}
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                className="absolute left-0 right-0"
                style={{
                  bottom: `${pct}%`,
                  height: 1,
                  backgroundColor: 'var(--border-color)',
                }}
              />
            ))}

            {/* Grouped bars per session */}
            {data.map((session, i) => (
              <div
                key={i}
                className="flex-1 h-full flex items-end justify-center gap-[2px] relative z-10 group cursor-default"
              >
                {categories.map((cat) => {
                  const scoreEntry = session.scores.find((s) => s.category === cat);
                  const score = scoreEntry?.score ?? 0;
                  const hasData = scoreEntry?.hasData ?? false;
                  const heightPct = (score / maxVal) * 100;
                  const clampedHeightPct = score > 0 ? Math.max(2.5, heightPct) : 0;
                  return (
                    <div
                      key={cat}
                      className="rounded-t-sm transition-all duration-500 ease-out"
                      data-testid="rubric-trend-bar"
                      style={{
                        width: '16%',
                        minWidth: 3,
                        maxWidth: 8,
                        height: `${clampedHeightPct}%`,
                        backgroundColor: hasData ? getRubricColor(cat) : 'transparent',
                        opacity: hasData ? 0.85 : 0,
                      }}
                    />
                  );
                })}
                {/* Tooltip on hover */}
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-20"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="text-[10px] font-semibold mb-1">{session.label}</div>
                  {categories.map((cat) => {
                    const score = session.scores.find((s) => s.category === cat)?.score ?? 0;
                    return (
                      <div key={cat} className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: getRubricColor(cat) }}
                        />
                        <span>{INSIGHTS_CATEGORY_LABELS[cat] ?? cat}</span>
                        <span className="font-bold ml-auto pl-2">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-2 mt-2">
            {data.map((d, i) => (
              <div key={i} className="flex-1 text-center">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend row */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getRubricColor(cat) }}
            />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {INSIGHTS_CATEGORY_LABELS[cat] ?? cat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
