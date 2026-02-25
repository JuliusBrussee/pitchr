'use client';

import { Check } from 'lucide-react';
import type { BillingPlan, BillingInterval, BillingPlanId } from '@/types/billing';

interface PlanCardProps {
  plan: BillingPlan;
  interval: BillingInterval;
  currentPlanId: BillingPlanId;
  isLoading: boolean;
  onSelect: (planId: BillingPlanId, interval: BillingInterval) => void;
}

export function PlanCard({
  plan,
  interval,
  currentPlanId,
  isLoading,
  onSelect,
}: PlanCardProps) {
  const isCurrent = plan.id === currentPlanId;
  const price = interval === 'year' ? plan.pricing.yearly : plan.pricing.monthly;
  const monthlyEquivalent =
    interval === 'year' ? Math.round(plan.pricing.yearly / 12) : plan.pricing.monthly;
  const isFree = plan.id === 'free';

  const features = buildFeatureList(plan);

  return (
    <div
      className="relative flex flex-col rounded-2xl border p-5 transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: plan.featured ? '#ff5941' : 'var(--border-color)',
        borderWidth: plan.featured ? '2px' : '1px',
      }}
    >
      {plan.featured && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: '#ff5941', color: '#fff' }}
        >
          Most Popular
        </div>
      )}

      {/* Plan name + price */}
      <div className="mb-4">
        <h3
          className="text-lg font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {plan.name}
        </h3>
        <p
          className="text-xs mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {plan.description}
        </p>
      </div>

      <div className="mb-5">
        {isFree ? (
          <span
            className="text-3xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Free
          </span>
        ) : (
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              ${monthlyEquivalent}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              /mo
            </span>
            {interval === 'year' && (
              <span
                className="text-xs ml-1"
                style={{ color: 'var(--text-muted)' }}
              >
                (${price}/yr)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2 mb-5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: plan.featured ? '#ff5941' : 'var(--text-secondary)' }}
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        disabled={isCurrent || isLoading || isFree}
        onClick={() => onSelect(plan.id, interval)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isCurrent
            ? 'var(--bg-surface-hover)'
            : plan.featured
              ? '#ff5941'
              : 'var(--bg-surface-hover)',
          color: isCurrent
            ? 'var(--text-muted)'
            : plan.featured
              ? '#fff'
              : 'var(--text-primary)',
          border: isCurrent || plan.featured ? 'none' : '1px solid var(--border-color)',
        }}
      >
        {isCurrent ? 'Current Plan' : isFree ? 'Free Forever' : isLoading ? 'Loading...' : 'Upgrade'}
      </button>
    </div>
  );
}

function buildFeatureList(plan: BillingPlan): string[] {
  const { limits } = plan;
  const features: string[] = [];

  features.push(
    limits.runsPerPeriod === null
      ? 'Unlimited pitch analyses'
      : `${limits.runsPerPeriod} pitch analyses/month`,
  );

  features.push(
    limits.decksPerPeriod === null
      ? 'Unlimited deck uploads'
      : `${limits.decksPerPeriod} deck upload${limits.decksPerPeriod !== 1 ? 's' : ''}/month`,
  );

  features.push(
    limits.qaSessionsPerPeriod === null
      ? 'Unlimited Q&A sessions'
      : `${limits.qaSessionsPerPeriod} Q&A session${limits.qaSessionsPerPeriod !== 1 ? 's' : ''}/month`,
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

  return features;
}
