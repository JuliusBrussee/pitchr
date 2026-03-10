'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBilling } from '@/hooks/useBilling';
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt';
import { useToast } from '@/views/components/Toast';
import { UpgradePrompt } from '@/views/components/billing';
import {
  SettingsTabBar,
  GeneralTab,
  BillingTab,
  RewardsTab,
} from '@/views/components/settings';
import { PlanHeroBanner } from '@/views/components/settings/PlanHeroBanner';
import type { SettingsTab } from '@/views/components/settings';
import type { BillingPlanId, BillingInterval } from '@/types/billing';

function resolveTab(param: string | null): SettingsTab {
  if (param === 'billing' || param === 'rewards') return param;
  return 'general';
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const billing = useBilling();
  const upgrade = useUpgradePrompt();
  const { toast } = useToast();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const activeTab = resolveTab(searchParams.get('tab'));
  const isFreePlan = billing.subscription?.planId === 'free';

  // Low credit nudge toast (fires once per session)
  useEffect(() => {
    if (!billing.credits || billing.isLoading) return;
    if (billing.credits.totalAvailable === 1 && isFreePlan) {
      toast('warning', 'You have 1 credit left. Upgrade to Pro for 60 credits/month.');
    }
  }, [billing.credits?.totalAvailable, billing.isLoading]);

  const handleTabChange = (tab: SettingsTab) => {
    router.replace(`/settings?tab=${tab}`);
  };

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

  const scrollToBilling = () => {
    router.replace('/settings?tab=billing');
  };

  return (
    <main className="flex-1 overflow-y-auto pr-1">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up" style={{ animationFillMode: 'backwards' }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage your account, plan, and preferences
          </p>
        </div>

        {/* Upgrade Hero Banner (free users, all tabs) */}
        {!billing.isLoading && isFreePlan && (
          <div className="mb-6">
            <PlanHeroBanner
              onUpgrade={() => upgrade.show('milestone')}
              isLoading={isCheckoutLoading}
            />
          </div>
        )}

        {/* Tab Bar */}
        <div className="mb-6">
          <SettingsTabBar active={activeTab} onChange={handleTabChange} />
        </div>

        {/* Active Tab */}
        {activeTab === 'general' && <GeneralTab />}
        {activeTab === 'billing' && <BillingTab />}
        {activeTab === 'rewards' && <RewardsTab />}

        {/* Legal links */}
        <div className="flex items-center gap-3 mt-8 pt-4 text-xs" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/terms" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>
            Terms
          </Link>
          <span>·</span>
          <Link href="/privacy" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>
            Privacy
          </Link>
        </div>

        <div className="h-8" />
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        isOpen={upgrade.isOpen}
        onClose={upgrade.close}
        context={upgrade.context}
        featureName={upgrade.featureName}
        currentPlan={billing.subscription?.planId as BillingPlanId}
        onUpgrade={handleUpgradeCheckout}
        onBuyCredits={scrollToBilling}
        isLoading={isCheckoutLoading}
      />
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
