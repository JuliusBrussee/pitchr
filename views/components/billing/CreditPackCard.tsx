'use client';

import { ArrowRight } from 'lucide-react';

interface CreditPackCardProps {
  name: string;
  credits: number;
  priceUsd: number;
  isLoading?: boolean;
  onPurchase: () => void;
}

export function CreditPackCard({ name, credits, priceUsd, isLoading, onPurchase }: CreditPackCardProps) {
  const perCredit = (priceUsd / credits).toFixed(2);

  return (
    <div
      className="rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {name}
      </p>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {credits} <span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>credits</span>
      </p>
      <p className="text-lg font-semibold" style={{ color: '#ff5941' }}>
        ${priceUsd}
      </p>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        ${perCredit}/credit
      </p>
      <button
        onClick={onPurchase}
        disabled={isLoading}
        className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50"
        style={{
          backgroundColor: 'rgba(255, 89, 65, 0.1)',
          color: '#ff5941',
          border: '1px solid rgba(255, 89, 65, 0.2)',
        }}
      >
        {isLoading ? 'Loading...' : 'Buy'}
        {!isLoading && <ArrowRight size={12} />}
      </button>
    </div>
  );
}
