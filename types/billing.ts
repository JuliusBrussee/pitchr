/* ——— Billing & Subscription Types ——— */

export type BillingPlanId = 'free' | 'day_pass' | 'pro' | 'team';

export type BillingInterval = 'month' | 'year';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export interface PlanLimits {
  /** Max pitch analyses per billing period (null = unlimited) */
  runsPerPeriod: number | null;
  /** Max deck uploads per billing period (null = unlimited) */
  decksPerPeriod: number | null;
  /** Max Q&A sessions per billing period (null = unlimited) */
  qaSessionsPerPeriod: number | null;
  /** Max concurrent in-flight runs */
  maxConcurrentRuns: number;
  /** Whether section-level feedback is available */
  sectionFeedback: boolean;
  /** Whether vocabulary metrics are available */
  vocabularyMetrics: boolean;
  /** Whether historical comparison links are available */
  historicalLinks: boolean;
  /** Whether deck generation is available */
  deckGeneration: boolean;
  /** Priority in analysis queue (lower = higher priority) */
  queuePriority: number;
}

export interface PlanPricing {
  monthly: number;
  yearly: number;
  /** Stripe Price IDs — set via env vars or config */
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
}

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  description: string;
  limits: PlanLimits;
  pricing: PlanPricing;
  /** If true, this plan is the highlighted/recommended one */
  featured: boolean;
  /** If true, this plan is a one-time purchase (not a subscription) */
  oneTime?: boolean;
  /** Duration in hours for time-limited plans (e.g. day pass = 24) */
  durationHours?: number;
}

export interface DayPass {
  id: string;
  userId: string;
  purchasedAt: string;
  expiresAt: string;
  runsUsed: number;
  runsLimit: number;
  decksUsed: number;
  decksLimit: number;
  qaSessionsUsed: number;
  qaSessionsLimit: number;
  stripePaymentIntentId: string | null;
  status: 'active' | 'expired' | 'exhausted';
}

export interface Subscription {
  id: string;
  userId: string;
  planId: BillingPlanId;
  status: SubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsagePeriod {
  userId: string;
  periodStart: string;
  periodEnd: string;
  runsUsed: number;
  decksUsed: number;
  qaSessionsUsed: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  resource: 'runs' | 'decks' | 'qa_sessions';
  used: number;
  limit: number | null;
  remaining: number | null;
  planId: BillingPlanId;
}

export interface BillingPortalResult {
  url: string;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
}
