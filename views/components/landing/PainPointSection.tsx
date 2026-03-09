'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScrollReveal } from '@/views/components/landing/animations/useScrollReveal';
import { MiniAppFrame } from '@/views/components/landing/animations/MiniAppFrame';

const FEEDBACK_BUBBLES = [
  { name: 'Alex', msg: 'Sounds great!' },
  { name: 'Sam', msg: 'Maybe try more passion?' },
  { name: 'Jordan', msg: "I think it's fine" },
  { name: 'Taylor', msg: 'Add some numbers?' },
  { name: 'Riley', msg: "It's a bit long" },
  { name: 'Casey', msg: 'Love the energy!' },
];

const SCATTER_DIRECTIONS = [
  { x: '-120px', y: '-80px', r: '-25deg' },
  { x: '140px', y: '-60px', r: '20deg' },
  { x: '-100px', y: '90px', r: '15deg' },
  { x: '110px', y: '70px', r: '-18deg' },
  { x: '-80px', y: '-100px', r: '30deg' },
  { x: '90px', y: '100px', r: '-22deg' },
];

const RUBRIC_DATA = [
  { label: 'Structure', score: 16, max: 20 },
  { label: 'Clarity', score: 17, max: 20 },
  { label: 'Evidence', score: 14, max: 20 },
  { label: 'Market', score: 18, max: 20 },
  { label: 'Delivery', score: 17, max: 20 },
];

function getScoreColor(score: number): string {
  const hue = (score / 100) * 120;
  return `hsl(${hue}, 72%, 45%)`;
}

export function PainPointSection() {
  const containerRef = useScrollReveal({ threshold: 0.15 });
  const [phase, setPhase] = useState<'idle' | 'bubbles' | 'scatter' | 'results'>('idle');
  const [animatedScore, setAnimatedScore] = useState(0);
  const [barWidths, setBarWidths] = useState<number[]>([0, 0, 0, 0, 0]);
  const [fixVisible, setFixVisible] = useState(false);
  const [bubblesVisible, setBubblesVisible] = useState<boolean[]>(new Array(6).fill(false));
  const hasPlayed = useRef(false);
  const frameRef = useRef<number>(0);

  const startAnimation = useCallback(() => {
    if (hasPlayed.current) return;
    hasPlayed.current = true;

    // Phase A: Show bubbles (0-1.5s)
    setPhase('bubbles');
    FEEDBACK_BUBBLES.forEach((_, i) => {
      setTimeout(() => {
        setBubblesVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 150);
    });

    // Phase B: Scatter (1.5s)
    setTimeout(() => setPhase('scatter'), 1500);

    // Phase C: Results (2s)
    setTimeout(() => {
      setPhase('results');

      // Animate score counter
      const target = 82;
      const start = performance.now();
      const duration = 800;
      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setAnimatedScore(Math.round(eased * target));
        if (t < 1) frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);

      // Animate rubric bars
      setTimeout(() => {
        setBarWidths(RUBRIC_DATA.map((r) => (r.score / r.max) * 100));
      }, 500);

      // Show fix card
      setTimeout(() => setFixVisible(true), 1200);
    }, 2000);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      if (el.classList.contains('visible')) {
        startAnimation();
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });

    // Check if already visible
    if (el.classList.contains('visible')) {
      startAnimation();
    }

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [startAnimation, containerRef]);

  const scoreColor = getScoreColor(animatedScore);
  const circumference = 2 * Math.PI * 32;
  const dashOffset = circumference * (1 - animatedScore / 100);

  return (
    <section className="demo-section" id="problem">
      <div className="container" ref={containerRef}>
        <div className="demo-section-grid">
          {/* Left: text */}
          <div className="demo-section-text">
            <span className="demo-label-pill">The Problem</span>
            <h2 className="demo-headline">
              Stop guessing.<br />Start closing.
            </h2>
            <p className="demo-subtext">
              Friends say &ldquo;sounds great.&rdquo; Investors don&rsquo;t. Get the
              feedback that actually moves the needle.
            </p>
            <a href="#toolkit" className="demo-cta" onClick={(e) => {
              e.preventDefault();
              document.getElementById('toolkit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}>
              See the toolkit &rarr;
            </a>
          </div>

          {/* Right: animated demo */}
          <div>
            <MiniAppFrame>
              <div style={{ minHeight: 220, position: 'relative', overflow: 'hidden' }}>
                {/* Phase A/B: Feedback bubbles */}
                {(phase === 'bubbles' || phase === 'scatter') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {FEEDBACK_BUBBLES.map((b, i) => (
                      <div
                        key={i}
                        className={`mini-bubble ${bubblesVisible[i] ? (phase === 'scatter' ? 'scatter' : 'visible') : ''}`}
                        style={{
                          '--bubble-rotate': `${(i % 2 === 0 ? -1 : 1) * (1 + i * 0.5)}deg`,
                          '--scatter-x': SCATTER_DIRECTIONS[i].x,
                          '--scatter-y': SCATTER_DIRECTIONS[i].y,
                          '--scatter-rotate': SCATTER_DIRECTIONS[i].r,
                          animationDelay: phase === 'scatter' ? `${i * 0.04}s` : undefined,
                        } as React.CSSProperties}
                      >
                        <span className="mini-bubble-avatar" />
                        <span style={{ fontWeight: 600, fontSize: 9 }}>{b.name}</span>
                        <span>{b.msg}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Phase C: Results dashboard */}
                {phase === 'results' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeSlideUp 0.4s ease both' }}>
                    {/* Score ring + band */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="mini-score-ring-wrap" style={{ width: 70, height: 70 }}>
                        <svg width={70} height={70} viewBox="0 0 70 70">
                          <circle cx={35} cy={35} r={32} fill="none" stroke="var(--surface-border)" strokeWidth={4} />
                          <circle
                            cx={35} cy={35} r={32}
                            fill="none"
                            stroke={scoreColor}
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: `drop-shadow(0 0 6px ${scoreColor})`, transition: 'stroke-dashoffset 0.1s linear' }}
                          />
                        </svg>
                        <span className="mini-score-value" style={{ color: scoreColor }}>{animatedScore}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>82</div>
                        <div className="mini-score-band" style={{ color: scoreColor }}>Investor-Ready</div>
                      </div>
                    </div>

                    {/* Rubric bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {RUBRIC_DATA.map((r, i) => {
                        const pct = (r.score / r.max) * 100;
                        const color = getScoreColor(pct);
                        return (
                          <div key={r.label} className="mini-rubric-row">
                            <span className="mini-rubric-label">{r.label}</span>
                            <div className="mini-rubric-track">
                              <div
                                className="mini-rubric-fill"
                                style={{
                                  width: `${barWidths[i]}%`,
                                  backgroundColor: color,
                                  transitionDelay: `${i * 100}ms`,
                                }}
                              />
                            </div>
                            <span className="mini-rubric-score" style={{ color }}>{r.score}/{r.max}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Top fix card */}
                    <div
                      className={`mini-fix ${fixVisible ? 'visible' : ''}`}
                      style={{ borderLeftColor: '#ef4444', transitionDelay: '0.1s' }}
                    >
                      <span className="mini-fix-rank" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>#1</span>
                      <span className="mini-fix-text">Add TAM/SAM sizing — investors need concrete market data</span>
                      <span className="mini-fix-impact" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>High</span>
                    </div>
                  </div>
                )}
              </div>
            </MiniAppFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
