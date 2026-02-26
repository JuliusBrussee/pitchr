import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BillingPlanId,
  DayPass,
  QaBudgetInfo,
  Subscription,
  SubscriptionStatus,
  UsageCheckResult,
  UsagePeriod,
} from '@/types/billing';
import {
  DAY_PASS_DURATION_HOURS,
  getPlanLimits,
  isDevUser,
  planIdFromStripePriceId,
  TRIAL_PERIOD_DAYS,
} from '@/config/billing';
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

/* ——— Day Pass ——— */

export async function getActiveDayPass(
  supabase: SupabaseClient,
  userId: string,
): Promise<DayPass | null> {
  const { data, error } = await supabase
    .from('day_passes')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('purchased_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return mapDayPassRow(data);
}

export async function purchaseDayPass(
  supabase: SupabaseClient,
  userId: string,
  stripePaymentIntentId: string | null,
): Promise<DayPass> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DAY_PASS_DURATION_HOURS * 60 * 60 * 1000);
  const limits = getPlanLimits('day_pass');

  const { data, error } = await supabase
    .from('day_passes')
    .insert({
      user_id: userId,
      purchased_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      runs_used: 0,
      runs_limit: limits.runsPerPeriod ?? 15,
      decks_used: 0,
      decks_limit: limits.decksPerPeriod ?? 5,
      qa_seconds_used: 0,
      qa_seconds_limit: limits.qaSecondsPerPeriod ?? 600,
      stripe_payment_intent_id: stripePaymentIntentId,
      status: 'active',
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create day pass: ${error?.message}`);
  }

  return mapDayPassRow(data);
}

export async function recordDayPassUsage(
  supabase: SupabaseClient,
  dayPassId: string,
  resource: 'run' | 'deck',
): Promise<void> {
  const column = resource === 'run' ? 'runs_used' : 'decks_used';

  // Increment the usage counter
  const { error } = await supabase.rpc('increment_day_pass_usage', {
    pass_id: dayPassId,
    usage_column: column,
  });

  if (error) {
    console.error(`[billing] atomic day pass usage increment failed for ${dayPassId}:`, error.message);
    throw new Error(`Failed to record day pass usage: ${error.message}`);
  }
}

/**
 * Record Q&A time usage on a day pass (seconds-based).
 * Uses atomic RPC to prevent race conditions from concurrent sessions.
 */
export async function recordDayPassQaSeconds(
  supabase: SupabaseClient,
  dayPassId: string,
  seconds: number,
): Promise<void> {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  const rounded = Math.round(seconds);
  if (rounded === 0) return;

  const { error } = await supabase.rpc('increment_day_pass_qa_seconds', {
    pass_id: dayPassId,
    additional_seconds: rounded,
  });

  if (error) {
    console.error(`[billing] atomic day pass QA seconds increment failed for ${dayPassId}:`, error.message);
    throw new Error(`Failed to record day pass QA seconds: ${error.message}`);
  }
}

export async function expireDayPass(
  supabase: SupabaseClient,
  dayPassId: string,
  reason: 'expired' | 'exhausted' = 'expired',
): Promise<void> {
  await supabase
    .from('day_passes')
    .update({ status: reason, updated_at: new Date().toISOString() })
    .eq('id', dayPassId);
}

/**
 * Check day pass usage for a given resource.
 * Returns null if user has no active day pass.
 */
export async function checkDayPassUsage(
  supabase: SupabaseClient,
  userId: string,
  resource: 'runs' | 'decks' | 'qa_seconds',
): Promise<UsageCheckResult | null> {
  const pass = await getActiveDayPass(supabase, userId);
  if (!pass) return null;

  // Check if pass has expired by time
  if (new Date(pass.expiresAt) <= new Date()) {
    await expireDayPass(supabase, pass.id, 'expired');
    return null;
  }

  const resourceMap = {
    runs: { used: pass.runsUsed, limit: pass.runsLimit },
    decks: { used: pass.decksUsed, limit: pass.decksLimit },
    qa_seconds: { used: pass.qaSecondsUsed, limit: pass.qaSecondsLimit },
  };

  const { used, limit } = resourceMap[resource];
  const allowed = used < limit;
  const remaining = Math.max(0, limit - used);

  // If all resources are exhausted, mark the pass
  if (!allowed && resource === 'runs') {
    await expireDayPass(supabase, pass.id, 'exhausted');
  }

  return {
    allowed,
    resource,
    used,
    limit,
    remaining,
    planId: 'day_pass',
  };
}

/* ——— Usage Tracking ——— */

export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  resource: 'run' | 'deck',
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
    .select('resource, quantity')
    .eq('user_id', userId)
    .gte('period_start', sub.currentPeriodStart)
    .lte('period_end', sub.currentPeriodEnd);

  const events = (data ?? []) as Array<{ resource: string; quantity?: number }>;

  const qaSecondsUsed = events
    .filter((e) => e.resource === 'qa_seconds')
    .reduce((sum, e) => sum + (e.quantity ?? 0), 0);

  return {
    userId,
    periodStart: sub.currentPeriodStart,
    periodEnd: sub.currentPeriodEnd,
    runsUsed: events.filter((e) => e.resource === 'run').length,
    decksUsed: events.filter((e) => e.resource === 'deck').length,
    qaSecondsUsed,
  };
}

/* ——— Rate Limit Checks ——— */

export async function checkUsageLimit(
  supabase: SupabaseClient,
  userId: string,
  resource: 'runs' | 'decks' | 'qa_seconds',
): Promise<UsageCheckResult> {
  // Dev accounts bypass all usage limits
  if (isDevUser(userId)) {
    return { allowed: true, resource, used: 0, limit: null, remaining: null, planId: 'pro' };
  }

  // Check active day pass first — it takes priority over subscription limits
  const dayPassResult = await checkDayPassUsage(supabase, userId, resource);
  if (dayPassResult) return dayPassResult;

  const sub = await getOrCreateSubscription(supabase, userId);
  const usage = await getUsage(supabase, userId);
  const limits = getPlanLimits(sub.planId);

  const resourceMap = {
    runs: { used: usage.runsUsed, limit: limits.runsPerPeriod },
    decks: { used: usage.decksUsed, limit: limits.decksPerPeriod },
    qa_seconds: { used: usage.qaSecondsUsed, limit: limits.qaSecondsPerPeriod },
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
 * Get full Q&A budget info for a user, including plan-specific duration options.
 */
export async function getQaBudget(
  supabase: SupabaseClient,
  userId: string,
): Promise<QaBudgetInfo> {
  const usageResult = await checkUsageLimit(supabase, userId, 'qa_seconds');
  const limits = getPlanLimits(usageResult.planId);

  const maxSession = limits.maxQaSessionSeconds;
  const options: number[] = [];
  if (maxSession >= 30) options.push(30);
  if (maxSession >= 60) options.push(60);
  if (maxSession >= 90) options.push(90);
  if (maxSession >= 120) options.push(120);
  if (maxSession >= 180) options.push(180);

  // Default session: Pro gets 120s, others get 60s
  const defaultDuration = usageResult.planId === 'pro' ? 120 : 60;

  return {
    budgetSeconds: usageResult.limit,
    usedSeconds: usageResult.used,
    remainingSeconds: usageResult.remaining,
    maxSessionSeconds: maxSession,
    gracePeriodSeconds: limits.qaGracePeriodSeconds,
    durationOptions: options,
    defaultDurationSeconds: Math.min(defaultDuration, maxSession),
    planId: usageResult.planId,
  };
}

/**
 * Record Q&A time usage as a usage event (seconds-based).
 */
export async function recordQaSecondsUsage(
  supabase: SupabaseClient,
  userId: string,
  seconds: number,
): Promise<void> {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  const rounded = Math.round(seconds);
  if (rounded === 0) return;

  const sub = await getOrCreateSubscription(supabase, userId);

  await supabase.from('usage_events').insert({
    user_id: userId,
    resource: 'qa_seconds',
    quantity: rounded,
    period_start: sub.currentPeriodStart,
    period_end: sub.currentPeriodEnd,
  });
}

/**
 * Check if a feature is available on the user's plan.
 */
export async function checkFeatureAccess(
  supabase: SupabaseClient,
  userId: string,
  feature: 'sectionFeedback' | 'vocabularyMetrics' | 'historicalLinks' | 'deckGeneration',
): Promise<boolean> {
  if (isDevUser(userId)) return true;

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

/**
 * Check if a Stripe webhook event has already been processed.
 * Returns true if a record with the given stripe_event_id exists.
 */
export async function isBillingEventProcessed(
  supabase: SupabaseClient,
  stripeEventId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from('billing_events')
    .select('id', { count: 'exact', head: true })
    .eq('stripe_event_id', stripeEventId);
  return (count ?? 0) > 0;
}

/**
 * Record a billing event after successful handling.
 * Should be called only after the event handler succeeds.
 * Returns true if the record was inserted, false if duplicate.
 */
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDayPassRow(row: any): DayPass {
  return {
    id: row.id,
    userId: row.user_id,
    purchasedAt: row.purchased_at,
    expiresAt: row.expires_at,
    runsUsed: row.runs_used,
    runsLimit: row.runs_limit,
    decksUsed: row.decks_used,
    decksLimit: row.decks_limit,
    qaSecondsUsed: row.qa_seconds_used ?? 0,
    qaSecondsLimit: row.qa_seconds_limit ?? 600,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? null,
    status: row.status,
  };
}
