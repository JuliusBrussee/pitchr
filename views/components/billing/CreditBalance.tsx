'use client';

import { Coins, RefreshCw, ShoppingBag, Gift, Zap } from 'lucide-react';
import type { CreditInfo } from '@/hooks/useBilling';
import { CREDIT_COSTS } from '@/config/billing';

interface CreditBalanceProps {
  credits: CreditInfo;
}

const COST_ITEMS = [
  { label: 'Analysis', cost: CREDIT_COSTS.pitchAnalysis, icon: Zap },
  { label: 'Deck upload', cost: CREDIT_COSTS.deckUpload, icon: Zap },
  { label: 'Q&A session', cost: CREDIT_COSTS.qaSession, icon: Zap },
  { label: 'Deck gen', cost: CREDIT_COSTS.deckGeneration, icon: Zap },
] as const;

export function CreditBalance({ credits }: CreditBalanceProps) {
  const { monthlyCredits, monthlyCreditsLimit, purchasedCredits, bonusCredits, totalAvailable } = credits;
  const monthlyPct = monthlyCreditsLimit > 0 ? Math.min(100, (monthlyCredits / monthlyCreditsLimit) * 100) : 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface-hover)',
      }}
    >
      {/* Header with total */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.06), rgba(255, 170, 51, 0.04))',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.15), rgba(255, 170, 51, 0.1))' }}
          >
            <Coins size={13} style={{ color: '#ff5941' }} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
              Credit Balance
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-extrabold tracking-tight" style={{ color: '#ff5941' }}>
            {totalAvailable}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
            available
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Credit pools */}
        <div className="grid grid-cols-3 gap-2">
          {/* Monthly pool */}
          <div
            className="rounded-lg p-2.5 text-center"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <RefreshCw size={9} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Monthly
              </span>
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {monthlyCredits}
              <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>/{monthlyCreditsLimit}</span>
            </p>
            {/* Mini progress bar */}
            <div
              className="h-1 rounded-full mt-1.5 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-surface-hover)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${monthlyPct}%`,
                  background: monthlyPct > 66
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : monthlyPct > 33
                      ? 'linear-gradient(90deg, #ffaa33, #f59e0b)'
                      : 'linear-gradient(90deg, #ef4444, #dc2626)',
                }}
              />
            </div>
          </div>

          {/* Purchased pool */}
          <div
            className="rounded-lg p-2.5 text-center"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <ShoppingBag size={9} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Purchased
              </span>
            </div>
            <p className="text-sm font-bold" style={{ color: purchasedCredits > 0 ? '#ff5941' : 'var(--text-primary)' }}>
              {purchasedCredits}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Never expire
            </p>
          </div>

          {/* Bonus pool */}
          <div
            className="rounded-lg p-2.5 text-center"
            style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gift size={9} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Bonus
              </span>
            </div>
            <p className="text-sm font-bold" style={{ color: bonusCredits > 0 ? '#ffaa33' : 'var(--text-primary)' }}>
              {bonusCredits}
            </p>
            <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {bonusCredits > 0 ? 'Limited time' : '—'}
            </p>
          </div>
        </div>

        {/* Credit costs */}
        <div
          className="rounded-lg p-2.5"
          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-muted)' }}>
            Credit costs
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {COST_ITEMS.map(({ label, cost }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: cost > 1 ? 'rgba(255, 89, 65, 0.08)' : 'var(--bg-surface-hover)',
                    color: cost > 1 ? '#ff5941' : 'var(--text-primary)',
                  }}
                >
                  {cost} cr
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
