'use client';

import { useEffect, useRef } from 'react';
import type { SolutionConfig } from '@/config/solutions';

export function SolutionTransformation({
  transformation,
  color,
}: {
  transformation: SolutionConfig['transformation'];
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('sp-visible');
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const children = el.querySelectorAll('.sp-stagger');
          children.forEach((child, i) => {
            (child as HTMLElement).style.transitionDelay = `${i * 0.1}s`;
          });
          el.classList.add('sp-visible');
          obs.unobserve(entries[0].target);
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="sp-section sp-transformation" ref={ref}>
      <h2 className="sp-section-title sp-stagger">See the transformation</h2>
      <p className="sp-section-sub sp-stagger">Before Pitchr vs. after two iterations.</p>

      <div className="sp-transform-split">
        {/* Before */}
        <div className="sp-transform-panel sp-transform-before sp-stagger">
          <div className="sp-transform-header">
            <span className="sp-transform-label">Before</span>
          </div>
          <div className="sp-transform-score" style={{ color: `${color}80` }}>
            {transformation.scoreBefore}
            <span className="sp-transform-score-unit">/100</span>
          </div>
          <ul className="sp-transform-list">
            {transformation.weaknesses.map((w) => (
              <li key={w} className="sp-transform-item sp-transform-item-weak">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* After */}
        <div className="sp-transform-panel sp-transform-after sp-stagger">
          <div className="sp-transform-header">
            <span className="sp-transform-label">After</span>
          </div>
          <div className="sp-transform-score" style={{ color }}>
            {transformation.scoreAfter}
            <span className="sp-transform-score-unit">/100</span>
          </div>
          <ul className="sp-transform-list">
            {transformation.strengths.map((s) => (
              <li key={s} className="sp-transform-item sp-transform-item-strong">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
