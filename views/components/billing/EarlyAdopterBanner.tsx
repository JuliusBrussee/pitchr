'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { EARLY_ADOPTER_CREDITS } from '@/config/early-adopter';
import { useEarlyAdopter } from '@/hooks/useEarlyAdopter';

const DISMISS_KEY = 'pitchr_early_adopter_banner_dismissed';

export function EarlyAdopterBanner() {
  const { isActive, claimed, isLoading, daysRemaining } = useEarlyAdopter();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  // Only show when period is active, credits were claimed, and not dismissed
  if (!isActive || !claimed || isLoading || dismissed) return null;

  const totalDays = 31; // March 13 → April 13
  const progressPct = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div
      className="relative rounded-xl border p-4 animate-fade-in-up overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)',
        borderColor: 'rgba(245,158,11,0.2)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}
        >
          <Sparkles size={16} style={{ color: '#f59e0b' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
              Early Adopter
            </span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(245,158,11,0.12)',
                color: '#f59e0b',
              }}
            >
              {daysRemaining}d left
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {EARLY_ADOPTER_CREDITS} bonus credits active — you&apos;re one of our first users!
          </p>

          {/* Progress bar */}
          <div
            className="h-1 rounded-full mt-2.5 overflow-hidden"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-md transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
