'use client';

import { useEffect, useRef, useState } from 'react';
import type { SolutionConfig } from '@/config/solutions';
import type { AnimationTier } from '@/views/components/solutions/useSolutionAnimations';

function ScoreRing({ score, color, label }: { score: number; color: string; label: string }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="sp-score-ring-wrap">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r="54" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.1" />
        <circle
          className="sp-score-ring-fill"
          cx="64"
          cy="64"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1), stroke 0.3s' }}
          transform="rotate(-90 64 64)"
        />
        <text x="64" y="58" textAnchor="middle" fill="currentColor" fontSize="28" fontWeight="800">{score}</text>
        <text x="64" y="76" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.5">/100</text>
      </svg>
      <div className="sp-score-label">{label}</div>
    </div>
  );
}

export function SolutionTransformation({
  transformation,
  color,
  tier,
}: {
  transformation: SolutionConfig['transformation'];
  color: string;
  tier: AnimationTier;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'before' | 'analysis' | 'after'>(tier === 'none' ? 'after' : 'before');
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
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [tier]);

  // Auto-phase transition for basic tier
  useEffect(() => {
    if (!visible || tier !== 'basic') return;
    const t1 = setTimeout(() => setPhase('analysis'), 1200);
    const t2 = setTimeout(() => setPhase('after'), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, tier]);

  return (
    <section className="sp-section sp-transformation" ref={ref}>
      <h2 className="sp-section-title">See the transformation</h2>
      <p className="sp-section-sub">Before Pitchr vs. after two iterations.</p>

      <div className="sp-transform-stages">
        {/* Before */}
        <div className="sp-transform-before sp-transform-stage" style={{
          opacity: tier === 'full' ? undefined : (phase === 'before' || tier === 'none' ? 1 : phase === 'analysis' ? 0.5 : 0),
          transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <ScoreRing score={transformation.scoreBefore} color={`${color}60`} label="Before" />
          <div className="sp-transform-issues">
            {transformation.weaknesses.map((w) => (
              <div key={w} className="sp-transform-issue sp-transform-issue-weak">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
                <span>{w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis overlay */}
        <div className="sp-transform-analysis sp-transform-stage" style={{
          opacity: tier === 'full' ? undefined : (phase === 'analysis' ? 1 : 0),
          transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div className="sp-transform-analysis-card" style={{ borderColor: `${color}30` }}>
            <div className="sp-transform-analysis-header" style={{ color }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Pitchr Analysis
            </div>
            <div className="sp-transform-analysis-bars">
              {['Structure', 'Clarity', 'Evidence', 'Market', 'Delivery'].map((cat, i) => (
                <div key={cat} className="sp-analysis-bar-row">
                  <span className="sp-analysis-bar-label">{cat}</span>
                  <div className="sp-analysis-bar-track">
                    <div
                      className="sp-analysis-bar-fill"
                      style={{
                        backgroundColor: color,
                        width: phase === 'analysis' || phase === 'after' ? `${45 + i * 8}%` : '0%',
                        transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                        transitionDelay: `${i * 0.1}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* After */}
        <div className="sp-transform-after sp-transform-stage" style={{
          opacity: tier === 'full' ? undefined : (phase === 'after' ? 1 : 0),
          transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <ScoreRing score={transformation.scoreAfter} color={color} label="After" />
          <div className="sp-transform-issues">
            {transformation.strengths.map((s) => (
              <div key={s} className="sp-transform-issue sp-transform-issue-strong">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
