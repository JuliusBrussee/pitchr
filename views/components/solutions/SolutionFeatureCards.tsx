'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { FeatureConfig } from '@/config/features';

export function SolutionFeatureCards({ features }: { features: FeatureConfig[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
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

  if (features.length === 0) return null;

  return (
    <section className="sp-section sp-feature-cards-section" ref={ref}>
      <h2 className="sp-section-title">Features that power this</h2>
      <p className="sp-section-sub">Pitchr tools designed for this exact pitch type.</p>
      <div className="sp-feature-cards-grid">
        {features.map((f, i) => (
          <Link
            key={f.slug}
            href={`/features/${f.slug}`}
            className="sp-feature-card"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0) rotate(0deg)' : 'translateY(40px) rotate(-2deg)',
              transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s`,
            }}
          >
            <div className="sp-feature-card-pill" style={{ backgroundColor: f.color }}>{f.label}</div>
            <h3 className="sp-feature-card-headline">{f.headline}</h3>
            <p className="sp-feature-card-tagline">{f.tagline.slice(0, 100)}...</p>
            <span className="sp-feature-card-arrow" style={{ color: f.color }}>Explore &rarr;</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
