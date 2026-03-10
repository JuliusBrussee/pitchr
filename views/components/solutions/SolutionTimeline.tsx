'use client';

import { useEffect, useRef, useState } from 'react';
import type { SolutionConfig } from '@/config/solutions';
import type { AnimationTier } from '@/views/components/solutions/useSolutionAnimations';

export function SolutionTimeline({
  beats,
  color,
  duration,
  tier,
}: {
  beats: SolutionConfig['beats'];
  color: string;
  duration: string;
  tier: AnimationTier;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(tier === 'none');

  useEffect(() => {
    const el = ref.current;
    if (!el || tier === 'none') return;
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

  return (
    <section className="sp-section sp-timeline" ref={ref}>
      <h2 className="sp-section-title">
        Structure your {duration}
      </h2>
      <p className="sp-section-sub">
        Every great pitch follows a structure. Here are the beats that make yours unforgettable.
      </p>

      {/* Progress bar */}
      <div className="sp-timeline-progress">
        <div className="sp-timeline-progress-fill" style={{ backgroundColor: color, width: tier === 'full' ? '0%' : '100%' }} />
      </div>

      {/* Horizontal scrolling track */}
      <div className="sp-timeline-track">
        {beats.map((beat, i) => (
          <div
            key={beat.label}
            className="sp-beat-card"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(30px)',
              transition: tier === 'none' ? 'none' : `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
              borderTopColor: color,
            }}
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
            {/* Weight bar */}
            <div className="sp-beat-weight">
              <div
                className="sp-beat-weight-fill"
                style={{
                  backgroundColor: color,
                  width: visible ? `${Math.max(30, 100 / beats.length + (i === 0 ? 15 : i === beats.length - 1 ? 10 : 0))}%` : '0%',
                  transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                  transitionDelay: `${i * 0.15 + 0.3}s`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
