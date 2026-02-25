'use client';

import { Check, Clock } from 'lucide-react';
import type { BillingPlan, BillingInterval, BillingPlanId } from '@/types/billing';

interface PlanCardProps {
  plan: BillingPlan;
  interval: BillingInterval;
  currentPlanId: BillingPlanId;
  isLoading: boolean;
  onSelect: (planId: BillingPlanId, interval: BillingInterval) => void;
  /** Whether the user has an active day pass */
  isDayPassActive?: boolean;
}

export function PlanCard({
  plan,
  interval,
  currentPlanId,
  isLoading,
  onSelect,
  isDayPassActive,
}: PlanCardProps) {
  const isCurrent = plan.id === currentPlanId;
  const isFree = plan.id === 'free';
  const isDayPass = plan.oneTime === true;
  const isDayPassCard = plan.id === 'day_pass';

  const price = interval === 'year' ? plan.pricing.yearly : plan.pricing.monthly;
  const monthlyEquivalent =
    interval === 'year' ? Math.round(plan.pricing.yearly / 12) : plan.pricing.monthly;

  const features = buildFeatureList(plan);

  const isDisabled = isCurrent || isLoading || isFree || (isDayPassCard && isDayPassActive);
  const ctaLabel = isDayPassCard && isDayPassActive
    ? 'Pass Active'
    : isCurrent
      ? 'Current Plan'
      : isFree
        ? 'Free Forever'
        : isLoading
          ? 'Loading...'
          : isDayPass
            ? 'Buy Day Pass'
            : 'Upgrade';

  return (
    <div
      className="relative flex flex-col rounded-2xl border p-5 transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: plan.featured ? '#ff5941' : isDayPassCard ? '#ffaa33' : 'var(--border-color)',
        borderWidth: plan.featured || isDayPassCard ? '2px' : '1px',
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

      {isDayPassCard && !plan.featured && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: '#ffaa33', color: '#fff' }}
        >
          Pitch Day
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
        ) : isDayPass ? (
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              ${plan.pricing.monthly}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              /24h
            </span>
          </div>
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
        {isDayPass && (
          <li className="flex items-start gap-2">
            <Clock
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: '#ffaa33' }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {plan.durationHours}-hour access window
            </span>
          </li>
        )}
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: plan.featured ? '#ff5941' : isDayPassCard ? '#ffaa33' : 'var(--text-secondary)' }}
            />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        disabled={isDisabled}
        onClick={() => onSelect(plan.id, interval)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isDisabled
            ? 'var(--bg-surface-hover)'
            : plan.featured
              ? '#ff5941'
              : isDayPassCard
                ? '#ffaa33'
                : 'var(--bg-surface-hover)',
          color: isDisabled
            ? 'var(--text-muted)'
            : plan.featured || isDayPassCard
              ? '#fff'
              : 'var(--text-primary)',
          border: isDisabled || plan.featured || isDayPassCard ? 'none' : '1px solid var(--border-color)',
        }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

function buildFeatureList(plan: BillingPlan): string[] {
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

  features.push(
    limits.qaSessionsPerPeriod === null
      ? 'Unlimited Q&A sessions'
      : `${limits.qaSessionsPerPeriod} Q&A session${limits.qaSessionsPerPeriod !== 1 ? 's' : ''}${periodLabel}`,
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
