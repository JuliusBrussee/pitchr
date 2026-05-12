import type { BillingPlan } from '@/types/billing';

/**
 * Build a human-readable feature list from a billing plan's limits.
 * Shared between PlanCard and LandingPricing components.
 */
export function buildFeatureList(plan: BillingPlan): string[] {
  const { limits } = plan;
  const features: string[] = [];
  const isOneTime = plan.oneTime === true;
  const periodLabel = isOneTime ? '' : '/month';

  features.push(
    limits.runsPerPeriod === null
      ? 'Unlimited pitch analyses'
      : `${limits.runsPerPeriod} pitch analyses${periodLabel}`,
  );

  features.push(
    limits.decksPerPeriod === null
      ? 'Unlimited deck uploads'
      : `${limits.decksPerPeriod} deck upload${limits.decksPerPeriod !== 1 ? 's' : ''}${periodLabel}`,
  );

  const qaMinutes = limits.qaSecondsPerPeriod !== null ? Math.floor(limits.qaSecondsPerPeriod / 60) : null;
  features.push(
    qaMinutes === null
      ? 'Unlimited Q&A time'
      : `${qaMinutes} min Q&A time${periodLabel}`,
  );
  features.push(
    `Up to ${Math.floor(limits.maxQaSessionSeconds / 60)}:${String(limits.maxQaSessionSeconds % 60).padStart(2, '0')} per session`,
  );

  if (limits.sectionFeedback) features.push('Section-level feedback');
  if (limits.vocabularyMetrics) features.push('Vocabulary analytics');
  if (limits.historicalLinks) features.push('Historical comparison');
  if (limits.deckGeneration) features.push('AI deck generation');

  features.push(
    limits.maxConcurrentRuns > 1
      ? `${limits.maxConcurrentRuns} concurrent analyses`
      : '1 analysis at a time',
  );

  if (limits.queuePriority <= 10) features.push('Priority queue');

  return features;
}

/**
 * Build a list of features excluded from a plan (shown as crossed-out).
 * Currently only applies to the free plan.
 */
export function buildExcludedFeatures(plan: BillingPlan): string[] {
  if (plan.id !== 'free') return [];
  const excluded: string[] = [];
  if (!plan.limits.sectionFeedback) excluded.push('Section-level feedback');
  if (!plan.limits.vocabularyMetrics) excluded.push('Vocabulary analytics');
  if (!plan.limits.historicalLinks) excluded.push('Historical comparison');
  if (!plan.limits.deckGeneration) excluded.push('AI deck generation');
  return excluded;
}
