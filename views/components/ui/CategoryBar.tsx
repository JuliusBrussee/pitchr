'use client';

interface CategoryBarProps {
  label: string;
  score: number;
  maxScore: number;
  color: string;
  delay?: number;
}

export function CategoryBar({ label, score, maxScore, color, delay = 0 }: CategoryBarProps) {
  const pct = (score / maxScore) * 100;

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-sm font-medium w-40 flex-shrink-0 truncate"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-2.5 rounded-full overflow-hidden relative"
        style={{ backgroundColor: 'var(--border-color)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transitionDelay: `${delay * 80}ms`,
          }}
        />
      </div>
      <span
        className="text-sm font-bold tabular-nums w-12 text-right"
        style={{ color: 'var(--text-primary)' }}
      >
        {score.toFixed(1)}/{maxScore}
      </span>
    </div>
  );
}
