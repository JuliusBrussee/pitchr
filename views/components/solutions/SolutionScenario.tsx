'use client';

import { useEffect, useRef, useState } from 'react';
import type { SolutionConfig } from '@/config/solutions';
import type { AnimationTier } from '@/views/components/solutions/useSolutionAnimations';

export function SolutionScenario({
  scenario,
  color,
  tier,
}: {
  scenario: SolutionConfig['scenario'];
  color: string;
  tier: AnimationTier;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(tier === 'none');
  const [revealedLines, setRevealedLines] = useState(tier === 'none' ? Infinity : 0);

  const lines = scenario.text.split('. ').map((s, i, arr) => (i < arr.length - 1 ? s + '.' : s));

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
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [tier]);

  // Typewriter-style line reveal
  useEffect(() => {
    if (!visible || tier === 'none') return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealedLines(i);
      if (i >= lines.length + 1) clearInterval(interval); // +1 for "Sound familiar?"
    }, 600);
    return () => clearInterval(interval);
  }, [visible, lines.length, tier]);

  return (
    <section className="sp-section sp-scenario" ref={ref}>
      <div className="sp-scenario-layout">
        <div className="sp-persona-card" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(-30px)',
          transition: tier === 'none' ? 'none' : 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
          borderColor: `${color}30`,
        }}>
          <div className="sp-persona-avatar" style={{ backgroundColor: `${color}20`, color }}>
            {scenario.persona.avatar}
          </div>
          <div className="sp-persona-name">{scenario.persona.name}</div>
          <div className="sp-persona-role">{scenario.persona.role}</div>
        </div>
        <div className="sp-scenario-text">
          {lines.map((line, i) => (
            <p
              key={i}
              className="sp-scenario-line"
              style={{
                opacity: revealedLines > i ? 1 : 0,
                transform: revealedLines > i ? 'translateY(0)' : 'translateY(20px)',
                transition: tier === 'none' ? 'none' : 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {line}
            </p>
          ))}
          <p
            className="sp-scenario-familiar"
            style={{
              opacity: revealedLines > lines.length ? 1 : 0,
              color,
              transition: tier === 'none' ? 'none' : 'opacity 0.8s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            Sound familiar?
          </p>
        </div>
      </div>
    </section>
  );
}
