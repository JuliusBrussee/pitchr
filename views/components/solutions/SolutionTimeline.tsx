'use client';

import { useEffect, useRef } from 'react';
import type { SolutionConfig } from '@/config/solutions';

export function SolutionTimeline({
  beats,
  color,
  duration,
}: {
  beats: SolutionConfig['beats'];
  color: string;
  duration: string;
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
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="sp-section sp-timeline" ref={ref}>
      <h2 className="sp-section-title sp-stagger">
        Structure your {duration}
      </h2>
      <p className="sp-section-sub sp-stagger">
        Every great pitch follows a structure. Here are the beats that make yours unforgettable.
      </p>

      <div className="sp-beats-grid">
        {beats.map((beat) => (
          <div
            key={beat.label}
            className="sp-beat-card sp-stagger"
            style={{ borderLeftColor: color }}
          >
            <div className="sp-beat-time" style={{ color }}>{beat.time}</div>
            <h3 className="sp-beat-label">{beat.label}</h3>
            <p className="sp-beat-desc">{beat.description}</p>
            <div className="sp-beat-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>{beat.tip}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
