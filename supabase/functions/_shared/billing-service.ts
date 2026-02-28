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
  qaSecondsPerPeriod: number | null;
  maxQaSessionSeconds: number;
  qaGracePeriodSeconds: number;
}

/**
 * Plan limits — must stay in sync with config/billing.ts.
 * Duplicated here because Edge Functions can't import from
 * the Next.js codebase.
 */
const PLAN_LIMITS: Record<BillingPlanId, PlanLimits> = {
  free: { runsPerPeriod: 3, decksPerPeriod: 1, qaSecondsPerPeriod: 120, maxQaSessionSeconds: 60, qaGracePeriodSeconds: 10 },
  day_pass: { runsPerPeriod: 15, decksPerPeriod: 5, qaSecondsPerPeriod: 600, maxQaSessionSeconds: 120, qaGracePeriodSeconds: 10 },
  pro: { runsPerPeriod: 50, decksPerPeriod: 20, qaSecondsPerPeriod: 3600, maxQaSessionSeconds: 180, qaGracePeriodSeconds: 10 },
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
  qa_seconds_used: number;
  qa_seconds_limit: number;
}

export interface UsageLimitResult {
  allowed: boolean;
  planId: BillingPlanId;
  used: number;
  limit: number | null;
  remaining: number | null;
}

export interface QaBudgetResult {
  allowed: boolean;
  planId: BillingPlanId;
  budgetSeconds: number | null;
  usedSeconds: number;
  remainingSeconds: number | null;
  maxSessionSeconds: number;
  gracePeriodSeconds: number;
  durationOptions: number[];
  defaultDurationSeconds: number;
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
    .select('id, expires_at, runs_used, runs_limit, decks_used, decks_limit, qa_seconds_used, qa_seconds_limit')
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
  resource: 'run' | 'deck' | 'qa_seconds',
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
      qa_seconds: { used: dayPass.qa_seconds_used, limit: dayPass.qa_seconds_limit },
    };
    const { used, limit } = resourceMap[resource];
    return {
      allowed: used < limit,
      planId: 'day_pass' as BillingPlanId,
      used,
      limit,
      remaining: Math.max(0, limit - used),
    };
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
        : 'qaSecondsPerPeriod';

  const limit = limits[limitKey];

  // Unlimited plan — always allowed
  if (limit === null) {
    return { allowed: true, planId, used: 0, limit: null, remaining: null };
  }

  // 3. Count usage events in the current period
  const defaultBounds = getDefaultPeriodBounds();
  const periodStart = sub?.current_period_start ?? defaultBounds.start;
  const periodEnd = sub?.current_period_end ?? defaultBounds.end;

  if (resource === 'qa_seconds') {
    // Sum quantity for qa_seconds events
    const { data: events } = await supabase
      .from('usage_events')
      .select('quantity')
      .eq('user_id', userId)
      .eq('resource', 'qa_seconds')
      .gte('period_start', periodStart)
      .lte('period_end', periodEnd);

    const used = (events ?? []).reduce(
      (sum: number, e: { quantity?: number }) => sum + (e.quantity ?? 0),
      0,
    );
    const remaining = Math.max(0, (limit as number) - used);

    return {
      allowed: used < (limit as number),
      planId,
      used,
      limit,
      remaining,
    };
  }

  const { count } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('resource', resource)
    .gte('period_start', periodStart)
    .lte('period_end', periodEnd);

  const used = count ?? 0;
  const remaining = Math.max(0, (limit as number) - used);

  return {
    allowed: used < (limit as number),
    planId,
    used,
    limit,
    remaining,
  };
}

/**
 * Get full Q&A budget info including plan-specific limits and duration options.
 */
export async function getQaBudget(
  supabase: SupabaseClient,
  userId: string,
): Promise<QaBudgetResult> {
  const result = await checkUsageLimit(supabase, userId, 'qa_seconds');
  const limits = PLAN_LIMITS[result.planId];

  const maxSession = limits.maxQaSessionSeconds;
  const options: number[] = [];
  if (maxSession >= 30) options.push(30);
  if (maxSession >= 60) options.push(60);
  if (maxSession >= 90) options.push(90);
  if (maxSession >= 120) options.push(120);
  if (maxSession >= 180) options.push(180);

  const defaultDuration = result.planId === 'pro' ? 120 : 60;

  return {
    allowed: result.allowed,
    planId: result.planId,
    budgetSeconds: result.limit,
    usedSeconds: result.used,
    remainingSeconds: result.remaining,
    maxSessionSeconds: maxSession,
    gracePeriodSeconds: limits.qaGracePeriodSeconds,
    durationOptions: options,
    defaultDurationSeconds: Math.min(defaultDuration, maxSession),
  };
}

/**
 * Record a usage event after a successful resource consumption.
 */
export async function recordUsageEvent(
  supabase: SupabaseClient,
  userId: string,
  resource: 'run' | 'deck',
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

/**
 * Record Q&A time usage (seconds-based).
 * Uses atomic RPC for day pass updates to prevent race conditions.
 */
export async function recordQaSecondsUsage(
  supabase: SupabaseClient,
  userId: string,
  seconds: number,
): Promise<void> {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  const rounded = Math.round(seconds);
  if (rounded === 0) return;

  // Fetch day pass and subscription in parallel
  const [dayPass, { data: sub }] = await Promise.all([
    getActiveDayPass(supabase, userId),
    supabase
      .from('subscriptions')
      .select('current_period_start, current_period_end')
      .eq('user_id', userId)
      .single(),
  ]);

  const ops: Promise<unknown>[] = [];

  // Atomically increment day pass QA seconds if active
  if (dayPass) {
    ops.push(
      supabase.rpc('increment_day_pass_qa_seconds', {
        pass_id: dayPass.id,
        additional_seconds: rounded,
      }).then(({ error: rpcError }) => {
        if (rpcError) {
          console.error(`[billing] atomic day pass QA seconds increment failed for ${dayPass.id}:`, rpcError.message);
          throw new Error(`Failed to record day pass QA seconds: ${rpcError.message}`);
        }
      }),
    );
  }

  // Record in usage_events for period tracking
  const defaultBounds = getDefaultPeriodBounds();
  const periodStart = sub?.current_period_start ?? defaultBounds.start;
  const periodEnd = sub?.current_period_end ?? defaultBounds.end;

  ops.push(
    supabase.from('usage_events').insert({
      user_id: userId,
      resource: 'qa_seconds',
      quantity: rounded,
      period_start: periodStart,
      period_end: periodEnd,
    }),
  );

  await Promise.all(ops);
}
