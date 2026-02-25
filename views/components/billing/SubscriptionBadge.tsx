'use client';

import type { BillingPlanId } from '@/types/billing';

interface SubscriptionBadgeProps {
  planId: BillingPlanId;
  status: string;
  cancelAtPeriodEnd: boolean;
}

const PLAN_COLORS: Record<BillingPlanId, { bg: string; text: string }> = {
  free: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' },
  pro: { bg: 'rgba(255, 89, 65, 0.12)', text: '#ff5941' },
  team: { bg: 'rgba(139, 92, 246, 0.12)', text: '#8b5cf6' },
};

export function SubscriptionBadge({
  planId,
  status,
  cancelAtPeriodEnd,
}: SubscriptionBadgeProps) {
  const colors = PLAN_COLORS[planId];
  const label = planId.charAt(0).toUpperCase() + planId.slice(1);

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
        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {label}
      </span>
      {statusLabel && (
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
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
