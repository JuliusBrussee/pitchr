import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrCreateSubscription, getUsage } from '@/services/billingService';
import { getPlan } from '@/config/billing';

/**
 * GET /api/billing/subscription
 * Returns the current user's subscription + usage summary.
 */
export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();
    const subscription = await getOrCreateSubscription(admin, user.id);
    const usage = await getUsage(admin, user.id);
    const plan = getPlan(subscription.planId);

    return NextResponse.json({
      subscription: {
        planId: subscription.planId,
        planName: plan.name,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        hasStripeSubscription: !!subscription.stripeSubscriptionId,
      },
      usage: {
        runsUsed: usage.runsUsed,
        runsLimit: plan.limits.runsPerPeriod,
        decksUsed: usage.decksUsed,
        decksLimit: plan.limits.decksPerPeriod,
        qaSessionsUsed: usage.qaSessionsUsed,
        qaSessionsLimit: plan.limits.qaSessionsPerPeriod,
        periodStart: usage.periodStart,
        periodEnd: usage.periodEnd,
      },
      limits: plan.limits,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 },
    );
  }
}
