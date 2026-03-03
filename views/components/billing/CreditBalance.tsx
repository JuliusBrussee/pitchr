'use client';

import type { CreditInfo } from '@/hooks/useBilling';
import { CREDIT_COSTS } from '@/config/billing';

interface CreditBalanceProps {
  credits: CreditInfo;
}

export function CreditBalance({ credits }: CreditBalanceProps) {
  const { monthlyCredits, monthlyCreditsLimit, purchasedCredits, bonusCredits, totalAvailable } = credits;
  const monthlyPct = monthlyCreditsLimit > 0 ? Math.min(100, (monthlyCredits / monthlyCreditsLimit) * 100) : 0;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-surface-hover)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Credits
        </p>
        <span className="text-sm font-bold" style={{ color: '#ff5941' }}>
          {totalAvailable} available
        </span>
      </div>

      {/* Monthly credits progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            Monthly ({monthlyCredits}/{monthlyCreditsLimit})
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${monthlyPct}%`,
              backgroundColor: monthlyPct > 80 ? '#22c55e' : monthlyPct > 30 ? '#ffaa33' : '#ef4444',
            }}
          />
        </div>
      </div>

      {/* Purchased & bonus credits */}
      <div className="flex items-center gap-4 mt-2">
        {purchasedCredits > 0 && (
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            Purchased: <strong style={{ color: 'var(--text-primary)' }}>{purchasedCredits}</strong>
          </span>
        )}
        {bonusCredits > 0 && (
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            Bonus: <strong style={{ color: 'var(--text-primary)' }}>{bonusCredits}</strong>
          </span>
        )}
      </div>

      {/* Credit costs legend */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
        <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
          Credit costs
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            Analysis: {CREDIT_COSTS.pitchAnalysis}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            Deck upload: {CREDIT_COSTS.deckUpload}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            Q&A: {CREDIT_COSTS.qaSession}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            Deck gen: {CREDIT_COSTS.deckGeneration}
          </span>
        </div>
      </div>
    </div>
  );
}
