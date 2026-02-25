'use client';

interface UsageBarProps {
  label: string;
  used: number;
  limit: number | null;
}

export function UsageBar({ label, used, limit }: UsageBarProps) {
  const isUnlimited = limit === null;
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && used >= limit;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span
          className="text-xs font-mono"
          style={{
            color: isAtLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : 'var(--text-muted)',
          }}
        >
          {used} / {isUnlimited ? '\u221e' : limit}
        </span>
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface-hover)' }}
      >
        {!isUnlimited && (
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: isAtLimit
                ? '#ef4444'
                : isNearLimit
                  ? '#f59e0b'
                  : '#ff5941',
            }}
          />
        )}
        {isUnlimited && (
          <div
            className="h-full rounded-full"
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 89, 65, 0.25)',
            }}
          />
        )}
      </div>
    </div>
  );
}
