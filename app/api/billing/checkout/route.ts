import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { startCheckout } from '@/services/billingService';
import { BILLING_PLANS, isValidPlanId } from '@/config/billing';
import type { BillingInterval } from '@/types/billing';

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout Session and returns the URL.
 *
 * Body: { planId: 'day_pass' | 'pro', interval: 'month' | 'year' }
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const body = await request.json();

    const { planId, interval } = body as {
      planId?: string;
      interval?: string;
    };

    if (!planId || !isValidPlanId(planId) || planId === 'free') {
      return NextResponse.json(
        { error: 'Invalid planId. Must be "day_pass" or "pro".' },
        { status: 400 },
      );
    }

    // Day pass uses its own one-time payment route
    if (planId === 'day_pass') {
      return NextResponse.json(
        { error: 'Use POST /api/billing/day-pass for day pass purchases.' },
        { status: 400 },
      );
    }

    if (interval !== 'month' && interval !== 'year') {
      return NextResponse.json(
        { error: 'Invalid interval. Must be "month" or "year".' },
        { status: 400 },
      );
    }

    const plan = BILLING_PLANS[planId];
    const priceId =
      (interval as BillingInterval) === 'year'
        ? plan.pricing.stripePriceIdYearly
        : plan.pricing.stripePriceIdMonthly;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe Price ID not configured for this plan/interval.' },
        { status: 400 },
      );
    }

    const origin = request.headers.get('origin') ?? '';
    const admin = createAdminClient();

    const result = await startCheckout(admin, {
      userId: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name,
      priceId,
      successUrl: `${origin}/settings?billing=success`,
      cancelUrl: `${origin}/settings?billing=canceled`,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[billing/checkout] error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
