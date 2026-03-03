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

/**
 * Credit costs — must stay in sync with config/billing.ts.
 */
const CREDIT_COSTS: Record<string, number> = {
  run: 1,
  deck: 1,
  qa_seconds: 1,
  deck_generation: 2,
};

/**
 * Monthly credit allotment per plan — must stay in sync with config/billing.ts.
 */
const MONTHLY_CREDITS: Record<BillingPlanId, number> = {
  free: 3,
  day_pass: 0,
  pro: 60,
};

interface CreditBalanceRow {
  monthly_credits: number;
  purchased_credits: number;
  bonus_credits: number;
  bonus_credits_expires_at: string | null;
}

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
  resource: 'run' | 'deck' | 'qa_seconds' | 'deck_generation',
): Promise<UsageLimitResult> {
  // Dev accounts bypass all usage limits
  if (isDevUser(userId)) {
    return { allowed: true, planId: 'pro', used: 0, limit: null, remaining: null };
  }

  // 1. Check active day pass first — it takes priority (not for deck_generation)
  if (resource !== 'deck_generation') {
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
  }

  // 2. Credit-based check
  const creditCost = CREDIT_COSTS[resource] ?? 1;
  const { data: creditBalance } = await supabase
    .from('credit_balances')
    .select('monthly_credits, purchased_credits, bonus_credits, bonus_credits_expires_at')
    .eq('user_id', userId)
    .single<CreditBalanceRow>();

  // Fetch subscription to get actual planId
  const { data: subForPlan } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .single<{ plan_id: string }>();
  const actualPlanId: BillingPlanId = subForPlan && isValidPlan(subForPlan.plan_id) ? subForPlan.plan_id : 'free';

  if (creditBalance) {
    const effectiveBonus = creditBalance.bonus_credits > 0
      && (!creditBalance.bonus_credits_expires_at || new Date(creditBalance.bonus_credits_expires_at) > new Date())
      ? creditBalance.bonus_credits : 0;
    const totalAvailable = creditBalance.monthly_credits + creditBalance.purchased_credits + effectiveBonus;

    if (totalAvailable > 0) {
      return {
        allowed: totalAvailable >= creditCost,
        planId: actualPlanId,
        used: creditCost,
        limit: totalAvailable + creditCost,
        remaining: totalAvailable,
      };
    }
  } else {
    // Auto-create credit balance for user (reuse actualPlanId from above)
    const monthlyLimit = MONTHLY_CREDITS[actualPlanId];
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await supabase.from('credit_balances').insert({
      user_id: userId,
      monthly_credits: monthlyLimit,
      monthly_credits_limit: monthlyLimit,
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
    });

    if (monthlyLimit >= creditCost) {
      return {
        allowed: true,
        planId: actualPlanId,
        used: creditCost,
        limit: monthlyLimit + creditCost,
        remaining: monthlyLimit,
      };
    }
  }

  // 3. Fall back to subscription-based usage events
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
      : resource === 'deck' || resource === 'deck_generation'
        ? 'decksPerPeriod'
        : 'qaSecondsPerPeriod';

  const limit = limits[limitKey];

  // Unlimited plan — always allowed
  if (limit === null) {
    return { allowed: true, planId, used: 0, limit: null, remaining: null };
  }

  // 4. Count usage events in the current period
  const defaultBounds = getDefaultPeriodBounds();
  const periodStart = sub?.current_period_start ?? defaultBounds.start;
  const periodEnd = sub?.current_period_end ?? defaultBounds.end;

  if (resource === 'qa_seconds') {
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

  const eventResource = resource === 'deck_generation' ? 'deck' : resource;
  const { count } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('resource', eventResource)
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
 * For non-day-pass users, also consumes credits via RPC.
 */
export async function recordUsageEvent(
  supabase: SupabaseClient,
  userId: string,
  resource: 'run' | 'deck' | 'deck_generation',
  referenceId?: string,
): Promise<void> {
  // Check if user has an active day pass — if so, use day pass tracking
  if (resource !== 'deck_generation') {
    const dayPass = await getActiveDayPass(supabase, userId);
    if (dayPass) {
      const column = resource === 'run' ? 'runs_used' : 'decks_used';
      await supabase.rpc('increment_day_pass_usage', {
        pass_id: dayPass.id,
        usage_column: column,
      });
    } else {
      // Consume credits for non-day-pass users
      const creditCost = CREDIT_COSTS[resource] ?? 1;
      const { data: consumeResult, error: consumeErr } = await supabase.rpc('consume_credits', {
        p_user_id: userId,
        p_amount: creditCost,
        p_source: resource,
        p_reference_id: referenceId ?? null,
      });
      if (consumeErr) {
        console.error('[billing] credit consumption failed for', userId, resource, consumeErr.message);
      } else if ((consumeResult as number) < 0) {
        console.warn('[billing] insufficient credits for', userId, resource);
      }
    }
  } else {
    // deck_generation always uses credits (no day pass equivalent)
    const creditCost = CREDIT_COSTS[resource] ?? 2;
    const { data: consumeResult, error: consumeErr } = await supabase.rpc('consume_credits', {
      p_user_id: userId,
      p_amount: creditCost,
      p_source: resource,
      p_reference_id: referenceId ?? null,
    });
    if (consumeErr) {
      console.error('[billing] credit consumption failed for', userId, resource, consumeErr.message);
    } else if ((consumeResult as number) < 0) {
      console.warn('[billing] insufficient credits for', userId, resource);
    }
  }

  // Always insert usage_events for analytics
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('current_period_start, current_period_end')
    .eq('user_id', userId)
    .single();

  const defaultBounds = getDefaultPeriodBounds();
  const periodStart = sub?.current_period_start ?? defaultBounds.start;
  const periodEnd = sub?.current_period_end ?? defaultBounds.end;

  const analyticsResource = resource === 'deck_generation' ? 'deck' : resource;

  await supabase.from('usage_events').insert({
    user_id: userId,
    resource: analyticsResource,
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
