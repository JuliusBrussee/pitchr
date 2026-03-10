'use client';

import { useEffect, useRef, useState } from 'react';
import type { SolutionConfig } from '@/config/solutions';

export function SolutionHero({ solution }: { solution: SolutionConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  }, []);

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
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <span className="sp-label-pill" style={{ backgroundColor: solution.color }}>
          {solution.label}
        </span>
        <span className="sp-duration-badge">{solution.duration}</span>
        <h1 className="sp-headline">{solution.headline}</h1>
        <p className="sp-tagline">{solution.tagline}</p>
      </div>
    </section>
  );
}
