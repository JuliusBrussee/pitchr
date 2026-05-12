'use client';

import { Lock, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  requiredPlan?: 'day_pass' | 'pro';
  compact?: boolean;
}

export function UpgradePrompt({
  feature,
  description,
  requiredPlan = 'pro',
  compact = false,
}: UpgradePromptProps) {
  const planLabel = requiredPlan === 'pro' ? 'Pro' : 'Day Pass';

  if (compact) {
    return (
      <Link
        href="/billing"
        className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
        style={{ color: '#ff5941' }}
      >
        <Lock size={12} />
        <span>Upgrade to {planLabel}</span>
        <ArrowRight size={12} />
      </Link>
    );
  }

  return (
    <div
      className="rounded-xl p-5 text-center"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid rgba(255, 89, 65, 0.2)',
      }}
    >
      <div
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.12), rgba(255, 170, 51, 0.08))',
        }}
      >
        <Lock size={18} style={{ color: '#ff5941' }} />
      </div>

      <h4
        className="text-sm font-bold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {feature}
      </h4>

      {description && (
        <p
          className="text-xs mb-4 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {description}
        </p>
      )}

      <Link
        href="/billing"
        className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #ff5941, #e63b26)',
          boxShadow: '0 4px 16px rgba(255, 89, 65, 0.3)',
        }}
      >
        <Zap size={14} fill="#fff" />
        Upgrade to {planLabel}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
