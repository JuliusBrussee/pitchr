import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BillingPlanId,
  BillingInterval,
  Subscription,
  SubscriptionStatus,
  UsageCheckResult,
  UsagePeriod,
} from '@/types/billing';
import { getPlanLimits, planIdFromStripePriceId, TRIAL_PERIOD_DAYS } from '@/config/billing';
import {
  createCustomer,
  createCheckoutSession,
  createPortalSession,
} from '@/services/stripeService';

/* ——————————————————————————————————————————————————————————
 * Billing Service
 *
 * Handles subscription CRUD, usage tracking, and rate
 * limit checks. All DB access goes through the Supabase
 * client passed in (respects RLS when using user-scoped
 * client, bypasses when using admin client).
 * —————————————————————————————————————————————————————————— */

/* ——— Subscription CRUD ——— */

export async function getSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return mapSubscriptionRow(data);
}

export async function getOrCreateSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subscription> {
  const existing = await getSubscription(supabase, userId);
  if (existing) return existing;

  // Auto-create a free subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: 'free',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create free subscription: ${error?.message}`);
  }

  return mapSubscriptionRow(data);
}

export async function upsertSubscription(
  supabase: SupabaseClient,
  params: {
    userId: string;
    planId: BillingPlanId;
    status: SubscriptionStatus;
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd?: string | null;
  },
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: params.userId,
        plan_id: params.planId,
        status: params.status,
        stripe_customer_id: params.stripeCustomerId,
        stripe_subscription_id: params.stripeSubscriptionId,
        stripe_price_id: params.stripePriceId,
        current_period_start: params.currentPeriodStart,
        current_period_end: params.currentPeriodEnd,
        cancel_at_period_end: params.cancelAtPeriodEnd,
        trial_end: params.trialEnd ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert subscription: ${error?.message}`);
  }

  return mapSubscriptionRow(data);
}

export async function downgradeToFree(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await supabase
    .from('subscriptions')
    .update({
      plan_id: 'free',
      status: 'active',
      stripe_subscription_id: null,
      stripe_price_id: null,
      cancel_at_period_end: false,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

/* ——— Stripe Customer + Checkout ——— */

export async function getOrCreateStripeCustomer(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  name?: string,
): Promise<string> {
  const sub = await getSubscription(supabase, userId);
  if (sub?.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await createCustomer({ email, userId, name });

  // Store the customer ID in the subscription row
  await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customer.id,
        plan_id: 'free',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  return customer.id;
}

export async function startCheckout(
  supabase: SupabaseClient,
  params: {
    userId: string;
    email: string;
    name?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  },
) {
  const customerId = await getOrCreateStripeCustomer(
    supabase,
    params.userId,
    params.email,
    params.name,
  );

  const session = await createCheckoutSession({
    customerId,
    priceId: params.priceId,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    trialPeriodDays: TRIAL_PERIOD_DAYS > 0 ? TRIAL_PERIOD_DAYS : undefined,
  });

  return { url: session.url!, sessionId: session.id };
}

export async function startPortalSession(
  supabase: SupabaseClient,
  userId: string,
  returnUrl: string,
) {
  const sub = await getSubscription(supabase, userId);
  if (!sub?.stripeCustomerId) {
    throw new Error('No Stripe customer found. Subscribe to a plan first.');
  }

  const portal = await createPortalSession({
    customerId: sub.stripeCustomerId,
    returnUrl,
  });

  return { url: portal.url };
}

/* ——— Usage Tracking ——— */

export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  resource: 'run' | 'deck' | 'qa_session',
): Promise<void> {
  const sub = await getOrCreateSubscription(supabase, userId);

  await supabase.from('usage_events').insert({
    user_id: userId,
    resource,
    period_start: sub.currentPeriodStart,
    period_end: sub.currentPeriodEnd,
  });
}

export async function getUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<UsagePeriod> {
  const sub = await getOrCreateSubscription(supabase, userId);

  const { data } = await supabase
    .from('usage_events')
    .select('resource')
    .eq('user_id', userId)
    .gte('period_start', sub.currentPeriodStart)
    .lte('period_end', sub.currentPeriodEnd);

  const events = data ?? [];

  return {
    userId,
    periodStart: sub.currentPeriodStart,
    periodEnd: sub.currentPeriodEnd,
    runsUsed: events.filter((e) => e.resource === 'run').length,
    decksUsed: events.filter((e) => e.resource === 'deck').length,
    qaSessionsUsed: events.filter((e) => e.resource === 'qa_session').length,
  };
}

/* ——— Rate Limit Checks ——— */

export async function checkUsageLimit(
  supabase: SupabaseClient,
  userId: string,
  resource: 'runs' | 'decks' | 'qa_sessions',
): Promise<UsageCheckResult> {
  const sub = await getOrCreateSubscription(supabase, userId);
  const usage = await getUsage(supabase, userId);
  const limits = getPlanLimits(sub.planId);

  const resourceMap = {
    runs: { used: usage.runsUsed, limit: limits.runsPerPeriod },
    decks: { used: usage.decksUsed, limit: limits.decksPerPeriod },
    qa_sessions: { used: usage.qaSessionsUsed, limit: limits.qaSessionsPerPeriod },
  };

  const { used, limit } = resourceMap[resource];
  const allowed = limit === null || used < limit;
  const remaining = limit === null ? null : Math.max(0, limit - used);

  return {
    allowed,
    resource,
    used,
    limit,
    remaining,
    planId: sub.planId,
  };
}

/**
 * Check if a feature is available on the user's plan.
 */
export async function checkFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: 'sectionFeedback' | 'vocabularyMetrics' | 'historicalLinks' | 'deckGeneration',
): Promise<boolean> {
  const sub = await getOrCreateSubscription(supabase, userId);
  const limits = getPlanLimits(sub.planId);
  return limits[feature];
}

/* ——— Webhook Helpers ——— */

export async function getUserIdByStripeCustomerId(
  supabase: SupabaseClient,
  stripeCustomerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  return data?.user_id ?? null;
}

export async function recordBillingEvent(
  supabase: SupabaseClient,
  stripeEventId: string,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const { error } = await supabase.from('billing_events').insert({
    stripe_event_id: stripeEventId,
    event_type: eventType,
    payload,
  });

  // If duplicate key, event was already processed
  if (error?.code === '23505') return false;
  if (error) throw error;
  return true;
}

export function resolveSubscriptionPlan(stripePriceId: string | null): BillingPlanId {
  if (!stripePriceId) return 'free';
  return planIdFromStripePriceId(stripePriceId);
}

/* ——— Helpers ——— */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubscriptionRow(row: any): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
    stripeCustomerId: row.stripe_customer_id ?? '',
    stripeSubscriptionId: row.stripe_subscription_id ?? null,
    stripePriceId: row.stripe_price_id ?? null,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
