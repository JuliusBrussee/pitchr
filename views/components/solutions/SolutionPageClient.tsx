'use client';

import { useEffect, useRef, useState } from 'react';
import type { SolutionConfig } from '@/config/solutions';
import type { FeatureConfig } from '@/config/features';
import { SolutionHero } from '@/views/components/solutions/SolutionHero';
import { SolutionScenario } from '@/views/components/solutions/SolutionScenario';
import { SolutionTimeline } from '@/views/components/solutions/SolutionTimeline';
import { SolutionTransformation } from '@/views/components/solutions/SolutionTransformation';
import { SolutionFeatureCards } from '@/views/components/solutions/SolutionFeatureCards';
import { SolutionNav } from '@/views/components/solutions/SolutionNav';
import { SolutionEffects } from '@/views/components/solutions/SolutionEffects';
import { useSolutionAnimations } from '@/views/components/solutions/useSolutionAnimations';

/* ── Scroll reveal hook ── */
function useSolutionReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.classList.add('sp-visible');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const children = el.querySelectorAll('.sp-stagger');
            children.forEach((child, i) => {
              (child as HTMLElement).style.transitionDelay = `${i * 0.1}s`;
            });
            el.classList.add('sp-visible');
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

/* ── Stats Strip (reuses pattern from FeaturePageClient) ── */
function StatsStrip({ stats, color, visible }: { stats: SolutionConfig['stats']; color: string; visible: boolean }) {
  return (
    <div className="sp-stats-strip">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="sp-stat sp-stagger"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transitionDelay: `${i * 0.1}s` }}
        >
          <div className="sp-stat-value" style={{ color }}>{stat.value}</div>
          <div className="sp-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Testimonial ── */
function TestimonialSection({ testimonial, color }: { testimonial: SolutionConfig['testimonial']; color: string }) {
  const ref = useSolutionReveal(0.2);

  return (
    <section className="sp-section sp-testimonial-section" ref={ref}>
      <div className="sp-testimonial-card sp-stagger" style={{ borderColor: `${color}30` }}>
        <svg className="sp-testimonial-quote-icon" width="32" height="32" viewBox="0 0 24 24" fill={`${color}20`} stroke={color} strokeWidth="1.5">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 .001 0 1.003 1 1z" />
        </svg>
        <p className="sp-testimonial-text">{testimonial.quote}</p>
        <div className="sp-testimonial-author">
          <div className="sp-testimonial-avatar" style={{ backgroundColor: `${color}20`, color }}>
            {testimonial.author[0]}
          </div>
          <div>
            <div className="sp-testimonial-name">{testimonial.author}</div>
            <div className="sp-testimonial-role">{testimonial.role}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main Client Component ── */
export function SolutionPageClient({
  solution,
  allSolutions,
  allFeatures,
}: {
  solution: SolutionConfig;
  allSolutions: SolutionConfig[];
  allFeatures: FeatureConfig[];
}) {
  const tier = useSolutionAnimations();
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

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

  const relatedFeatures = allFeatures.filter((f) => solution.relatedFeatures.includes(f.slug));

  return (
    <div className="sp-page" style={{ '--sp-color': solution.color } as React.CSSProperties}>
      {/* Background aura */}
      <div
        className="sp-aura"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${solution.color}15 0%, transparent 70%)`,
        }}
      />

      {/* GSAP orchestrator for full-tier animations */}
      {tier === 'full' && <SolutionEffects solution={solution} />}

      {/* Section 1: Hero */}
      <SolutionHero solution={solution} tier={tier} />

      <div className="sp-container">
        {/* Section 2: Scenario */}
        <SolutionScenario scenario={solution.scenario} color={solution.color} tier={tier} />

        {/* Section 3: Timeline */}
        <SolutionTimeline beats={solution.beats} color={solution.color} duration={solution.duration} tier={tier} />

        {/* Section 4: Transformation */}
        <SolutionTransformation transformation={solution.transformation} color={solution.color} tier={tier} />

        {/* Section 5: Stats Strip */}
        <div ref={statsRef}>
          <StatsStrip stats={solution.stats} color={solution.color} visible={statsVisible} />
        </div>

        {/* Section 6: Feature Cards */}
        <SolutionFeatureCards features={relatedFeatures} />

        {/* Section 7: Testimonial */}
        <TestimonialSection testimonial={solution.testimonial} color={solution.color} />

        {/* Section 8: CTA + Solution Nav */}
        <SolutionNav solution={solution} allSolutions={allSolutions} />
      </div>
    </div>
  );
}
