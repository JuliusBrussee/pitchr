'use client';

import { useState } from 'react';
import { Check, X, Zap, ArrowRight, Coins, Sparkles } from 'lucide-react';
import { isEarlyAdopterPeriod, getEarlyAdopterDaysRemaining, EARLY_ADOPTER_CREDITS } from '@/config/early-adopter';
import { BILLING_PLANS, CREDIT_PACKS_STATIC, MONTHLY_CREDITS, CREDIT_COSTS } from '@/config/billing';
import { buildFeatureList, buildExcludedFeatures } from '@/config/billing-features';
import type { BillingPlan, BillingInterval } from '@/types/billing';

interface LandingPlanCardProps {
  plan: BillingPlan;
  interval: BillingInterval;
  delay: number;
}

function LandingPlanCard({ plan, interval, delay }: LandingPlanCardProps) {
  const isFree = plan.id === 'free';
  const isPro = plan.featured;

  const monthlyEquivalent =
    interval === 'year' ? Math.round(plan.pricing.yearly / 12) : plan.pricing.monthly;
  const yearlyPrice = plan.pricing.yearly;

  const features = buildFeatureList(plan);
  const excludedFeatures = buildExcludedFeatures(plan);
  const monthlyCredits = MONTHLY_CREDITS[plan.id];

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

      {/* Header */}
      <div className="lp-card-header">
        <h3 className="lp-plan-name">{plan.name}</h3>
        <p className="lp-plan-desc">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="lp-price-block">
        {isFree ? (
          <>
            <span className="lp-price">€0</span>
            <span className="lp-price-period">/forever</span>
          </>
        ) : (
          <>
            <span className="lp-price">€{monthlyEquivalent}</span>
            <span className="lp-price-period">/mo</span>
            {interval === 'year' && (
              <p className="lp-price-note lp-price-note-green">
                €{yearlyPrice}/yr — save €{plan.pricing.monthly * 12 - yearlyPrice}
              </p>
            )}
            {interval === 'month' && (
              <p className="lp-price-note">Billed monthly — cancel anytime</p>
            )}
          </>
        )}
      </div>

      {/* Credits callout */}
      <div className={`lp-credits-callout ${isPro ? 'lp-credits-callout-pro' : ''}`}>
        <div className={`lp-credits-icon ${isPro ? 'lp-credits-icon-pro' : ''}`}>
          <Coins size={13} />
        </div>
        <div>
          <span className="lp-credits-count">{monthlyCredits} credits/mo</span>
          <span className="lp-credits-note">
            {isFree ? `${CREDIT_COSTS.pitchAnalysis} cr per analysis` : 'Buy more anytime'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="lp-divider" data-plan={plan.id} />

      {/* Features */}
      <ul className="lp-features">
        {features.map((f) => (
          <li key={f} className="lp-feature">
            <div
              className={`lp-feature-icon ${isPro ? 'lp-feature-icon-accent' : ''}`}
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
        className={`lp-cta ${isPro ? 'lp-cta-pro' : 'lp-cta-free'}`}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      >
        {isFree ? 'Get Started Free' : 'Upgrade to Pro'}
        {!isFree && <ArrowRight size={14} className="lp-cta-arrow" />}
      </a>
    </div>
  );
}

function LandingCreditsCard() {
  return (
    <div
      className="lp-card lp-card-credits reveal"
      style={{ transitionDelay: '200ms' }}
    >
      {/* Badge */}
      <div className="lp-badge lp-badge-credits">
        <Coins size={10} />
        Pay as you go
      </div>

      {/* Header */}
      <div className="lp-card-header">
        <h3 className="lp-plan-name">Credits</h3>
        <p className="lp-plan-desc">Buy once, use anytime — no subscription</p>
      </div>

      {/* Price range */}
      <div className="lp-price-block">
        <span className="lp-price">€5–€35</span>
        <span className="lp-price-period">/pack</span>
        <p className="lp-price-note">Credits never expire</p>
      </div>

      {/* Credit packs list */}
      <div className="lp-credit-packs-list">
        {CREDIT_PACKS_STATIC.map((pack) => {
          const perCredit = (pack.priceUsd / pack.credits).toFixed(2);
          const savingsPct = Math.round((1 - pack.priceUsd / pack.credits) * 100);
          const isBest = pack.slug === 'marathon';
          return (
            <div key={pack.slug} className={`lp-credit-row ${isBest ? 'lp-credit-row-best' : ''}`}>
              <div className="lp-credit-row-left">
                <span className="lp-credit-row-name">{pack.name}</span>
                <span className="lp-credit-row-count">{pack.credits} cr</span>
              </div>
              <div className="lp-credit-row-right">
                <span className="lp-credit-row-price">€{pack.priceUsd}</span>
                {savingsPct > 0 && (
                  <span className={`lp-credit-row-save ${savingsPct >= 40 ? 'lp-credit-row-save-high' : ''}`}>
                    −{savingsPct}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="lp-divider" />

      {/* Features */}
      <ul className="lp-features">
        <li className="lp-feature">
          <div className="lp-feature-icon">
            <Check size={11} strokeWidth={3} />
          </div>
          <span className="lp-feature-text">{CREDIT_COSTS.pitchAnalysis} cr per analysis</span>
        </li>
        <li className="lp-feature">
          <div className="lp-feature-icon">
            <Check size={11} strokeWidth={3} />
          </div>
          <span className="lp-feature-text">{CREDIT_COSTS.deckGeneration} cr per deck generation</span>
        </li>
        <li className="lp-feature">
          <div className="lp-feature-icon">
            <Check size={11} strokeWidth={3} />
          </div>
          <span className="lp-feature-text">Works with any plan</span>
        </li>
      </ul>

      {/* CTA */}
      <a
        href="#waitlist"
        className="lp-cta lp-cta-free"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      >
        Buy Credits
        <ArrowRight size={14} className="lp-cta-arrow" />
      </a>
    </div>
  );
}

export function LandingPricing() {
  const [interval, setInterval] = useState<BillingInterval>('month');
  const plans = Object.values(BILLING_PLANS).filter((p) => p.id !== 'day_pass');

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

        {/* Early adopter callout */}
        {isEarlyAdopterPeriod() && (
          <div
            className="reveal"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 20px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.04) 100%)',
              border: '1px solid rgba(245,158,11,0.2)',
              marginBottom: 24,
            }}
          >
            <Sparkles size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, color: 'var(--lp-text, #d1d5db)' }}>
              <strong style={{ color: '#f59e0b' }}>Early Adopter Bonus:</strong>{' '}
              Sign up now and get <strong>{EARLY_ADOPTER_CREDITS} free credits</strong> — {getEarlyAdopterDaysRemaining()} days left
            </p>
          </div>
        )}

        {/* 3-col grid: Free | Pro | Credits */}
        <div className="lp-grid">
          {plans.map((plan, i) => (
            <LandingPlanCard key={plan.id} plan={plan} interval={interval} delay={i * 100} />
          ))}
          <LandingCreditsCard />
        </div>
      </div>
    </section>
  );
}
