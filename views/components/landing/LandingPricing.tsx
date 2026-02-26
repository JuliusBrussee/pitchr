'use client';

import { useState } from 'react';
import { Check, X, Clock, Zap, ArrowRight } from 'lucide-react';
import { BILLING_PLANS } from '@/config/billing';
import type { BillingPlan, BillingInterval } from '@/types/billing';

function buildFeatureList(plan: BillingPlan): string[] {
  const { limits } = plan;
  const features: string[] = [];
  const isOneTime = plan.oneTime === true;
  const periodLabel = isOneTime ? '' : '/mo';

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
  if (limits.maxConcurrentRuns > 1) features.push(`${limits.maxConcurrentRuns} concurrent analyses`);
  if (limits.queuePriority <= 10) features.push('Priority queue');
  return features;
}

function buildExcludedFeatures(plan: BillingPlan): string[] {
  if (plan.id !== 'free') return [];
  const excluded: string[] = [];
  if (!plan.limits.sectionFeedback) excluded.push('Section-level feedback');
  if (!plan.limits.vocabularyMetrics) excluded.push('Vocabulary analytics');
  if (!plan.limits.historicalLinks) excluded.push('Historical comparison');
  if (!plan.limits.deckGeneration) excluded.push('AI deck generation');
  return excluded;
}

interface LandingPlanCardProps {
  plan: BillingPlan;
  interval: BillingInterval;
  delay: number;
}

function LandingPlanCard({ plan, interval, delay }: LandingPlanCardProps) {
  const isFree = plan.id === 'free';
  const isDayPass = plan.oneTime === true;
  const isPro = plan.featured;

  const monthlyEquivalent =
    interval === 'year' ? Math.round(plan.pricing.yearly / 12) : plan.pricing.monthly;
  const yearlyPrice = plan.pricing.yearly;

  const features = buildFeatureList(plan);
  const excludedFeatures = buildExcludedFeatures(plan);

  return (
    <div
      className="lp-card reveal"
      data-plan={plan.id}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Accent glow for Pro */}
      {isPro && <div className="lp-card-glow" />}

      {/* Badge */}
      {isPro && (
        <div className="lp-badge lp-badge-pro">
          <Zap size={10} fill="#fff" />
          Most Popular
        </div>
      )}
      {plan.id === 'day_pass' && (
        <div className="lp-badge lp-badge-day">
          <Clock size={10} />
          Pitch Day
        </div>
      )}

      {/* Header */}
      <div className="lp-card-header">
        <h3 className="lp-plan-name">{plan.name}</h3>
        <p className="lp-plan-desc">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="lp-price-block">
        {isFree ? (
          <>
            <span className="lp-price">$0</span>
            <span className="lp-price-period">/forever</span>
          </>
        ) : isDayPass ? (
          <>
            <span className="lp-price">${plan.pricing.monthly}</span>
            <span className="lp-price-period">/24 hours</span>
            <p className="lp-price-note lp-price-note-amber">One-time — no subscription</p>
          </>
        ) : (
          <>
            <span className="lp-price">${monthlyEquivalent}</span>
            <span className="lp-price-period">/mo</span>
            {interval === 'year' && (
              <p className="lp-price-note lp-price-note-green">
                ${yearlyPrice}/yr — save ${plan.pricing.monthly * 12 - yearlyPrice}
              </p>
            )}
            {interval === 'month' && (
              <p className="lp-price-note">Billed monthly — cancel anytime</p>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="lp-divider" data-plan={plan.id} />

      {/* Features */}
      <ul className="lp-features">
        {isDayPass && (
          <li className="lp-feature">
            <div className="lp-feature-icon lp-feature-icon-amber">
              <Clock size={11} />
            </div>
            <span className="lp-feature-text lp-feature-text-bold">
              {plan.durationHours}-hour full access window
            </span>
          </li>
        )}
        {features.map((f) => (
          <li key={f} className="lp-feature">
            <div
              className={`lp-feature-icon ${
                isPro ? 'lp-feature-icon-accent' : plan.id === 'day_pass' ? 'lp-feature-icon-amber' : ''
              }`}
            >
              <Check size={11} strokeWidth={3} />
            </div>
            <span className="lp-feature-text">{f}</span>
          </li>
        ))}
        {excludedFeatures.map((f) => (
          <li key={f} className="lp-feature lp-feature-excluded">
            <div className="lp-feature-icon lp-feature-icon-muted">
              <X size={10} strokeWidth={2.5} />
            </div>
            <span className="lp-feature-text">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href="#waitlist"
        className={`lp-cta ${isPro ? 'lp-cta-pro' : plan.id === 'day_pass' ? 'lp-cta-day' : 'lp-cta-free'}`}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      >
        {isFree ? 'Get Started Free' : isDayPass ? 'Buy Day Pass' : 'Upgrade to Pro'}
        {!isFree && <ArrowRight size={14} className="lp-cta-arrow" />}
      </a>
    </div>
  );
}

export function LandingPricing() {
  const [interval, setInterval] = useState<BillingInterval>('month');
  const plans = Object.values(BILLING_PLANS);

  return (
    <section className="lp-section" id="pricing">
      <div className="container">
        <div className="lp-header reveal">
          <div className="section-label" style={{ textAlign: 'center' }}>Simple Pricing</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Invest in your<br />
            <span className="accent">next round.</span>
          </h2>
          <p className="section-desc" style={{ textAlign: 'center', margin: '0 auto 40px' }}>
            Start free. Upgrade when you are ready to get serious about fundraising.
          </p>

          {/* Interval toggle */}
          <div className="lp-toggle-wrap">
            <button
              className={`lp-toggle-btn ${interval === 'month' ? 'lp-toggle-active' : ''}`}
              onClick={() => setInterval('month')}
            >
              Monthly
            </button>
            <button
              className={`lp-toggle-btn ${interval === 'year' ? 'lp-toggle-active' : ''}`}
              onClick={() => setInterval('year')}
            >
              Yearly
              <span className="lp-toggle-save">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="lp-grid">
          {plans.map((plan, i) => (
            <LandingPlanCard key={plan.id} plan={plan} interval={interval} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
