import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';

/* ——————————————————————————————————————————————————————————
 * Billing Service (Edge Function variant)
 *
 * Lightweight rate-limit check for Supabase Edge Functions.
 * Mirrors the logic in services/billingService.ts but uses
 * the Deno runtime and shared Supabase client.
 * —————————————————————————————————————————————————————————— */

export type BillingPlanId = 'free' | 'day_pass' | 'pro';

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
  day_pass: { runsPerPeriod: 15, decksPerPeriod: 5, qaSessionsPerPeriod: 5 },
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
  return value === 'free' || value === 'day_pass' || value === 'pro';
}

interface SubscriptionRow {
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
}

interface DayPassRow {
  id: string;
  expires_at: string;
  runs_used: number;
  runs_limit: number;
  decks_used: number;
  decks_limit: number;
  qa_sessions_used: number;
  qa_sessions_limit: number;
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

/**
 * Check for an active (non-expired) day pass. Returns the pass row
 * if one exists, otherwise null.
 */
async function getActiveDayPass(
  supabase: SupabaseClient,
  userId: string,
): Promise<DayPassRow | null> {
  const { data } = await supabase
    .from('day_passes')
    .select('id, expires_at, runs_used, runs_limit, decks_used, decks_limit, qa_sessions_used, qa_sessions_limit')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('purchased_at', { ascending: false })
    .limit(1)
    .single<DayPassRow>();

  return data ?? null;
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

  // 1. Check active day pass first — it takes priority
  const dayPass = await getActiveDayPass(supabase, userId);
  if (dayPass) {
    const resourceMap = {
      run: { used: dayPass.runs_used, limit: dayPass.runs_limit },
      deck: { used: dayPass.decks_used, limit: dayPass.decks_limit },
      qa_session: { used: dayPass.qa_sessions_used, limit: dayPass.qa_sessions_limit },
    };
    const { used, limit } = resourceMap[resource];
    if (used < limit) {
      return {
        allowed: true,
        planId: 'day_pass',
        used,
        limit,
        remaining: Math.max(0, limit - used),
      };
    }
  }

  // 2. Fall back to subscription
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

  // 3. Count usage events in the current period
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
