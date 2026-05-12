'use client';

import { ArrowRight, Coins, TrendingDown } from 'lucide-react';

interface CreditPackCardProps {
  name: string;
  credits: number;
  priceUsd: number;
  isLoading?: boolean;
  onPurchase: () => void;
  /** Highlight as best value */
  isBestValue?: boolean;
}

export function CreditPackCard({ name, credits, priceUsd, isLoading, onPurchase, isBestValue }: CreditPackCardProps) {
  const perCredit = (priceUsd / credits).toFixed(2);
  const savingsPct = Math.round((1 - priceUsd / credits) * 100);

  return (
    <div
      className="relative rounded-xl pt-10 px-4 pb-4 flex flex-col items-center gap-2.5 transition-all duration-300 hover:scale-[1.03] group overflow-hidden"
      style={{
        backgroundColor: isBestValue ? 'rgba(255, 89, 65, 0.04)' : 'var(--bg-surface)',
        border: isBestValue ? '1.5px solid rgba(255, 89, 65, 0.3)' : '1px solid var(--border-color)',
        boxShadow: isBestValue
          ? '0 0 24px rgba(255, 89, 65, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)'
          : '0 2px 8px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Best value badge */}
      {isBestValue && (
        <div
          className="absolute -top-px left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #ff5941, #ffaa33, transparent)' }}
        />
      )}

      {/* Savings badge — absolutely positioned so all cards align */}
      {savingsPct > 0 && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
          style={{
            backgroundColor: savingsPct >= 40 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 170, 51, 0.1)',
            color: savingsPct >= 40 ? '#22c55e' : '#f59e0b',
          }}
        >
          <TrendingDown size={8} />
          Save {savingsPct}%
        </div>
      )}

      {/* Pack name */}
      <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
        {name}
      </p>

      {/* Credits count with coin icon */}
      <div className="flex items-center gap-1.5">
        <div
          className="flex items-center justify-center w-5 h-5 rounded-full"
          style={{ backgroundColor: 'rgba(255, 89, 65, 0.1)' }}
        >
          <Coins size={10} style={{ color: '#ff5941' }} />
        </div>
        <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {credits}
        </span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
          credits
        </span>
      </div>

      {/* Price */}
      <p className="text-lg font-bold" style={{ color: '#ff5941' }}>
        €{priceUsd}
      </p>

      {/* Per-credit cost */}
      <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
        €{perCredit} per credit
      </p>

      {/* Buy button */}
      <button
        onClick={onPurchase}
        disabled={isLoading}
        className="mt-1 w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-50 group-hover:shadow-sm"
        style={{
          background: isBestValue
            ? 'linear-gradient(135deg, #ff5941, #e63b26)'
            : 'rgba(255, 89, 65, 0.08)',
          color: isBestValue ? '#fff' : '#ff5941',
          border: isBestValue ? 'none' : '1px solid rgba(255, 89, 65, 0.15)',
          boxShadow: isBestValue ? '0 2px 8px rgba(255, 89, 65, 0.25)' : 'none',
        }}
      >
        {isLoading ? 'Loading...' : 'Buy Credits'}
        {!isLoading && <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" />}
      </button>
    </div>
  );
}
