'use client';

import { Coins, RefreshCw, ShoppingBag, Gift } from 'lucide-react';
import type { CreditInfo } from '@/hooks/useBilling';
import { CREDIT_COSTS } from '@/config/billing';

interface CreditBalanceProps {
  credits: CreditInfo;
}

const COST_ITEMS = [
  { label: 'Analysis', cost: CREDIT_COSTS.pitchAnalysis },
  { label: 'Deck upload', cost: CREDIT_COSTS.deckUpload },
  { label: 'Q&A session', cost: CREDIT_COSTS.qaSession },
  { label: 'Deck gen', cost: CREDIT_COSTS.deckGeneration },
] as const;

export function CreditBalance({ credits }: CreditBalanceProps) {
  const { monthlyCredits, monthlyCreditsLimit, purchasedCredits, bonusCredits, totalAvailable } = credits;
  const monthlyPct = monthlyCreditsLimit > 0 ? Math.min(100, (monthlyCredits / monthlyCreditsLimit) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Total balance header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.08))' }}
          >
            <Coins size={15} style={{ color: '#ff5941' }} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Credit Balance
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {totalAvailable} credit{totalAvailable !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        <span className="text-2xl font-bold tabular-nums tracking-tight" style={{ color: '#ff5941' }}>
          {totalAvailable}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-color)' }} />

      {/* Credit pools — horizontal row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Monthly */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <RefreshCw size={10} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Monthly
            </span>
          </div>
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {monthlyCredits}
            <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
              /{monthlyCreditsLimit}
            </span>
          </p>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--border-color)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${monthlyPct}%`,
                background: monthlyPct > 66
                  ? '#22c55e'
                  : monthlyPct > 33
                    ? '#ffaa33'
                    : '#ef4444',
              }}
            />
          </div>
        </div>

        {/* Purchased */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ShoppingBag size={10} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Purchased
            </span>
          </div>
          <p className="text-lg font-bold tabular-nums" style={{ color: purchasedCredits > 0 ? '#ff5941' : 'var(--text-primary)' }}>
            {purchasedCredits}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Never expire</p>
        </div>

        {/* Bonus */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Gift size={10} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Bonus
            </span>
          </div>
          <p className="text-lg font-bold tabular-nums" style={{ color: bonusCredits > 0 ? '#ffaa33' : 'var(--text-primary)' }}>
            {bonusCredits}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {bonusCredits > 0 ? 'Limited time' : '—'}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-color)' }} />

      {/* Credit costs — compact inline list */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Credit costs
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {COST_ITEMS.map(({ label, cost }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span
                className="text-[10px] font-semibold tabular-nums"
                style={{ color: cost > 1 ? '#ff5941' : 'var(--text-muted)' }}
              >
                {cost} cr
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
