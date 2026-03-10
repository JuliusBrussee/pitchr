'use client';

import { useEffect, useRef, useState } from 'react';
import type { SolutionConfig } from '@/config/solutions';
import { SolutionHero } from '@/views/components/solutions/SolutionHero';
import { SolutionScenario } from '@/views/components/solutions/SolutionScenario';
import { SolutionTimeline } from '@/views/components/solutions/SolutionTimeline';
import { SolutionTransformation } from '@/views/components/solutions/SolutionTransformation';
import { SolutionNav } from '@/views/components/solutions/SolutionNav';
import { FeatureHeroDemo } from '@/views/components/features/FeatureHeroDemo';

/* ── Stats Strip ── */
function StatsStrip({ stats, color }: { stats: SolutionConfig['stats']; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.unobserve(entries[0].target);
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="sp-stats-strip" ref={ref}>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="sp-stat"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: `${i * 0.1}s`,
          }}
        >
          <div className="sp-stat-value" style={{ color }}>{stat.value}</div>
          <div className="sp-stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Product Demos ── */
function ProductDemos({ solution }: { solution: SolutionConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.unobserve(entries[0].target);
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!solution.demos) return null;

  return (
    <div
      className="sp-demos"
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
        transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1) 0.2s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
      }}
    >
      <div className="sp-demo-col">
        <div className="sp-demo-label">{solution.demoLabels?.[0]}</div>
        <FeatureHeroDemo slug={solution.demos[0]} color={solution.color} visible={visible} />
      </div>
      <div className="sp-demo-col">
        <div className="sp-demo-label">{solution.demoLabels?.[1]}</div>
        <FeatureHeroDemo slug={solution.demos[1]} color={solution.color} visible={visible} />
      </div>
    </div>
  );
}

/* ── Main Client Component ── */
export function SolutionPageClient({
  solution,
  allSolutions,
}: {
  solution: SolutionConfig;
  allSolutions: SolutionConfig[];
}) {
  return (
    <div className="sp-page" style={{ '--sp-color': solution.color } as React.CSSProperties}>
      {/* Background aura */}
      <div
        className="sp-aura"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${solution.color}15 0%, transparent 70%)`,
        }}
      />

      {/* Section 1: Hero */}
      <SolutionHero solution={solution} />

      <div className="sp-container">
        {/* Section 2: Product Demos */}
        <ProductDemos solution={solution} />

        {/* Section 3: Scenario */}
        <SolutionScenario scenario={solution.scenario} color={solution.color} />

        {/* Section 4: Timeline */}
        <SolutionTimeline beats={solution.beats} color={solution.color} duration={solution.duration} />

        {/* Section 5: Transformation */}
        <SolutionTransformation transformation={solution.transformation} color={solution.color} />

        {/* Section 6: Stats Strip */}
        <StatsStrip stats={solution.stats} color={solution.color} />

        {/* Section 7: CTA + Solution Nav */}
        <SolutionNav solution={solution} allSolutions={allSolutions} />
      </div>
    </div>
  );
}
