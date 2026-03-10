'use client';

import { useEffect, useRef } from 'react';
import type { SolutionConfig } from '@/config/solutions';

export function SolutionScenario({
  scenario,
  color,
}: {
  scenario: SolutionConfig['scenario'];
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
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="sp-section sp-scenario" ref={ref}>
      <div className="sp-scenario-context sp-stagger" style={{ color }}>
        {scenario.context}
      </div>
      <p className="sp-scenario-text sp-stagger">
        {scenario.text}
      </p>
      <p className="sp-scenario-familiar sp-stagger" style={{ color }}>
        Sound familiar?
      </p>
    </section>
  );
}
