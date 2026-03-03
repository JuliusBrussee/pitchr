'use client';

import { Check, X, Zap, ArrowRight, Coins } from 'lucide-react';
import type { BillingPlan, BillingInterval, BillingPlanId } from '@/types/billing';
import { buildFeatureList, buildExcludedFeatures } from '@/config/billing-features';
import { MONTHLY_CREDITS, CREDIT_COSTS } from '@/config/billing';

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
  const isFree = plan.id === 'free';
  const isPro = plan.featured;

  const price = interval === 'year' ? plan.pricing.yearly : plan.pricing.monthly;
  const monthlyEquivalent =
    interval === 'year' ? Math.round(plan.pricing.yearly / 12) : plan.pricing.monthly;

  const features = buildFeatureList(plan);
  const excludedFeatures = buildExcludedFeatures(plan);

  const isDisabled = isCurrent || isLoading || isFree;
  const ctaLabel = isCurrent
    ? 'Current Plan'
    : isFree
      ? 'Free Forever'
      : isLoading
        ? 'Loading...'
        : 'Upgrade to Pro';

  return (
    <div
      className="pricing-card relative flex flex-col h-full rounded-2xl p-6 transition-all duration-300"
      style={{
        backgroundColor: isPro
          ? 'var(--pricing-pro-bg)'
          : 'var(--bg-surface)',
        borderColor: isPro
          ? 'rgba(255, 89, 65, 0.4)'
          : 'var(--border-color)',
        borderWidth: isPro ? '1.5px' : '1px',
        borderStyle: 'solid',
        boxShadow: isPro
          ? '0 0 40px rgba(255, 89, 65, 0.12), 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
          : '0 2px 8px rgba(0, 0, 0, 0.03)',
        transform: isPro ? 'scale(1.02)' : 'scale(1)',
        zIndex: isPro ? 2 : 1,
      }}
    >
      {/* Pro glow ring */}
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
            : 'var(--border-color)',
        }}
      />

      {/* Credits callout */}
      <div
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-5"
        style={{
          background: isPro
            ? 'linear-gradient(135deg, rgba(255, 89, 65, 0.08), rgba(255, 170, 51, 0.05))'
            : 'var(--bg-surface-hover)',
          border: isPro
            ? '1px solid rgba(255, 89, 65, 0.15)'
            : '1px solid var(--border-color)',
        }}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
          style={{
            background: isPro
              ? 'linear-gradient(135deg, rgba(255, 89, 65, 0.15), rgba(255, 170, 51, 0.1))'
              : 'var(--bg-primary)',
            border: isPro ? 'none' : '1px solid var(--border-color)',
          }}
        >
          <Coins size={14} style={{ color: isPro ? '#ff5941' : 'var(--text-secondary)' }} />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {MONTHLY_CREDITS[plan.id]} credits/mo
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {isFree ? `${CREDIT_COSTS.pitchAnalysis} credit per analysis` : `${CREDIT_COSTS.deckGeneration} credits for deck gen`}
            {isPro && ' · Buy more anytime'}
          </p>
        </div>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <div
              className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 mt-px"
              style={{
                backgroundColor: isPro
                  ? 'rgba(255, 89, 65, 0.12)'
                  : 'var(--bg-surface-hover)',
              }}
            >
              <Check
                size={11}
                strokeWidth={3}
                style={{
                  color: isPro ? '#ff5941' : 'var(--text-secondary)',
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
              : 'transparent',
          color: isDisabled
            ? 'var(--text-muted)'
            : isPro
              ? '#fff'
              : 'var(--text-primary)',
          border: isDisabled || isPro
            ? 'none'
            : '1.5px solid var(--border-color)',
          boxShadow: isDisabled
            ? 'none'
            : isPro
              ? '0 4px 16px rgba(255, 89, 65, 0.3)'
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
