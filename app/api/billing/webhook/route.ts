import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { constructWebhookEvent } from '@/services/stripeService';
import {
  getUserIdByStripeCustomerId,
  upsertSubscription,
  downgradeToFree,
  isBillingEventProcessed,
  recordBillingEvent,
  resolveSubscriptionPlan,
  purchaseDayPass,
} from '@/services/billingService';
import type { SubscriptionStatus } from '@/types/billing';

/**
 * POST /api/billing/webhook
 * Stripe webhook endpoint. Handles subscription lifecycle events.
 *
 * Must be excluded from body parsing — we need the raw body for
 * signature verification.
 */
export const runtime = 'nodejs';

// Disable Next.js body parsing so we get the raw body
export const dynamic = 'force-dynamic';

const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('[billing/webhook] signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 },
    );
  }

  // Skip events we don't handle
  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  // Idempotency: skip if already processed
  const alreadyProcessed = await isBillingEventProcessed(admin, event.id);
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(admin, event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(admin, event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(admin, event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(admin, event.data.object);
        break;

      default:
        break;
    }

    // Record only after successful handling so Stripe retries
    // are not blocked if the handler threw.
    await recordBillingEvent(
      admin,
      event.id,
      event.type,
      event.data.object as unknown as Record<string, unknown>,
    );
  } catch (err) {
    console.error(`[billing/webhook] error processing ${event.type}:`, err);
    // Return 500 so Stripe will retry this event
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

/* ——— Event Handlers ——— */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCheckoutCompleted(admin: ReturnType<typeof createAdminClient>, session: any) {
  const customerId = session.customer as string;

  // Handle day pass one-time payments
  if (session.mode === 'payment' && session.metadata?.product_type === 'day_pass') {
    const userId = session.metadata?.user_id ?? await getUserIdByStripeCustomerId(admin, customerId);
    if (!userId) {
      console.error('[billing/webhook] no user found for day pass payment:', customerId);
      return;
    }

    const paymentIntentId = session.payment_intent as string | null;
    await purchaseDayPass(admin, userId, paymentIntentId);

    console.log('[billing/webhook] day pass activated', { userId });
    return;
  }

  // Handle subscription checkout
  const subscriptionId = session.subscription as string;
  if (!customerId || !subscriptionId) return;

  const userId = await getUserIdByStripeCustomerId(admin, customerId);
  if (!userId) {
    console.error('[billing/webhook] no user found for customer:', customerId);
    return;
  }

  // The subscription.created/updated event will handle the actual upsert.
  // Checkout completion is mainly for logging.
  console.log('[billing/webhook] checkout completed', {
    userId,
    subscriptionId,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionChange(admin: ReturnType<typeof createAdminClient>, sub: any) {
  const customerId = sub.customer as string;
  if (!customerId) return;

  const userId = await getUserIdByStripeCustomerId(admin, customerId);
  if (!userId) {
    console.error('[billing/webhook] no user found for customer:', customerId);
    return;
  }

  const priceId = sub.items?.data?.[0]?.price?.id ?? null;
  const planId = resolveSubscriptionPlan(priceId);

  const statusMap: Record<string, SubscriptionStatus> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
  };

  const status: SubscriptionStatus = statusMap[sub.status] ?? 'active';

  await upsertSubscription(admin, {
    userId,
    planId,
    status,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    trialEnd: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
  });

  console.log('[billing/webhook] subscription updated', {
    userId,
    planId,
    status,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(admin: ReturnType<typeof createAdminClient>, sub: any) {
  const customerId = sub.customer as string;
  if (!customerId) return;

  const userId = await getUserIdByStripeCustomerId(admin, customerId);
  if (!userId) return;

  await downgradeToFree(admin, userId);

  console.log('[billing/webhook] subscription deleted, downgraded to free', {
    userId,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(admin: ReturnType<typeof createAdminClient>, invoice: any) {
  const customerId = invoice.customer as string;
  if (!customerId) return;

  const userId = await getUserIdByStripeCustomerId(admin, customerId);
  if (!userId) return;

  // Mark as past_due — the subscription.updated event may also fire
  const sub = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (sub.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Supabase client (no Database generic)
    const { error } = await (admin as any)
      .from('subscriptions')
      .update({ status: 'past_due', updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('[billing/webhook] failed to mark subscription past_due:', error.message);
      throw new Error(`Failed to update subscription status: ${error.message}`);
    }
  }

  console.log('[billing/webhook] payment failed', { userId });
}
