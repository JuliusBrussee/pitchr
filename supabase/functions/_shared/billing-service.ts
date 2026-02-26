import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';

/* ——————————————————————————————————————————————————————————
 * Billing Service (Edge Function variant)
 *
 * Lightweight rate-limit check for Supabase Edge Functions.
 * Mirrors the logic in services/billingService.ts but uses
 * the Deno runtime and shared Supabase client.
 * —————————————————————————————————————————————————————————— */

export type BillingPlanId = 'free' | 'pro';

interface PlanLimits {
  runsPerPeriod: number | null;
  decksPerPeriod: number | null;
  qaSessionsPerPeriod: number | null;
}

/**
 * Plan limits — must stay in sync with config/billing.ts.
 * Duplicated here because Edge Functions can't import from
 * the Next.js codebase.
 */
const PLAN_LIMITS: Record<BillingPlanId, PlanLimits> = {
  free: { runsPerPeriod: 3, decksPerPeriod: 1, qaSessionsPerPeriod: 1 },
  pro: { runsPerPeriod: 50, decksPerPeriod: 20, qaSessionsPerPeriod: 30 },
};

/** Dev user IDs that bypass all billing limits. */
const DEV_USER_IDS: Set<string> = new Set(
  (Deno.env.get('BILLING_DEV_USER_IDS') ?? '')
    .split(',')
    .map((id: string) => id.trim())
    .filter(Boolean),
);

function isDevUser(userId: string): boolean {
  return DEV_USER_IDS.has(userId);
}

function isValidPlan(value: string): value is BillingPlanId {
  return value === 'free' || value === 'pro';
}

interface SubscriptionRow {
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
}

export interface UsageLimitResult {
  allowed: boolean;
  planId: BillingPlanId;
  used: number;
  limit: number | null;
  remaining: number | null;
}

/**
 * Compute stable calendar-month period bounds for free-tier users
 * who have no subscription row. Uses the 1st of the current month
 * so that every call within a month returns the same window.
 */
function getDefaultPeriodBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function checkUsageLimit(
  supabase: SupabaseClient,
  userId: string,
  resource: 'run' | 'deck' | 'qa_session',
): Promise<UsageLimitResult> {
  // Dev accounts bypass all usage limits
  if (isDevUser(userId)) {
    return { allowed: true, planId: 'pro', used: 0, limit: null, remaining: null };
  }

  // 1. Get subscription (or default to free)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id, status, current_period_start, current_period_end')
    .eq('user_id', userId)
    .single<SubscriptionRow>();

  const planId: BillingPlanId =
    sub && isValidPlan(sub.plan_id) ? sub.plan_id : 'free';
  const limits = PLAN_LIMITS[planId];

  const limitKey: keyof PlanLimits =
    resource === 'run'
      ? 'runsPerPeriod'
      : resource === 'deck'
        ? 'decksPerPeriod'
        : 'qaSessionsPerPeriod';

  const limit = limits[limitKey];

  // Unlimited plan — always allowed
  if (limit === null) {
    return { allowed: true, planId, used: 0, limit: null, remaining: null };
  }

  // 2. Count usage events in the current period
  const defaultBounds = getDefaultPeriodBounds();
  const periodStart = sub?.current_period_start ?? defaultBounds.start;
  const periodEnd = sub?.current_period_end ?? defaultBounds.end;

  const { count } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('resource', resource)
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd);

  const used = count ?? 0;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    planId,
    used,
    limit,
    remaining,
  };
}

/**
 * Record a usage event after a successful resource consumption.
 */
export async function recordUsageEvent(
  supabase: SupabaseClient,
  userId: string,
  resource: 'run' | 'deck' | 'qa_session',
): Promise<void> {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('current_period_start, current_period_end')
    .eq('user_id', userId)
    .single();

  const defaultBounds = getDefaultPeriodBounds();
  const periodStart = sub?.current_period_start ?? defaultBounds.start;
  const periodEnd = sub?.current_period_end ?? defaultBounds.end;

  await supabase.from('usage_events').insert({
    user_id: userId,
    resource,
    period_start: periodStart,
    period_end: periodEnd,
  });
}
