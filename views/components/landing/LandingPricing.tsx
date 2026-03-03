'use client';

import { useState } from 'react';
import { Check, X, Zap, ArrowRight, Coins, TrendingDown, Sparkles } from 'lucide-react';
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
            <span className="lp-price">$0</span>
            <span className="lp-price-period">/forever</span>
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

function LandingCreditPack({ pack, index }: { pack: typeof CREDIT_PACKS_STATIC[number]; index: number }) {
  const perCredit = (pack.priceUsd / pack.credits).toFixed(2);
  const savingsPct = Math.round((1 - pack.priceUsd / pack.credits) * 100);
  const isBestValue = pack.slug === 'marathon';

  return (
    <div
      className={`lp-credit-pack reveal ${isBestValue ? 'lp-credit-pack-best' : ''}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Best value accent bar */}
      {isBestValue && <div className="lp-credit-pack-accent" />}

      {/* Savings badge */}
      {savingsPct > 0 && (
        <div className={`lp-credit-savings ${savingsPct >= 40 ? 'lp-credit-savings-high' : ''}`}>
          <TrendingDown size={8} />
          Save {savingsPct}%
        </div>
      )}

      <p className="lp-credit-pack-name">{pack.name}</p>

      <div className="lp-credit-pack-amount">
        <div className="lp-credit-pack-coin">
          <Coins size={11} />
        </div>
        <span className="lp-credit-pack-number">{pack.credits}</span>
        <span className="lp-credit-pack-label">credits</span>
      </div>

      <p className="lp-credit-pack-price">${pack.priceUsd}</p>
      <p className="lp-credit-pack-rate">${perCredit}/credit</p>

      <a
        href="#waitlist"
        className={`lp-credit-pack-cta ${isBestValue ? 'lp-credit-pack-cta-best' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      >
        Buy Credits
        <ArrowRight size={10} />
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

        {/* Cards — 2 plans side by side */}
        <div className="lp-grid">
          {plans.map((plan, i) => (
            <LandingPlanCard key={plan.id} plan={plan} interval={interval} delay={i * 100} />
          ))}
        </div>

        {/* Credit packs section */}
        <div className="lp-credits-section reveal">
          <div className="lp-credits-header">
            <div className="lp-credits-header-icon">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="lp-credits-title">Or buy credits as you go</h3>
              <p className="lp-credits-subtitle">
                No subscription required — credits never expire. Use {CREDIT_COSTS.pitchAnalysis} credit per analysis, {CREDIT_COSTS.deckGeneration} for deck generation.
              </p>
            </div>
          </div>

          <div className="lp-credit-grid">
            {CREDIT_PACKS_STATIC.map((pack, i) => (
              <LandingCreditPack key={pack.slug} pack={pack} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
