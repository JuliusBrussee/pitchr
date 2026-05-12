'use client';

import { useEffect, useRef, useState } from 'react';

const PLANS = [
  {
    name: 'Free',
    price: 0,
    period: '/forever',
    credits: '3 credits/mo',
    featured: false,
    barColor: 'var(--pp-text-muted)',
    barWidth: 15,
  },
  {
    name: 'Pro',
    price: 29,
    period: '/mo',
    credits: '60 credits/mo',
    featured: true,
    badge: 'Most Popular',
    barColor: 'var(--pp-accent)',
    barWidth: 80,
  },
  {
    name: 'Credits',
    price: 5,
    period: '–€35',
    credits: 'Buy anytime',
    featured: false,
    barColor: 'var(--pp-orange)',
    barWidth: 45,
  },
];

export function GrowthPricingHero() {
  const [cardsVisible, setCardsVisible] = useState<boolean[]>(PLANS.map(() => false));
  const [barWidths, setBarWidths] = useState<number[]>(PLANS.map(() => 0));
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Stagger card reveals
    PLANS.forEach((_, i) => {
      setTimeout(() => {
        if (!mountedRef.current) return;
        setCardsVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 600 + i * 150);
    });

    // Bar fills
    setTimeout(() => {
      if (!mountedRef.current) return;
      setBarWidths(PLANS.map((p) => p.barWidth));
    }, 1000);

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <div className="pp-hero-visual">
      <div className="pp-pricing-preview">
        {PLANS.map((plan, i) => (
          <div
            key={plan.name}
            className={`pp-mini-plan ${plan.featured ? 'pp-mini-plan-featured' : ''} ${cardsVisible[i] ? 'visible' : ''}`}
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            {plan.featured && <div className="pp-mini-plan-glow" />}
            {plan.badge && (
              <div className="pp-mini-plan-badge">{plan.badge}</div>
            )}
            <div className="pp-mini-plan-name">{plan.name}</div>
            <div className="pp-mini-plan-price">
              €{plan.price}
              <span>{plan.period}</span>
            </div>
            <div className="pp-mini-plan-credits">{plan.credits}</div>
            <div className="pp-mini-plan-bar">
              <div
                className="pp-mini-plan-bar-fill"
                style={{
                  width: `${barWidths[i]}%`,
                  backgroundColor: plan.barColor,
                  transitionDelay: `${i * 0.15}s`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
