'use client';

import { Snowflake, ShieldAlert, Crown } from 'lucide-react';

/* ——— Props ——— */

interface StreakFreezeButtonProps {
  freezesRemaining: number;
  streakAtRisk: boolean;
  onUseFreeze: () => void;
  isPro: boolean;
}

/* ——— Component ——— */

export function StreakFreezeButton({
  freezesRemaining,
  streakAtRisk,
  onUseFreeze,
  isPro,
}: StreakFreezeButtonProps) {
  // If streak is not at risk, show a compact freeze count indicator
  if (!streakAtRisk) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
        }}
      >
        <Snowflake
          size={14}
          style={{ color: freezesRemaining > 0 ? '#3b82f6' : 'var(--text-muted)' }}
        />
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {freezesRemaining} streak freeze{freezesRemaining !== 1 ? 's' : ''} available
        </span>
      </div>
    );
  }

  // Streak is at risk
  return (
    <div
      className="rounded-xl border p-3 flex flex-col gap-2.5"
      style={{
        backgroundColor: '#ff59410a',
        borderColor: '#ff594130',
      }}
    >
      {/* Warning header */}
      <div className="flex items-center gap-2">
        <ShieldAlert size={14} style={{ color: '#ff5941' }} />
        <span
          className="text-xs font-bold"
          style={{ color: '#ff5941' }}
        >
          Streak at risk!
        </span>
      </div>

      {freezesRemaining > 0 ? (
        <>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            You missed a day. Use a streak freeze to keep your streak alive.
          </p>
          <button
            onClick={onUseFreeze}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-0 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#3b82f6',
              color: '#fff',
            }}
          >
            <Snowflake size={14} />
            Use Freeze ({freezesRemaining} remaining)
          </button>
        </>
      ) : (
        <>
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isPro
              ? 'No freezes remaining. Complete a pitch today to continue your streak.'
              : 'No freezes remaining. Upgrade to Pro for streak freezes.'}
          </p>
          {!isPro && (
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-0 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #ff5941, #ffaa33)',
                color: '#fff',
              }}
            >
              <Crown size={14} />
              Get more with Pro
            </button>
          )}
        </>
      )}
    </div>
  );
}
