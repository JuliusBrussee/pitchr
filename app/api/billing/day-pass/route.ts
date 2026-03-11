import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { getActiveDayPass, getOrCreateStripeCustomer } from '@/services/billingService';
import { createPaymentCheckoutSession } from '@/services/stripeService';
import { buildBillingRedirectUrl } from '@/lib/billing/redirect';
import { enforceBillingAntiAbuse } from '@/lib/billing/antiAbuse';
import { BILLING_PLANS } from '@/config/billing';

/**
 * POST /api/billing/day-pass
 * Creates a Stripe one-time payment Checkout Session for a Day Pass.
 *
 * Returns: { url: string, sessionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const antiAbuseResponse = await enforceBillingAntiAbuse({
      request,
      userId: user.id,
      action: 'day-pass',
      idempotencyScope: 'day-pass',
    });
    if (antiAbuseResponse) {
      return antiAbuseResponse;
    }

    // Check if user already has an active day pass
    const existingPass = await getActiveDayPass(admin, user.id);
    if (existingPass) {
      return NextResponse.json(
        { error: 'You already have an active Day Pass.', expiresAt: existingPass.expiresAt },
        { status: 409 },
      );
    }

    const plan = BILLING_PLANS.day_pass;
    const priceId = plan.pricing.stripePriceIdMonthly;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Day Pass Stripe Price ID not configured.' },
        { status: 400 },
      );
    }

    const customerId = await getOrCreateStripeCustomer(
      admin,
      user.id,
      user.email!,
      user.user_metadata?.full_name,
    );

    const origin = request.headers.get('origin');

    const session = await createPaymentCheckoutSession({
      customerId,
      priceId,
      successUrl: buildBillingRedirectUrl(
        { origin },
        '/settings?tab=billing&billing=day-pass-success',
      ),
      cancelUrl: buildBillingRedirectUrl(
        { origin },
        '/settings?tab=billing&billing=canceled',
      ),
      metadata: {
        user_id: user.id,
        product_type: 'day_pass',
      },
    });

    return NextResponse.json({ url: session.url!, sessionId: session.id });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[billing/day-pass] error:', message, error);
    return NextResponse.json(
      { error: `Failed to create day pass checkout: ${message}` },
      { status: 500 },
    );
  }
}

/**
 * GET /api/billing/day-pass
 * Returns the user's active day pass (if any).
 */
export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const pass = await getActiveDayPass(admin, user.id);

    return NextResponse.json({ dayPass: pass });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[billing/day-pass] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch day pass status' },
      { status: 500 },
    );
  }
}
