import type { SupabaseClient } from '@supabase/supabase-js';

/* ——————————————————————————————————————————————————————————
 * Billing Service (Edge Function variant)
 *
 * Lightweight rate-limit check for Supabase Edge Functions.
 * Mirrors the logic in services/billingService.ts but uses
 * the Deno runtime and shared Supabase client.
 * —————————————————————————————————————————————————————————— */

export type BillingPlanId = 'free' | 'pro' | 'team';

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
  team: { runsPerPeriod: null, decksPerPeriod: null, qaSessionsPerPeriod: null },
};

function isValidPlan(value: string): value is BillingPlanId {
  return value === 'free' || value === 'pro' || value === 'team';
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
 * Check if a user is within their usage limit for a given resource.
 * Uses the admin (service role) Supabase client to bypass RLS.
 */
export async function checkUsageLimit(
  supabase: SupabaseClient,
  userId: string,
  resource: 'run' | 'deck' | 'qa_session',
): Promise<UsageLimitResult> {
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
  const periodStart = sub?.current_period_start ?? new Date().toISOString();
  const periodEnd = sub?.current_period_end ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

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

  const periodStart = sub?.current_period_start ?? new Date().toISOString();
  const periodEnd = sub?.current_period_end ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('usage_events').insert({
    user_id: userId,
    resource,
    period_start: periodStart,
    period_end: periodEnd,
  });
}
