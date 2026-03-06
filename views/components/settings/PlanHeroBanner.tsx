'use client';

import { Crown, Zap, ChevronRight } from 'lucide-react';

export function PlanHeroBanner({
  onUpgrade,
  isLoading,
}: {
  onUpgrade: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl border overflow-hidden animate-fade-in-up"
      style={{
        background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.06), rgba(255, 170, 51, 0.03), rgba(255, 89, 65, 0.04))',
        borderColor: 'rgba(255, 89, 65, 0.15)',
        animationFillMode: 'backwards',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, #ff5941, #ffaa33, transparent)',
          backgroundSize: '200% 100%',
          animation: 'upgradeShimmer 4s linear infinite',
        }}
      />
      <div className="px-6 py-5 flex items-center gap-5">
        <div
          className="flex items-center justify-center w-14 h-14 rounded-xl flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.08))',
          }}
        >
          <Crown size={24} style={{ color: '#ff5941' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Upgrade to Pro
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            50 analyses/mo, AI deck gen, section feedback, priority queue — everything you need to nail your pitch.
          </p>
        </div>
        <button
          onClick={onUpgrade}
          disabled={isLoading}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex-shrink-0 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #ff5941, #e63b26)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(255, 89, 65, 0.3)',
          }}
        >
          <Zap size={14} fill="#fff" />
          {isLoading ? 'Loading...' : 'Upgrade'}
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
