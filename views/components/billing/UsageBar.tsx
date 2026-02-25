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
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span
          className="text-[13px] font-mono font-semibold tabular-nums"
          style={{
            color: isAtLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : 'var(--text-muted)',
          }}
        >
          {used}{' '}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/</span>{' '}
          {isUnlimited ? '\u221e' : limit}
        </span>
      </div>

      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface-hover)' }}
      >
        {!isUnlimited && (
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.max(percentage, 2)}%`,
              background: isAtLimit
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : isNearLimit
                  ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                  : 'linear-gradient(90deg, #ff5941, #ff7a5c)',
            }}
          />
        )}
        {isUnlimited && (
          <div
            className="h-full rounded-full"
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, rgba(255, 89, 65, 0.2), rgba(255, 89, 65, 0.1))',
            }}
          />
        )}
      </div>
    </div>
  );
}
