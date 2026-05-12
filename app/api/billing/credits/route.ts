import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getOrCreateCreditBalance,
  getCreditPacks,
  getTransactionHistory,
  getCreditPackBySlug,
} from '@/services/creditService';
import { getOrCreateSubscription, getOrCreateStripeCustomer } from '@/services/billingService';
import { createPaymentCheckoutSession } from '@/services/stripeService';
import { buildBillingRedirectUrl } from '@/lib/billing/redirect';
import { enforceBillingAntiAbuse } from '@/lib/billing/antiAbuse';
import { CREDIT_PACKS_STATIC } from '@/config/billing';

/**
 * GET /api/billing/credits
 * Returns the user's credit balance, available packs, and recent transactions.
 */
export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const sub = await getOrCreateSubscription(admin, user.id);
    const [balance, packs, transactions] = await Promise.all([
      getOrCreateCreditBalance(admin, user.id, sub.planId),
      getCreditPacks(admin),
      getTransactionHistory(admin, user.id, 10),
    ]);

    return NextResponse.json({
      balance,
      packs: packs.length > 0 ? packs : CREDIT_PACKS_STATIC,
      transactions,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/billing/credits
 * Starts a Stripe checkout for a credit pack purchase.
 * Body: { packSlug: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const body = await request.json();
    const packSlug = body?.packSlug;

    if (!packSlug || typeof packSlug !== 'string') {
      return NextResponse.json(
        { error: 'packSlug is required' },
        { status: 400 },
      );
    }

    const antiAbuseResponse = await enforceBillingAntiAbuse({
      request,
      userId: user.id,
      action: 'credits',
      idempotencyScope: `pack:${packSlug}`,
    });
    if (antiAbuseResponse) {
      return antiAbuseResponse;
    }

    const pack = await getCreditPackBySlug(admin, packSlug);
    if (!pack) {
      return NextResponse.json(
        { error: 'Credit pack not found' },
        { status: 404 },
      );
    }

    // Use the pack's Stripe Price ID, falling back to static config
    const stripePriceId = pack.stripePriceId
      ?? CREDIT_PACKS_STATIC.find((p) => p.slug === packSlug)?.stripePriceId;

    if (!stripePriceId) {
      return NextResponse.json(
        { error: 'Credit pack not configured for purchase yet' },
        { status: 400 },
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'Email required for purchases' },
        { status: 400 },
      );
    }

    const customerId = await getOrCreateStripeCustomer(
      admin,
      user.id,
      user.email,
    );

    const origin = request.headers.get('origin');

    const session = await createPaymentCheckoutSession({
      customerId,
      priceId: stripePriceId,
      successUrl: buildBillingRedirectUrl(
        { origin },
        '/settings?tab=billing&credits=success',
      ),
      cancelUrl: buildBillingRedirectUrl(
        { origin },
        '/settings?tab=billing',
      ),
      metadata: {
        product_type: 'credit_pack',
        pack_slug: packSlug,
        pack_credits: String(pack.credits),
        user_id: user.id,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[billing/credits] checkout error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to start credit pack checkout' },
      { status: 500 },
    );
  }
}
