'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScrollReveal } from '@/views/components/landing/animations/useScrollReveal';
import { MiniAppFrame } from '@/views/components/landing/animations/MiniAppFrame';

const PITCH_TEXT = "We're building an AI pitch coach that gives founders investor-grade feedback on their pitch in under 30 seconds...";

const STEPS = [
  'Scoring structure & clarity...',
  'Analyzing delivery metrics...',
  'Detecting filler words...',
  'Generating fixes & rewrite...',
];

const RUBRIC_DATA = [
  { label: 'Structure', score: 18, max: 20 },
  { label: 'Clarity', score: 15, max: 20 },
  { label: 'Evidence', score: 16, max: 20 },
  { label: 'Market', score: 17, max: 20 },
  { label: 'Delivery', score: 16, max: 20 },
];

const FIX_CARDS = [
  { rank: 1, text: 'Add specific traction metrics to evidence section', color: '#ef4444' },
  { rank: 2, text: 'Quantify the market opportunity with TAM data', color: '#ffaa33' },
  { rank: 3, text: 'Reduce filler word usage in opening 30 seconds', color: '#6b7280' },
];

function getScoreColor(score: number): string {
  const hue = (score / 100) * 120;
  return `hsl(${hue}, 72%, 45%)`;
}

export function TransformSection() {
  const containerRef = useScrollReveal({ threshold: 0.15 });
  const [view, setView] = useState<'idle' | 'typing' | 'processing' | 'results'>('idle');
  const [charIndex, setCharIndex] = useState(0);
  const [stepsComplete, setStepsComplete] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(-1);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [barWidths, setBarWidths] = useState<number[]>([0, 0, 0, 0, 0]);
  const [fixesVisible, setFixesVisible] = useState<boolean[]>([false, false, false]);
  const [metricsVisible, setMetricsVisible] = useState(false);
  const hasPlayed = useRef(false);
  const frameRef = useRef<number>(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const startAnimation = useCallback(() => {
    if (hasPlayed.current) return;
    hasPlayed.current = true;

    // Phase A: Typing (0-2s)
    setView('typing');
    const startTime = performance.now();
    const charsPerSecond = 30;
    const totalChars = PITCH_TEXT.length;

    const typeChar = (now: number) => {
      const elapsed = now - startTime;
      const idx = Math.min(Math.floor((elapsed / 1000) * charsPerSecond), totalChars);
      setCharIndex(idx);
      if (idx < totalChars) {
        frameRef.current = requestAnimationFrame(typeChar);
      }
    };
    frameRef.current = requestAnimationFrame(typeChar);

    // Phase B: Processing (2-3.5s)
    addTimer(() => {
      cancelAnimationFrame(frameRef.current);
      setCharIndex(totalChars);
      setView('processing');

      // Process steps sequentially
      STEPS.forEach((_, i) => {
        addTimer(() => setActiveStep(i), i * 250);
        addTimer(() => {
          setStepsComplete((prev) => [...prev, i]);
          if (i < STEPS.length - 1) setActiveStep(i + 1);
        }, i * 250 + (i === 3 ? 400 : 300));
      });
    }, 2000);

    // Phase C: Results (3.5-6s)
    addTimer(() => {
      setView('results');
      setMetricsVisible(true);

      // Animate score
      const target = 82;
      const scoreStart = performance.now();
      const duration = 700;
      const scoreTick = (now: number) => {
        const elapsed = now - scoreStart;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setAnimatedScore(Math.round(eased * target));
        if (t < 1) frameRef.current = requestAnimationFrame(scoreTick);
      };
      frameRef.current = requestAnimationFrame(scoreTick);

      // Bars
      addTimer(() => {
        setBarWidths(RUBRIC_DATA.map((r) => (r.score / r.max) * 100));
      }, 700);

      // Fixes
      FIX_CARDS.forEach((_, i) => {
        addTimer(() => {
          setFixesVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 1500 + i * 200);
      });
    }, 3500);
  }, [addTimer]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      if (el.classList.contains('visible')) startAnimation();
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    if (el.classList.contains('visible')) startAnimation();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
      clearTimers();
    };
  }, [startAnimation, containerRef, clearTimers]);

  const scoreColor = getScoreColor(animatedScore);
  const circumference = 2 * Math.PI * 32;
  const dashOffset = circumference * (1 - animatedScore / 100);

  return (
    <section className="demo-section" id="how-it-works">
      <div className="container" ref={containerRef}>
        <div className="demo-section-grid">
          {/* Left text */}
          <div className="demo-section-text">
            <span className="demo-label-pill">How It Works</span>
            <h2 className="demo-headline">
              Watch your pitch<br />transform.
            </h2>
            <p className="demo-subtext">
              Paste or record your pitch. Get a score, ranked fixes, and a rewritten
              script in under 30 seconds.
            </p>
            <a href="#waitlist" className="demo-cta" onClick={(e) => {
              e.preventDefault();
              document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}>
              Try it free &rarr;
            </a>
          </div>

          {/* Right: animated demo */}
          <div>
            <MiniAppFrame>
              <div style={{ minHeight: 240, position: 'relative' }}>
                {/* Phase A: Typing */}
                {view === 'typing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="mini-toolbar">
                      <span className="mini-toolbar-btn" style={{ opacity: 0.5 }}>
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        </svg>
                      </span>
                      <span className="mini-toolbar-btn active">
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2.5}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </span>
                    </div>
                    <div className="mini-textarea">
                      {PITCH_TEXT.slice(0, charIndex)}
                      <span className="mini-cursor" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                      <span className="mini-analyze-btn">
                        Analyze My Pitch
                      </span>
                    </div>
                  </div>
                )}

                {/* Phase B: Processing */}
                {view === 'processing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 4px', animation: 'fadeSlideUp 0.3s ease both' }}>
                    {STEPS.map((step, i) => {
                      const isDone = stepsComplete.includes(i);
                      const isActive = activeStep === i && !isDone;
                      return (
                        <div key={i} className="mini-step">
                          <span className={`mini-step-circle ${isActive ? 'spinning' : ''} ${isDone ? 'done' : ''}`}>
                            {isDone && (
                              <svg width={8} height={8} viewBox="0 0 12 12">
                                <path
                                  className="mini-step-check"
                                  d="M2 6l3 3 5-5"
                                  fill="none"
                                  stroke="#fff"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          <span style={{ color: isDone ? 'var(--text)' : undefined }}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Phase C: Results */}
                {view === 'results' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeSlideUp 0.3s ease both' }}>
                    {/* Score + metrics row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="mini-score-ring-wrap" style={{ width: 60, height: 60 }}>
                        <svg width={60} height={60} viewBox="0 0 70 70">
                          <circle cx={35} cy={35} r={32} fill="none" stroke="var(--surface-border)" strokeWidth={4} />
                          <circle
                            cx={35} cy={35} r={32}
                            fill="none"
                            stroke={scoreColor}
                            strokeWidth={4}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: `drop-shadow(0 0 4px ${scoreColor})`, transition: 'stroke-dashoffset 0.1s linear' }}
                          />
                        </svg>
                        <span className="mini-score-value" style={{ color: scoreColor, fontSize: 14 }}>{animatedScore}</span>
                      </div>
                      {metricsVisible && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          <span className="mini-metric-pill" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                            <span className="mini-metric-dot" style={{ background: '#22c55e' }} />142 WPM
                          </span>
                          <span className="mini-metric-pill" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                            <span className="mini-metric-dot" style={{ background: '#22c55e' }} />2 fillers
                          </span>
                          <span className="mini-metric-pill" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                            <span className="mini-metric-dot" style={{ background: '#22c55e' }} />1:52
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rubric bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                                  transitionDelay: `${i * 80}ms`,
                                }}
                              />
                            </div>
                            <span className="mini-rubric-score" style={{ color }}>{r.score}/{r.max}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Fix cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {FIX_CARDS.map((fix, i) => (
                        <div
                          key={fix.rank}
                          className={`mini-fix ${fixesVisible[i] ? 'visible' : ''}`}
                          style={{ borderLeftColor: fix.color, transitionDelay: `${i * 0.1}s` }}
                        >
                          <span
                            className="mini-fix-rank"
                            style={{ backgroundColor: `${fix.color}1a`, color: fix.color }}
                          >
                            #{fix.rank}
                          </span>
                          <span className="mini-fix-text">{fix.text}</span>
                        </div>
                      ))}
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
