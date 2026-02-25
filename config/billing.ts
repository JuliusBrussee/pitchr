import type { BillingPlan, BillingPlanId, PlanLimits, PlanPricing } from '@/types/billing';

/* ——————————————————————————————————————————————————————————
 * Billing Plans Configuration
 *
 * All pricing, limits, and Stripe IDs are defined here.
 * To change costs/limits, edit ONLY this file.
 * Stripe Price IDs can be overridden via environment variables.
 * —————————————————————————————————————————————————————————— */

/* ——— Plan Limits ——— */

const FREE_LIMITS: PlanLimits = {
  runsPerPeriod: 3,
  decksPerPeriod: 1,
  qaSessionsPerPeriod: 1,
  maxConcurrentRuns: 1,
  sectionFeedback: false,
  vocabularyMetrics: false,
  historicalLinks: false,
  deckGeneration: false,
  queuePriority: 100,
};

const DAY_PASS_LIMITS: PlanLimits = {
  runsPerPeriod: 15,
  decksPerPeriod: 5,
  qaSessionsPerPeriod: 5,
  maxConcurrentRuns: 3,
  sectionFeedback: true,
  vocabularyMetrics: true,
  historicalLinks: true,
  deckGeneration: true,
  queuePriority: 10,
};

const PRO_LIMITS: PlanLimits = {
  runsPerPeriod: 50,
  decksPerPeriod: 20,
  qaSessionsPerPeriod: 30,
  maxConcurrentRuns: 3,
  sectionFeedback: true,
  vocabularyMetrics: true,
  historicalLinks: true,
  deckGeneration: true,
  queuePriority: 10,
};

/* ——— Plan Pricing (USD) ——— */

const FREE_PRICING: PlanPricing = {
  monthly: 0,
  yearly: 0,
  stripePriceIdMonthly: null,
  stripePriceIdYearly: null,
};

const DAY_PASS_PRICING: PlanPricing = {
  monthly: 9,
  yearly: 9, // same — one-time purchase, not recurring
  stripePriceIdMonthly: process.env.STRIPE_DAY_PASS_PRICE_ID ?? null,
  stripePriceIdYearly: null,
};

const PRO_PRICING: PlanPricing = {
  monthly: 29,
  yearly: 290,
  stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? null,
  stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? null,
};

/** Duration of a day pass in hours */
export const DAY_PASS_DURATION_HOURS = 24;

/* ——— Plan Definitions ——— */

export const BILLING_PLANS: Record<BillingPlanId, BillingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic pitch analysis',
    limits: FREE_LIMITS,
    pricing: FREE_PRICING,
    featured: false,
  },
  day_pass: {
    id: 'day_pass',
    name: 'Day Pass',
    description: 'Full Pro access for 24 hours — perfect before a pitch',
    limits: DAY_PASS_LIMITS,
    pricing: DAY_PASS_PRICING,
    featured: false,
    oneTime: true,
    durationHours: DAY_PASS_DURATION_HOURS,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Full-featured pitch coaching for serious founders',
    limits: PRO_LIMITS,
    pricing: PRO_PRICING,
    featured: true,
  },
};

/* ——— Helpers ——— */

export function getPlan(planId: BillingPlanId): BillingPlan {
  return BILLING_PLANS[planId];
}

export function getPlanLimits(planId: BillingPlanId): PlanLimits {
  return BILLING_PLANS[planId].limits;
}

export function getAllPlans(): BillingPlan[] {
  return Object.values(BILLING_PLANS);
}

export function isValidPlanId(value: string): value is BillingPlanId {
  return value === 'free' || value === 'day_pass' || value === 'pro';
}

/**
 * Look up which plan a Stripe Price ID belongs to.
 * Returns 'free' if no match is found.
 */
export function planIdFromStripePriceId(stripePriceId: string): BillingPlanId {
  for (const plan of Object.values(BILLING_PLANS)) {
    if (
      plan.pricing.stripePriceIdMonthly === stripePriceId ||
      plan.pricing.stripePriceIdYearly === stripePriceId
    ) {
      return plan.id;
    }
  }
  return 'free';
}

/** Default trial period in days (0 = no trial) */
export const TRIAL_PERIOD_DAYS = 7;

/** Grace period after subscription expiry before downgrading (hours) */
export const GRACE_PERIOD_HOURS = 48;

/* ——— Dev Bypass ——— */

/**
 * Comma-separated list of user IDs that get unlimited usage
 * and all features unlocked (no paywall). Set via env var.
 */
const DEV_USER_IDS_RAW = process.env.BILLING_DEV_USER_IDS ?? '';

const DEV_USER_IDS: Set<string> = new Set(
  DEV_USER_IDS_RAW.split(',').map((id) => id.trim()).filter(Boolean),
);

/** Returns true if the user has dev-level billing bypass. */
export function isDevUser(userId: string): boolean {
  return DEV_USER_IDS.has(userId);
}
