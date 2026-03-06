'use client';

import { useState } from 'react';
import {
  CreditCard,
  ExternalLink,
  Crown,
  Coins,
} from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';
import { useToast } from '@/views/components/Toast';
import {
  SubscriptionBadge,
  UsageBar,
  PlanCard,
  CreditBalance,
  CreditPackCard,
} from '@/views/components/billing';
import { getAllPlans, CREDIT_PACKS_STATIC } from '@/config/billing';
import type { BillingPlanId, BillingInterval } from '@/types/billing';
import { SectionCard } from './SectionCard';

export function BillingTab() {
  const billing = useBilling();
  const { toast } = useToast();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isCreditPackLoading, setIsCreditPackLoading] = useState(false);

  const handleUpgradeCheckout = async (planId: BillingPlanId, interval: BillingInterval) => {
    try {
      setIsCheckoutLoading(true);
      await billing.startCheckout(planId, interval);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Plan & Billing */}
      <SectionCard icon={CreditCard} title="Plan & Billing" delay={0} id="billing" iconColor="#ff5941">
        {billing.isLoading ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <div
              className="w-4 h-4 rounded-full animate-pulse"
              style={{ backgroundColor: 'rgba(255, 89, 65, 0.3)' }}
            />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading your plan...</p>
          </div>
        ) : billing.subscription ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SubscriptionBadge
                  planId={billing.subscription.planId as BillingPlanId}
                  status={billing.subscription.status}
                  cancelAtPeriodEnd={billing.subscription.cancelAtPeriodEnd}
                />
                {billing.usage && (
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {new Date(billing.usage.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' \u2014 '}
                    {new Date(billing.usage.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              {billing.subscription.hasStripeSubscription && (
                <button
                  onClick={() => billing.openPortal()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <ExternalLink size={12} />
                  Manage
                </button>
              )}
            </div>
            {billing.usage && (
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Usage This Period
                </p>
                <UsageBar label="Pitch Analyses" used={billing.usage.runsUsed} limit={billing.usage.runsLimit} />
                <UsageBar label="Deck Uploads" used={billing.usage.decksUsed} limit={billing.usage.decksLimit} />
                <UsageBar label="Q&A Time (seconds)" used={billing.usage.qaSecondsUsed} limit={billing.usage.qaSecondsLimit} />
              </div>
            )}
            {billing.credits && (
              <CreditBalance credits={billing.credits} />
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Unable to load billing information.
            </p>
            <button
              onClick={() => billing.refresh()}
              className="mt-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ color: '#ff5941', backgroundColor: 'rgba(255, 89, 65, 0.08)' }}
            >
              Retry
            </button>
          </div>
        )}
      </SectionCard>

      {/* Credit Packs */}
      {billing.subscription && (
        <SectionCard icon={Coins} title="Buy Credits" delay={40} id="credits" iconColor="#ffaa33">
          <div className="grid grid-cols-2 gap-3">
            {CREDIT_PACKS_STATIC.map((pack) => (
              <CreditPackCard
                key={pack.slug}
                name={pack.name}
                credits={pack.credits}
                priceUsd={pack.priceUsd}
                isLoading={isCreditPackLoading}
                isBestValue={pack.slug === 'marathon'}
                onPurchase={async () => {
                  try {
                    setIsCreditPackLoading(true);
                    await billing.purchaseCreditPack(pack.slug);
                  } catch (err) {
                    toast('error', err instanceof Error ? err.message : 'Purchase failed');
                  } finally {
                    setIsCreditPackLoading(false);
                  }
                }}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Choose Plan */}
      {billing.subscription && (
        <SectionCard icon={Crown} title="Choose Your Plan" delay={80} id="plans" iconColor="#ff5941">
          <div className="flex items-center justify-center gap-1 mb-4">
            <div
              className="inline-flex items-center rounded-full p-1 gap-0.5"
              style={{
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                onClick={() => setBillingInterval('month')}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  backgroundColor: billingInterval === 'month' ? 'var(--bg-primary)' : 'transparent',
                  color: billingInterval === 'month' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: billingInterval === 'month' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5"
                style={{
                  backgroundColor: billingInterval === 'year' ? 'var(--bg-primary)' : 'transparent',
                  color: billingInterval === 'year' ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: billingInterval === 'year' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                Yearly
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}
                >
                  -17%
                </span>
              </button>
            </div>
          </div>
          <div className="pricing-grid grid gap-4 items-stretch">
            {getAllPlans().filter((p) => p.id !== 'day_pass').map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                interval={billingInterval}
                currentPlanId={billing.subscription!.planId as BillingPlanId}
                isLoading={isCheckoutLoading}
                onSelect={handleUpgradeCheckout}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 pt-4">
            <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Secure checkout
            </span>
            <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Powered by Stripe
            </span>
            <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              Cancel anytime
            </span>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
