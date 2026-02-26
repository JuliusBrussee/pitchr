'use client';

import { Check, Clock, X, Zap, ArrowRight } from 'lucide-react';
import type { BillingPlan, BillingInterval, BillingPlanId } from '@/types/billing';
import { buildFeatureList, buildExcludedFeatures } from '@/config/billing-features';

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
  const isPro = plan.featured;

  const price = interval === 'year' ? plan.pricing.yearly : plan.pricing.monthly;
  const monthlyEquivalent =
    interval === 'year' ? Math.round(plan.pricing.yearly / 12) : plan.pricing.monthly;

  const features = buildFeatureList(plan);
  const excludedFeatures = buildExcludedFeatures(plan);

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
            : 'Upgrade to Pro';

  return (
    <div
      className="pricing-card relative flex flex-col rounded-2xl p-6 transition-all duration-300"
      style={{
        backgroundColor: isPro
          ? 'var(--pricing-pro-bg)'
          : 'var(--bg-surface)',
        borderColor: isPro
          ? 'rgba(255, 89, 65, 0.4)'
          : isDayPassCard
            ? 'rgba(255, 170, 51, 0.3)'
            : 'var(--border-color)',
        borderWidth: isPro ? '1.5px' : '1px',
        borderStyle: 'solid',
        boxShadow: isPro
          ? '0 0 40px rgba(255, 89, 65, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
          : isDayPassCard
            ? '0 4px 20px rgba(255, 170, 51, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)'
            : '0 2px 8px rgba(0, 0, 0, 0.03)',
        transform: isPro ? 'scale(1.02)' : 'scale(1)',
        zIndex: isPro ? 2 : 1,
      }}
    >
      {/* Pro glow ring - subtle animated gradient border effect */}
      {isPro && (
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none pricing-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 89, 65, 0.3), rgba(255, 170, 51, 0.15), rgba(255, 89, 65, 0.3))',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1.5px',
            borderRadius: 'inherit',
          }}
        />
      )}

      {/* Badge */}
      {isPro && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #ff5941, #e63b26)',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(255, 89, 65, 0.4)',
            letterSpacing: '0.08em',
          }}
        >
          <Zap size={11} fill="#fff" />
          Most Popular
        </div>
      )}

      {isDayPassCard && !isPro && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #ffaa33, #f59e0b)',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(255, 170, 51, 0.35)',
            letterSpacing: '0.08em',
          }}
        >
          <Clock size={11} />
          Pitch Day
        </div>
      )}

      {/* Plan name + description */}
      <div className="mb-5 mt-1">
        <h3
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {plan.name}
        </h3>
        <p
          className="text-[13px] mt-1.5 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {plan.description}
        </p>
      </div>

      {/* Price block */}
      <div className="mb-6">
        {isFree ? (
          <div className="flex items-baseline gap-1">
            <span
              className="text-4xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              $0
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              /forever
            </span>
          </div>
        ) : isDayPass ? (
          <div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-4xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                ${plan.pricing.monthly}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                /24 hours
              </span>
            </div>
            <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#f59e0b' }}>
              One-time purchase — no subscription
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-4xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                ${monthlyEquivalent}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                /mo
              </span>
            </div>
            {interval === 'year' && (
              <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#22c55e' }}>
                ${price}/year — save ${plan.pricing.monthly * 12 - price}
              </p>
            )}
            {interval === 'month' && (
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Billed monthly — cancel anytime
              </p>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        className="h-px mb-5"
        style={{
          background: isPro
            ? 'linear-gradient(90deg, transparent, rgba(255, 89, 65, 0.2), transparent)'
            : isDayPassCard
              ? 'linear-gradient(90deg, transparent, rgba(255, 170, 51, 0.2), transparent)'
              : 'var(--border-color)',
        }}
      />

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6">
        {isDayPass && (
          <li className="flex items-start gap-2.5">
            <div
              className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 mt-px"
              style={{ backgroundColor: 'rgba(255, 170, 51, 0.15)' }}
            >
              <Clock size={11} style={{ color: '#ffaa33' }} />
            </div>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {plan.durationHours}-hour full access window
            </span>
          </li>
        )}
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <div
              className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 mt-px"
              style={{
                backgroundColor: isPro
                  ? 'rgba(255, 89, 65, 0.12)'
                  : isDayPassCard
                    ? 'rgba(255, 170, 51, 0.1)'
                    : 'var(--bg-surface-hover)',
              }}
            >
              <Check
                size={11}
                strokeWidth={3}
                style={{
                  color: isPro ? '#ff5941' : isDayPassCard ? '#ffaa33' : 'var(--text-secondary)',
                }}
              />
            </div>
            <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {feature}
            </span>
          </li>
        ))}
        {excludedFeatures.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 opacity-40">
            <div
              className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 mt-px"
              style={{ backgroundColor: 'var(--bg-surface-hover)' }}
            >
              <X size={10} strokeWidth={2.5} style={{ color: 'var(--text-muted)' }} />
            </div>
            <span className="text-[13px] line-through" style={{ color: 'var(--text-muted)' }}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        disabled={isDisabled}
        onClick={() => onSelect(plan.id, interval)}
        className="pricing-cta group w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: isDisabled
            ? 'var(--bg-surface-hover)'
            : isPro
              ? 'linear-gradient(135deg, #ff5941, #e63b26)'
              : isDayPassCard
                ? 'linear-gradient(135deg, #ffaa33, #f59e0b)'
                : 'transparent',
          color: isDisabled
            ? 'var(--text-muted)'
            : isPro || isDayPassCard
              ? '#fff'
              : 'var(--text-primary)',
          border: isDisabled || isPro || isDayPassCard
            ? 'none'
            : '1.5px solid var(--border-color)',
          boxShadow: isDisabled
            ? 'none'
            : isPro
              ? '0 4px 16px rgba(255, 89, 65, 0.3)'
              : isDayPassCard
                ? '0 4px 16px rgba(255, 170, 51, 0.25)'
                : 'none',
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        {ctaLabel}
        {!isDisabled && !isFree && (
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        )}
      </button>
    </div>
  );
}

