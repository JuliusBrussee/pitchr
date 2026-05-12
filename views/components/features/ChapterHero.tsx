'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChapterConfig } from '@/config/chapters';
import { FeatureHeroDemo } from '@/views/components/features/FeatureHeroDemo';

export function ChapterHero({ chapter }: { chapter: ChapterConfig }) {
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

  return (
    <section className="ch-hero" ref={ref}>
      <div
        className="ch-hero-content"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div className="ch-hero-chapter-label">
          <span className="ch-hero-chapter-num" style={{ backgroundColor: chapter.color }}>
            {chapter.number}
          </span>
          <span className="ch-hero-chapter-title" style={{ color: chapter.color }}>
            {chapter.title}
          </span>
        </div>
        <h1 className="fp-headline">{chapter.hook}</h1>
        <p className="fp-tagline">{chapter.tagline}</p>
      </div>

      {/* Dual demo side by side */}
      <div
        className="ch-hero-demos"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
          transition: 'opacity 1s cubic-bezier(0.16,1,0.3,1) 0.3s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.3s',
        }}
      >
        {chapter.demos.map((slug, i) => (
          <div key={slug} className="ch-hero-demo-col">
            <div className="ch-hero-demo-label">{chapter.demoLabels[i]}</div>
            <FeatureHeroDemo slug={slug} color={chapter.color} visible={visible} />
          </div>
        ))}
      </div>
    </section>
  );
}
