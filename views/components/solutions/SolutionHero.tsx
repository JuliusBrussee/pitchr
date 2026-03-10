'use client';

import { useEffect, useRef, useState } from 'react';
import type { SolutionConfig } from '@/config/solutions';
import type { AnimationTier } from '@/views/components/solutions/useSolutionAnimations';
import { ElevatorSvg } from '@/views/components/solutions/illustrations/ElevatorSvg';
import { VcPitchSvg } from '@/views/components/solutions/illustrations/VcPitchSvg';
import { HackathonSvg } from '@/views/components/solutions/illustrations/HackathonSvg';
import { UniversitySvg } from '@/views/components/solutions/illustrations/UniversitySvg';
import { CompetitionSvg } from '@/views/components/solutions/illustrations/CompetitionSvg';

const SVG_MAP: Record<string, React.ComponentType<{ color: string; animate: boolean }>> = {
  'elevator-pitch': ElevatorSvg,
  'vc-pitch': VcPitchSvg,
  'hackathon-pitch': HackathonSvg,
  'university': UniversitySvg,
  'startup-competition': CompetitionSvg,
};

export function SolutionHero({ solution, tier }: { solution: SolutionConfig; tier: AnimationTier }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (tier === 'none') {
      setVisible(true);
      return;
    }
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
  }, [tier]);

  const SvgComponent = SVG_MAP[solution.slug];

  return (
    <section className="sp-hero" ref={ref}>
      <div
        className="sp-hero-bg"
        style={{
          background: `radial-gradient(ellipse 120% 80% at 50% 30%, ${solution.color}18 0%, transparent 70%)`,
        }}
      />
      <div className="sp-hero-inner" style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.98)',
        transition: tier === 'none' ? 'none' : 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div className="sp-hero-content">
          <span className="sp-label-pill" style={{ backgroundColor: solution.color }}>
            {solution.label}
          </span>
          <span className="sp-duration-badge">{solution.duration}</span>
          <h1 className="sp-headline">{solution.headline}</h1>
          <p className="sp-tagline">{solution.tagline}</p>
        </div>
        {SvgComponent && (
          <div className="sp-hero-illustration" style={{
            opacity: visible ? 1 : 0,
            transition: tier === 'none' ? 'none' : 'opacity 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s',
          }}>
            <SvgComponent color={solution.color} animate={visible && tier !== 'none'} />
          </div>
        )}
      </div>
    </section>
  );
}
