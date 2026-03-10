'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { SolutionConfig } from '@/config/solutions';

export function SolutionNav({ solution, allSolutions }: { solution: SolutionConfig; allSolutions: SolutionConfig[] }) {
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

  const otherSolutions = allSolutions.filter((s) => s.slug !== solution.slug);

  return (
    <div ref={ref}>
      {/* CTA Section */}
      <section className="sp-cta">
        <div
          className="sp-cta-content"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <h2 className="sp-cta-title">{solution.ctaHeadline}</h2>
          <p className="sp-cta-desc">{solution.ctaDescription}</p>
          <Link
            href="/#waitlist"
            className="sp-cta-btn"
            style={{ background: solution.color }}
          >
            Try {solution.label} now
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Other solutions nav */}
      <section className="sp-solution-nav">
        <h3 className="sp-solution-nav-title">Explore other solutions</h3>
        <div className="sp-solution-nav-pills">
          {otherSolutions.map((s, i) => (
            <Link
              key={s.slug}
              href={`/solutions/${s.slug}`}
              className="sp-solution-pill"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
              }}
            >
              <span className="sp-solution-pill-dot" style={{ backgroundColor: s.color }} />
              <span className="sp-solution-pill-label">{s.label}</span>
              <span className="sp-solution-pill-arrow">&rarr;</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
