'use client';

export function FillerTrendChart({ data }: { data: { label: string; total: number }[] }) {
  const maxVal = Math.max(1, ...data.map((d) => d.total));
  const yStep = Math.max(1, Math.ceil(maxVal / 4));
  const yLabels: number[] = [];
  for (let v = 0; v <= maxVal + yStep; v += yStep) {
    yLabels.push(v);
  }
  const yMax = yLabels[yLabels.length - 1];
  yLabels.reverse();

  return (
    <div>
      <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        Filler Count per Session
      </h4>
      <div className="flex gap-0 h-[140px] sm:h-[180px]">
        {/* Y-axis labels */}
        <div
          className="flex flex-col justify-between pr-3 py-1"
          style={{ width: 30 }}
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
            className="flex-1 flex items-stretch gap-1 relative"
            style={{
              borderBottom: '1px solid var(--border-color)',
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            {data.map((d, i) => {
              const heightPct = yMax > 0 ? (d.total / yMax) * 100 : 0;
              const clampedHeightPct = d.total > 0 ? Math.max(2, heightPct) : 0;
              return (
                <div
                  key={i}
                  className="flex-1 h-full flex flex-col items-center justify-end relative z-10"
                >
                  <div
                    className="w-full max-w-[36px] rounded-t-md relative overflow-hidden transition-all duration-500 ease-out group cursor-default"
                    data-testid="filler-trend-bar"
                    style={{
                      height: `${clampedHeightPct}%`,
                      backgroundColor: '#f59e0b',
                      opacity: 0.85,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.15))',
                      }}
                    />
                    <div
                      className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
                      style={{
                        backgroundColor: 'var(--bg-surface-hover)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {d.total}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-1 mt-2">
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
    </div>
  );
}
