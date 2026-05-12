import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrCreateSubscription, getUsage, getActiveDayPass } from '@/services/billingService';
import { getOrCreateCreditBalance } from '@/services/creditService';
import { getPlan, getPlanLimits } from '@/config/billing';

/**
 * GET /api/billing/subscription
 * Returns the current user's subscription + usage summary + active day pass.
 */
export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();
    const [subscription, usage, dayPass] = await Promise.all([
      getOrCreateSubscription(admin, user.id),
      getUsage(admin, user.id),
      getActiveDayPass(admin, user.id),
    ]);

    const credits = await getOrCreateCreditBalance(admin, user.id, subscription.planId);

    // If day pass is active, show its limits instead of subscription limits
    const effectivePlanId = dayPass ? 'day_pass' : subscription.planId;
    const plan = getPlan(effectivePlanId);
    const limits = getPlanLimits(effectivePlanId);

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
        runsUsed: dayPass ? dayPass.runsUsed : usage.runsUsed,
        runsLimit: limits.runsPerPeriod,
        decksUsed: dayPass ? dayPass.decksUsed : usage.decksUsed,
        decksLimit: limits.decksPerPeriod,
        qaSecondsUsed: dayPass ? dayPass.qaSecondsUsed : usage.qaSecondsUsed,
        qaSecondsLimit: limits.qaSecondsPerPeriod,
        periodStart: usage.periodStart,
        periodEnd: usage.periodEnd,
      },
      limits,
      dayPass: dayPass
        ? {
            id: dayPass.id,
            expiresAt: dayPass.expiresAt,
            runsUsed: dayPass.runsUsed,
            runsLimit: dayPass.runsLimit,
          }
        : null,
      credits,
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
