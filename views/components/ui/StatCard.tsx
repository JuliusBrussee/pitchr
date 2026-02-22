'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta?: string;
  deltaDirection?: 'up' | 'down';
  deltaIsGood?: boolean;
  animationDelay?: string;
  poweredByPaid?: boolean;
}

export function StatCard({
  label,
  value,
  icon,
  delta,
  deltaDirection,
  deltaIsGood,
  animationDelay,
  poweredByPaid,
}: StatCardProps) {
  const isPositive = deltaDirection === 'up';
  const isGood = deltaIsGood !== undefined ? deltaIsGood : isPositive;

  return (
    <div
      className="rounded-2xl border p-4 animate-fade-in-up relative"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
        ...(animationDelay ? { animationDelay, animationFillMode: 'both' as const } : {}),
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </span>
        {delta && deltaDirection && (
          <span
            className="flex items-center gap-0.5 text-xs font-semibold mb-0.5"
            style={{ color: isGood ? '#22c55e' : '#ef4444' }}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta}
          </span>
        )}
      </div>
      {poweredByPaid && (
        <div
          className="absolute bottom-2 right-3 flex items-center gap-1.5 opacity-40"
        >
          <img
            src="/paid-logo-icon.png"
            alt="Paid AI"
            className="w-6 h-7 object-contain"
          />
          <span
            className="text-[18px] font-medium tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            Paid
          </span>
        </div>
      )}
    </div>
  );
}
