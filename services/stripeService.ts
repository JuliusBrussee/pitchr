import Stripe from 'stripe';

/* ——————————————————————————————————————————————————————————
 * Stripe Service
 *
 * Thin wrapper around the Stripe SDK.
 * All Stripe API calls go through here so the rest of the
 * codebase never imports Stripe directly.
 * —————————————————————————————————————————————————————————— */

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable.');
  }

  stripeInstance = new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });

  return stripeInstance;
}

/* ——— Customer Management ——— */

export async function createCustomer(params: {
  email: string;
  userId: string;
  name?: string;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: { supabase_user_id: params.userId },
  });
}

export async function getCustomer(customerId: string): Promise<Stripe.Customer | null> {
  const stripe = getStripe();
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer as Stripe.Customer;
  } catch {
    return null;
  }
}

/* ——— Checkout Sessions ——— */

export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    subscription_data: params.trialPeriodDays
      ? { trial_period_days: params.trialPeriodDays }
      : undefined,
    allow_promotion_codes: true,
  });
}

/**
 * Create a one-time payment checkout session (e.g. for day passes).
 * Uses Stripe `mode: 'payment'` instead of `mode: 'subscription'`.
 */
export async function createPaymentCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'payment',
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    allow_promotion_codes: true,
  });
}

/* ——— Billing Portal ——— */

export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

/* ——— Subscription Management ——— */

export async function getSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately = false,
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function resumeSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/* ——— Customer Deletion ——— */

export async function deleteCustomer(customerId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.customers.del(customerId);
}

/* ——— Webhook Verification ——— */

export function constructWebhookEvent(
  body: string,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable.');
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}
