/* ——— Billing & Subscription Types ——— */

export type BillingPlanId = 'free' | 'day_pass' | 'pro';

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
  /** Total Q&A seconds budget per billing period (null = unlimited) */
  qaSecondsPerPeriod: number | null;
  /** Max duration of a single Q&A session in seconds */
  maxQaSessionSeconds: number;
  /** Sessions shorter than this are free (handles disconnects/mic failures) */
  qaGracePeriodSeconds: number;
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
  qaSecondsUsed: number;
  qaSecondsLimit: number;
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
  qaSecondsUsed: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  resource: 'runs' | 'decks' | 'qa_seconds' | 'deck_generation';
  used: number;
  limit: number | null;
  remaining: number | null;
  planId: BillingPlanId;
}

export interface QaBudgetInfo {
  /** Total seconds budget for the current period */
  budgetSeconds: number | null;
  /** Seconds already used this period */
  usedSeconds: number;
  /** Seconds remaining (null = unlimited) */
  remainingSeconds: number | null;
  /** Max duration for a single session (seconds) */
  maxSessionSeconds: number;
  /** Sessions shorter than this are free */
  gracePeriodSeconds: number;
  /** Duration options available for session selection */
  durationOptions: number[];
  /** Default/recommended session duration */
  defaultDurationSeconds: number;
  /** Current plan ID */
  planId: BillingPlanId;
}

export interface BillingPortalResult {
  url: string;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

/* ——— Credit System Types ——— */

export type CreditType = 'monthly' | 'purchased' | 'bonus' | 'refund';

export type CreditResource = 'pitch_analysis' | 'deck_upload' | 'qa_session' | 'deck_generation';

export interface CreditBalance {
  userId: string;
  monthlyCredits: number;
  monthlyCreditsLimit: number;
  purchasedCredits: number;
  bonusCredits: number;
  bonusCreditsExpiresAt: string | null;
  totalAvailable: number;
  periodStart: string;
  periodEnd: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  creditType: CreditType;
  source: string;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface CreditPack {
  id: string;
  name: string;
  slug: string;
  credits: number;
  priceUsd: number;
  stripePriceId: string | null;
  active: boolean;
  sortOrder: number;
}

export interface CreditCosts {
  pitchAnalysis: number;
  deckUpload: number;
  qaSession: number;
  deckGeneration: number;
}

export interface CreditCheckResult {
  allowed: boolean;
  creditsRequired: number;
  totalAvailable: number;
  monthlyCredits: number;
  purchasedCredits: number;
  bonusCredits: number;
}
