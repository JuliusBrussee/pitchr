'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import type { FeatureConfig } from '@/config/features';
import { FeatureHeroDemo } from '@/views/components/features/FeatureHeroDemo';

/* ── Scroll reveal hook (inline to avoid circular deps) ── */
function useFeatureReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.classList.add('fp-visible');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const children = el.querySelectorAll('.fp-stagger');
            children.forEach((child, i) => {
              (child as HTMLElement).style.transitionDelay = `${i * 0.1}s`;
            });
            el.classList.add('fp-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

/* ── Animated counter hook ── */
function useCountUp(target: number, duration: number, visible: boolean) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [visible, target, duration]);

  return value;
}

/* ── Stats Strip ── */
function StatsStrip({ stats, color, visible }: { stats: FeatureConfig['stats']; color: string; visible: boolean }) {
  return (
    <div className="fp-stats-strip">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="fp-stat fp-stagger"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${i * 0.1}s` }}
        >
          <div className="fp-stat-value" style={{ color }}>{stat.value}</div>
          <div className="fp-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── How It Works ── */
function HowItWorksSection({ steps, color }: { steps: FeatureConfig['howItWorks']; color: string }) {
  const ref = useFeatureReveal(0.1);

  return (
    <section className="fp-section" ref={ref}>
      <h2 className="fp-section-title">How it works</h2>
      <div className="fp-steps">
        {steps.map((step, i) => (
          <div key={step.step} className="fp-step fp-stagger">
            <div className="fp-step-number" style={{ backgroundColor: color }}>{step.step}</div>
            {i < steps.length - 1 && <div className="fp-step-connector" style={{ backgroundColor: `${color}30` }} />}
            <h3 className="fp-step-title">{step.title}</h3>
            <p className="fp-step-desc">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Use Cases ── */
function UseCasesSection({ useCases, color }: { useCases: FeatureConfig['useCases']; color: string }) {
  const ref = useFeatureReveal(0.1);

  return (
    <section className="fp-section" ref={ref}>
      <h2 className="fp-section-title">Use cases</h2>
      <p className="fp-section-sub">Real scenarios where this feature makes the difference.</p>
      <div className="fp-use-cases">
        {useCases.map((uc) => (
          <div key={uc.title} className="fp-use-case fp-stagger">
            <div className="fp-use-case-icon">{uc.icon}</div>
            <div className="fp-use-case-persona" style={{ color }}>{uc.persona}</div>
            <h3 className="fp-use-case-title">{uc.title}</h3>
            <p className="fp-use-case-desc">{uc.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Before/After Comparison ── */
function ComparisonSection({ comparison, color }: { comparison: FeatureConfig['comparison']; color: string }) {
  const ref = useFeatureReveal(0.1);

  return (
    <section className="fp-section fp-comparison-section" ref={ref}>
      <h2 className="fp-section-title">Without vs With Pitchr</h2>
      <div className="fp-comparison-grid">
        {comparison.map((c, i) => (
          <div key={i} className="fp-comparison-row fp-stagger">
            <div className="fp-comparison-without">
              <span className="fp-comparison-icon fp-comparison-icon-x">✕</span>
              <span>{c.without}</span>
            </div>
            <div className="fp-comparison-arrow">→</div>
            <div className="fp-comparison-with" style={{ borderColor: `${color}40` }}>
              <span className="fp-comparison-icon fp-comparison-icon-check" style={{ backgroundColor: `${color}20`, color }}>✓</span>
              <span>{c.with}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Enhanced Benefits ── */
function BenefitsSection({ benefits, color }: { benefits: FeatureConfig['benefits']; color: string }) {
  const ref = useFeatureReveal(0.1);

  return (
    <section className="fp-section" ref={ref}>
      <h2 className="fp-section-title">Key benefits</h2>
      <div className="fp-benefits-grid">
        {benefits.map((b) => (
          <div key={b.title} className="fp-benefit fp-stagger">
            <div className="fp-benefit-icon-wrap" style={{ backgroundColor: `${color}15` }}>
              <span className="fp-benefit-icon">{b.icon}</span>
            </div>
            <h3 className="fp-benefit-title">{b.title}</h3>
            <p className="fp-benefit-desc">{b.description}</p>
            <div className="fp-benefit-accent" style={{ backgroundColor: color }} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Feature Nav (other features) ── */
function FeatureNav({ current, features }: { current: string; features: FeatureConfig[] }) {
  const ref = useFeatureReveal(0.1);
  const others = features.filter((f) => f.slug !== current).slice(0, 4);

  return (
    <section className="fp-section fp-nav-section" ref={ref}>
      <h2 className="fp-section-title">Explore more features</h2>
      <div className="fp-nav-grid">
        {others.map((f) => (
          <Link key={f.slug} href={`/features/${f.slug}`} className="fp-nav-card fp-stagger">
            <div className="fp-nav-pill" style={{ backgroundColor: f.color }}>{f.label}</div>
            <div className="fp-nav-headline">{f.headline}</div>
            <span className="fp-nav-arrow" style={{ color: f.color }}>→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Main Client Component ── */
export function FeaturePageClient({ feature, allFeatures }: { feature: FeatureConfig; allFeatures: FeatureConfig[] }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHeroVisible(true);
          obs.unobserve(entries[0].target);
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(heroEl);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const statsEl = statsRef.current;
    if (!statsEl) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsVisible(true);
          obs.unobserve(entries[0].target);
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(statsEl);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="fp-page" style={{ '--fp-color': feature.color } as React.CSSProperties}>
      {/* Background aura */}
      <div
        className="fp-aura"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${feature.color}12 0%, transparent 70%)`,
        }}
      />

      <div className="fp-container">
        {/* Hero */}
        <section className="fp-hero" ref={heroRef}>
          <div
            className="fp-hero-content"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <span className="fp-label-pill" style={{ backgroundColor: feature.color }}>
              {feature.label}
            </span>
            <h1 className="fp-headline">{feature.headline}</h1>
            <p className="fp-tagline">{feature.tagline}</p>
          </div>

          {/* Hero Demo */}
          <div
            className="fp-hero-demo"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
              transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1) 0.3s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.3s',
            }}
          >
            <FeatureHeroDemo slug={feature.slug} color={feature.color} visible={heroVisible} />
          </div>
        </section>

        {/* Stats Strip */}
        <div ref={statsRef}>
          <StatsStrip stats={feature.stats} color={feature.color} visible={statsVisible} />
        </div>

        {/* How It Works */}
        <HowItWorksSection steps={feature.howItWorks} color={feature.color} />

        {/* Interactive Demo (larger) */}
        <BenefitsSection benefits={feature.benefits} color={feature.color} />

        {/* Use Cases */}
        <UseCasesSection useCases={feature.useCases} color={feature.color} />

        {/* Comparison */}
        <ComparisonSection comparison={feature.comparison} color={feature.color} />

        {/* Other Features Nav */}
        <FeatureNav current={feature.slug} features={allFeatures} />

        {/* CTA */}
        <section className="fp-cta">
          <div className="fp-cta-glow" style={{ background: `radial-gradient(circle at center, ${feature.color}20 0%, transparent 70%)` }} />
          <h2 className="fp-cta-title">{feature.ctaHeadline}</h2>
          <p className="fp-cta-desc">{feature.ctaDescription}</p>
          <Link
            href="/#waitlist"
            className="fp-cta-btn"
            style={{ background: feature.color }}
          >
            Join the Waitlist
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <Link href="/" className="fp-back-link">&larr; Back to home</Link>
        </section>
      </div>
    </div>
  );
}
