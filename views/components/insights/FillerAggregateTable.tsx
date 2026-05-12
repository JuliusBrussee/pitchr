'use client';

export function FillerAggregateTable({ data }: { data: { word: string; total: number }[] }) {
  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const topItems = data.slice(0, 8);

  return (
    <div className="pt-2 pl-4">
      <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        Most Used Filler Words
      </h4>
      {topItems.length === 0 ? (
        <div className="flex items-center justify-center h-[140px] sm:h-[180px]">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No filler words detected</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {topItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="text-xs font-mono font-medium shrink-0"
                style={{ color: 'var(--text-primary)', width: 72 }}
              >
                &ldquo;{item.word}&rdquo;
              </span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.total / maxTotal) * 100}%`,
                    backgroundColor: '#f59e0b',
                    opacity: 0.8,
                  }}
                />
              </div>
              <span
                className="text-[11px] font-bold tabular-nums shrink-0"
                style={{ color: 'var(--text-secondary)', width: 24, textAlign: 'right' }}
              >
                {item.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
