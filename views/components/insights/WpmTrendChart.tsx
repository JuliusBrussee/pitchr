'use client';

export function WpmTrendChart({ data }: { data: { label: string; wpm: number }[] }) {
  const maxWpm = Math.max(200, ...data.map((d) => d.wpm)) + 10;
  const minWpm = 0;
  const range = maxWpm - minWpm;

  const yStep = 40;
  const yLabels: number[] = [];
  for (let v = 0; v <= maxWpm; v += yStep) {
    yLabels.push(v);
  }
  yLabels.reverse();

  const idealLow = 130;
  const idealHigh = 160;
  const idealBottomPct = ((idealLow - minWpm) / range) * 100;
  const idealHeightPct = ((idealHigh - idealLow) / range) * 100;

  function getWpmColor(wpm: number): string {
    if (wpm >= idealLow && wpm <= idealHigh) return '#22c55e';
    if (wpm < idealLow) return '#f59e0b';
    return '#ef4444';
  }

  return (
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
          className="flex-1 flex items-stretch gap-1 relative"
          style={{
            borderBottom: '1px solid var(--border-color)',
            borderLeft: '1px solid var(--border-color)',
          }}
        >
          {/* Ideal zone band */}
          <div
            className="absolute left-0 right-0 z-0"
            style={{
              bottom: `${idealBottomPct}%`,
              height: `${idealHeightPct}%`,
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              borderTop: '1px dashed rgba(34, 197, 94, 0.4)',
              borderBottom: '1px dashed rgba(34, 197, 94, 0.4)',
            }}
          />

          {/* Bars */}
          {data.map((d, i) => {
            const heightPct = ((d.wpm - minWpm) / range) * 100;
            const barColor = getWpmColor(d.wpm);

            return (
              <div
                key={i}
                className="flex-1 h-full flex flex-col items-center justify-end relative z-10"
              >
                <div
                  className="w-full max-w-[36px] rounded-t-md relative overflow-hidden transition-all duration-500 ease-out group cursor-default"
                  data-testid="wpm-trend-bar"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: barColor,
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
                    {d.wpm} WPM
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
  );
}
