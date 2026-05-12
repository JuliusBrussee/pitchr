'use client';

const TIME_RANGES = ['7D', '30D', '90D', 'All'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export type { TimeRange };

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div
      className="flex rounded-xl p-1 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      {TIME_RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          style={{
            backgroundColor: value === r ? 'var(--bg-surface-hover)' : 'transparent',
            color: value === r ? 'var(--text-primary)' : 'var(--text-muted)',
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
