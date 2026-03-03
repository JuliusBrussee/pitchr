'use client';

import { useState } from 'react';
import { Check, X, Clock, Zap, ArrowRight } from 'lucide-react';
import { BILLING_PLANS, CREDIT_PACKS_STATIC } from '@/config/billing';
import { buildFeatureList, buildExcludedFeatures } from '@/config/billing-features';
import type { BillingPlan, BillingInterval } from '@/types/billing';

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

        {/* Credit packs section */}
        <div className="reveal" style={{ marginTop: '48px', textAlign: 'center' }}>
          <p className="section-desc" style={{ marginBottom: '24px' }}>
            Or buy credits as you go — no subscription required
          </p>
          <div className="lp-credit-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', maxWidth: '640px', margin: '0 auto' }}>
            {CREDIT_PACKS_STATIC.map((pack) => (
              <div
                key={pack.slug}
                className="lp-card reveal"
                style={{ padding: '20px', textAlign: 'center' }}
              >
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {pack.name}
                </p>
                <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {pack.credits} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)' }}>credits</span>
                </p>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#ff5941', margin: '4px 0' }}>
                  ${pack.priceUsd}
                </p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  ${(pack.priceUsd / pack.credits).toFixed(2)}/credit
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
