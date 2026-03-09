'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserFrame } from '@/views/components/landing-demos/BrowserFrame';

type ProgressState = 'idle' | 'chart_drawing' | 'categories' | 'insight' | 'recommendation';

const CHART_POINTS = [
  { session: 1, score: 68 },
  { session: 2, score: 71 },
  { session: 3, score: 73 },
  { session: 4, score: 77 },
  { session: 5, score: 78 },
];

const CATEGORIES = [
  { label: 'Clarity', value: 82, color: 'var(--dl-blue)' },
  { label: 'Confidence', value: 79, color: 'var(--dl-green)' },
  { label: 'Concision', value: 71, color: 'var(--dl-purple)' },
  { label: 'Q&A', value: 68, color: 'var(--dl-red)', weakest: true },
];

const FOCUS_ITEMS = [
  { text: 'Work on short, proof-based answers', color: 'var(--dl-accent)' },
  { text: 'Practice harder investor questions', color: 'var(--dl-blue)' },
  { text: 'Revisit your market explanation', color: 'var(--dl-orange)' },
];

export function ProgressSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [state, setState] = useState<ProgressState>('idle');
  const [chartProgress, setChartProgress] = useState(0);
  const [catProgress, setCatProgress] = useState(0);
  const [showInsight, setShowInsight] = useState(false);
  const [visibleFocus, setVisibleFocus] = useState(0);
  const [showCta, setShowCta] = useState(false);

  // Scroll trigger
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // State machine
  useEffect(() => {
    if (!isVisible) return;

    const transitions: Partial<Record<ProgressState, [ProgressState, number]>> = {
      idle: ['chart_drawing', 400],
      chart_drawing: ['categories', 1200],
      categories: ['insight', 1400],
      insight: ['recommendation', 1200],
    };

    const next = transitions[state];
    if (!next) return;
    const t = setTimeout(() => setState(next[0]), next[1]);
    return () => clearTimeout(t);
  }, [state, isVisible]);

  // Chart drawing animation
  useEffect(() => {
    if (state === 'idle') return;

    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setChartProgress(eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [state === 'idle']); // eslint-disable-line react-hooks/exhaustive-deps

  // Category bars animation
  useEffect(() => {
    if (state !== 'categories' && state !== 'insight' && state !== 'recommendation') return;

    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCatProgress(eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [state === 'categories' || state === 'insight' || state === 'recommendation']); // eslint-disable-line react-hooks/exhaustive-deps

  // Insight
  useEffect(() => {
    if (state !== 'insight' && state !== 'recommendation') return;
    const t = setTimeout(() => setShowInsight(true), 300);
    return () => clearTimeout(t);
  }, [state]);

  // Focus items
  useEffect(() => {
    if (state !== 'recommendation') return;
    if (visibleFocus >= FOCUS_ITEMS.length) {
      const t = setTimeout(() => setShowCta(true), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleFocus((v) => v + 1), visibleFocus === 0 ? 300 : 250);
    return () => clearTimeout(t);
  }, [state, visibleFocus]);

  // Chart dimensions
  const chartW = 500;
  const chartH = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const plotW = chartW - padding.left - padding.right;
  const plotH = chartH - padding.top - padding.bottom;

  const visiblePointCount = Math.ceil(chartProgress * CHART_POINTS.length);

  const getX = (i: number) => padding.left + (i / (CHART_POINTS.length - 1)) * plotW;
  const getY = (score: number) => padding.top + plotH - ((score - 50) / 50) * plotH;

  const linePoints = CHART_POINTS.slice(0, visiblePointCount)
    .map((p, i) => `${getX(i)},${getY(p.score)}`)
    .join(' ');

  const areaPath = CHART_POINTS.slice(0, visiblePointCount).length >= 2
    ? CHART_POINTS.slice(0, visiblePointCount)
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(p.score)}`)
        .join(' ') +
      ` L${getX(visiblePointCount - 1)},${chartH - padding.bottom} L${getX(0)},${chartH - padding.bottom} Z`
    : '';

  return (
    <section ref={sectionRef} className="dl-section" style={{ paddingBottom: '60px' }}>
      <div className="dl-container">
        <div className="dl-section-header">
          <div className="dl-section-label">Progress</div>
          <h2 className="dl-section-title">Measure how your<br />pitch improves over time.</h2>
          <p className="dl-section-subtitle">
            See steady growth through repeated practice. Know where to focus next, not just where you&apos;ve been.
          </p>
        </div>

        <BrowserFrame url="app.pitchr.com/progress">
          <div className="dl-progress-layout">
            {/* Chart area */}
            <div>
              <div className="dl-progress-chart-area">
                <div className="dl-progress-chart-header">
                  <div className="dl-progress-chart-title">Overall Score Trend</div>
                  <div className="dl-progress-timeframe">
                    <button className="dl-progress-timeframe-btn">1W</button>
                    <button className="dl-progress-timeframe-btn dl-progress-timeframe-btn--active">1M</button>
                    <button className="dl-progress-timeframe-btn">3M</button>
                  </div>
                </div>

                <svg className="dl-progress-svg" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="xMidYMid meet">
                  {/* Grid */}
                  {[60, 70, 80, 90].map((val) => (
                    <g key={val}>
                      <line
                        x1={padding.left}
                        y1={getY(val)}
                        x2={chartW - padding.right}
                        y2={getY(val)}
                        stroke="var(--dl-border)"
                        strokeWidth="0.5"
                        strokeDasharray="4,4"
                      />
                      <text
                        x={padding.left - 8}
                        y={getY(val) + 4}
                        fill="var(--dl-text-muted)"
                        fontSize="10"
                        textAnchor="end"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {val}
                      </text>
                    </g>
                  ))}

                  {/* Session labels */}
                  {CHART_POINTS.map((p, i) => (
                    <text
                      key={i}
                      x={getX(i)}
                      y={chartH - 8}
                      fill="var(--dl-text-muted)"
                      fontSize="10"
                      textAnchor="middle"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      S{p.session}
                    </text>
                  ))}

                  {/* Area */}
                  {areaPath && (
                    <path d={areaPath} fill="var(--dl-accent-glow)" opacity="0.4" />
                  )}

                  {/* Line */}
                  {visiblePointCount >= 2 && (
                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="var(--dl-accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Points */}
                  {CHART_POINTS.slice(0, visiblePointCount).map((p, i) => (
                    <g key={i}>
                      <circle
                        cx={getX(i)}
                        cy={getY(p.score)}
                        r={i === visiblePointCount - 1 ? 5 : 3.5}
                        fill={i === visiblePointCount - 1 ? 'var(--dl-accent)' : 'var(--dl-bg)'}
                        stroke="var(--dl-accent)"
                        strokeWidth="2"
                      />
                      {i === visiblePointCount - 1 && chartProgress >= 0.9 && (
                        <text
                          x={getX(i)}
                          y={getY(p.score) - 12}
                          fill="var(--dl-text)"
                          fontSize="12"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {p.score}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {chartProgress >= 0.9 && (
                  <div className="dl-progress-trend-label" style={{ animation: 'dlFadeUp 0.3s ease both' }}>
                    +10 points in 5 sessions
                  </div>
                )}
              </div>

              {/* Insight panel */}
              {showInsight && (
                <div className="dl-summary" style={{ animation: 'dlFadeUp 0.4s ease both' }}>
                  <div className="dl-summary-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--dl-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ color: 'var(--dl-text)', fontWeight: 600 }}>Your clarity is trending up.</span>{' '}
                    Q&A remains your weakest area — focus there this week.
                  </div>
                </div>
              )}
            </div>

            {/* Right column: categories + focus */}
            <div>
              {/* Category breakdown */}
              <div className="dl-progress-categories">
                {CATEGORIES.map((cat, i) => (
                  <div
                    key={cat.label}
                    className="dl-progress-cat"
                    style={{
                      opacity: catProgress > 0 ? 1 : 0,
                      transition: `all 0.4s ease ${i * 80}ms`,
                    }}
                  >
                    <div className="dl-progress-cat-label">{cat.label}</div>
                    <div className="dl-progress-cat-bar">
                      <div
                        className="dl-progress-cat-fill"
                        style={{
                          width: `${cat.value * catProgress}%`,
                          background: cat.color,
                          boxShadow: cat.weakest ? `0 0 8px ${cat.color}40` : 'none',
                        }}
                      />
                    </div>
                    <div
                      className="dl-progress-cat-value"
                      style={{ color: cat.weakest ? cat.color : 'var(--dl-text)' }}
                    >
                      {Math.round(cat.value * catProgress)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Focus this week */}
              <div className="dl-focus-card">
                <div className="dl-focus-title">Focus This Week</div>
                {FOCUS_ITEMS.map((item, i) => (
                  <div
                    key={item.text}
                    className="dl-focus-item"
                    style={{
                      opacity: i < visibleFocus ? 1 : 0,
                      transform: i < visibleFocus ? 'translateX(0)' : 'translateX(-8px)',
                      transition: 'all 0.35s ease',
                    }}
                  >
                    <div className="dl-focus-dot" style={{ background: item.color }} />
                    {item.text}
                  </div>
                ))}

                {showCta && (
                  <div style={{ marginTop: '14px', animation: 'dlFadeUp 0.3s ease both' }}>
                    <button className="dl-btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '8px 16px' }}>
                      Start this week&apos;s challenge
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </section>
  );
}
