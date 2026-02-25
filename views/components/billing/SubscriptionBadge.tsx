'use client';

import { Crown, Zap } from 'lucide-react';
import type { BillingPlanId } from '@/types/billing';

interface SubscriptionBadgeProps {
  planId: BillingPlanId;
  status: string;
  cancelAtPeriodEnd: boolean;
}

const PLAN_COLORS: Record<BillingPlanId, { bg: string; text: string; icon: React.ReactNode }> = {
  free: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af', icon: null },
  day_pass: { bg: 'rgba(255, 170, 51, 0.12)', text: '#f59e0b', icon: <Zap size={12} fill="#f59e0b" /> },
  pro: { bg: 'rgba(255, 89, 65, 0.12)', text: '#ff5941', icon: <Crown size={12} style={{ color: '#ff5941' }} /> },
};

const PLAN_LABELS: Record<BillingPlanId, string> = {
  free: 'Free',
  day_pass: 'Day Pass',
  pro: 'Pro',
};

export function SubscriptionBadge({
  planId,
  status,
  cancelAtPeriodEnd,
}: SubscriptionBadgeProps) {
  const colors = PLAN_COLORS[planId];
  const label = PLAN_LABELS[planId];

  let statusLabel = '';
  if (cancelAtPeriodEnd) {
    statusLabel = 'Canceling';
  } else if (status === 'trialing') {
    statusLabel = 'Trial';
  } else if (status === 'past_due') {
    statusLabel = 'Past Due';
  } else if (status === 'canceled') {
    statusLabel = 'Canceled';
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {colors.icon}
        {label}
      </span>
      {statusLabel && (
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor:
              status === 'past_due'
                ? 'rgba(239, 68, 68, 0.12)'
                : 'rgba(245, 158, 11, 0.12)',
            color: status === 'past_due' ? '#ef4444' : '#f59e0b',
          }}
        >
          {statusLabel}
        </span>
      )}
    </div>
  );
}
