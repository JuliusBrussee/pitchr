'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Zap, FileText } from 'lucide-react';
import { BrowserFrame } from '@/views/components/landing-demos/BrowserFrame';
import { DpSidebar } from '@/views/components/landing-demos/DpSidebar';
import {
  DEMO_SCORE,
  DEMO_VERDICT,
  DEMO_RUBRIC,
  DEMO_FIXES,
  DEMO_DELIVERY,
  DEMO_REWRITE_HUNKS,
} from '@/views/components/demo/demoData';
import {
  getScoreColor,
  getScoreBgColor,
  getScoreBandLabel,
  RUBRIC_COLORS,
} from '@/views/components/ui/colors';

const IMPACT_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', label: 'High' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', label: 'Med' },
  low: { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', label: 'Low' },
};

function MiniRing({ score, maxScore, color, size = 32 }: { score: number; maxScore: number; color: string; size?: number }) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const offset = c - (score / maxScore) * c;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}20`} strokeWidth={2.5} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '9px', fontWeight: 700, color, fontFeatureSettings: "'tnum'",
      }}>
        {score}
      </div>
    </div>
  );
}

export function ResultsDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tick, setTick] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const scoreAnimStarted = useRef(false);

  // Scroll trigger
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Tick counter
  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(timer);
  }, [isVisible]);

  // Score count-up animation (starts at tick 8)
  useEffect(() => {
    if (tick < 8 || scoreAnimStarted.current) return;
    scoreAnimStarted.current = true;

    const start = performance.now();
    const duration = 1100;
    let frame: number;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * DEMO_SCORE));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [tick]);

  // Derived state
  const showHeader = tick >= 4;
  const showScoreRing = tick >= 8;
  const showRubric = tick >= 15;
  const showVerdict = tick >= 22;
  const showMetrics = tick >= 26;
  const fixVisibleCount = tick >= 35 ? Math.min(Math.floor((tick - 35) / 3), DEMO_FIXES.length) : 0;
  const hunkVisibleCount = tick >= 55 ? Math.min(Math.floor((tick - 55) / 5), DEMO_REWRITE_HUNKS.length) : 0;

  const displayScore = showScoreRing ? animatedScore : 0;
  const color = getScoreColor(displayScore || 1);
  const bgColor = getScoreBgColor(displayScore || 1);
  const bandLabel = getScoreBandLabel(displayScore || 1);

  const ringR = 42;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (displayScore / 100) * ringC;

  const metrics = [
    { label: 'WPM', value: String(DEMO_DELIVERY.wpm) },
    { label: 'Duration', value: `${DEMO_DELIVERY.duration_seconds}s` },
    { label: 'Fillers', value: String(DEMO_DELIVERY.filler_count) },
    { label: 'Words', value: String(DEMO_DELIVERY.word_count) },
  ];

  return (
    <section ref={sectionRef} className="dl-section">
      <div className="dl-container">
        <div className="dl-section-header">
          <div className="dl-section-label">Your Results</div>
          <h2 className="dl-section-title">Investor-grade scoring<br />with ranked fixes.</h2>
          <p className="dl-section-subtitle">
            Every pitch gets a score out of 100 across five rubric dimensions,
            ranked fixes by impact, and a rewritten script.
          </p>
        </div>

        <BrowserFrame url="app.pitchr.com/results">
          <div className="dp-app-layout">
            <DpSidebar active="dashboard" />
            <div className="dp-main dp-main--scroll">
              {/* Header */}
              <div
                className="dp-results-header"
                style={{ opacity: showHeader ? 1 : 0, transition: 'opacity 0.4s ease' }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dl-text)' }}>Pitch Analysis</div>
                <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)' }}>Mar 7, 2026 · VC Pitch · Series A Pitch</div>
              </div>

              {/* Score Hero */}
              <div
                className="dp-score-hero"
                style={{ opacity: showScoreRing ? 1 : 0, transform: showScoreRing ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.5s ease' }}
              >
                {/* Main ring */}
                <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
                  <div style={{
                    position: 'absolute', inset: -8, borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
                    filter: 'blur(8px)',
                  }} />
                  <svg width={100} height={100} viewBox="0 0 100 100">
                    <circle cx={50} cy={50} r={ringR} fill="none" stroke="var(--dl-border)" strokeWidth={5} />
                    <circle
                      cx={50} cy={50} r={ringR}
                      fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
                      strokeDasharray={ringC} strokeDashoffset={ringOffset}
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '26px', fontWeight: 700, color, fontFeatureSettings: "'tnum'", lineHeight: 1 }}>
                      {displayScore}
                    </span>
                    <span style={{ fontSize: '8px', color: 'var(--dl-text-muted)' }}>/ 100</span>
                  </div>
                </div>

                {/* Rubric breakdown */}
                <div className="dp-rubric">
                  {DEMO_RUBRIC.map((item, i) => {
                    const catColor = RUBRIC_COLORS[item.category] ?? '#6b7280';
                    const visible = showRubric && tick >= 15 + i * 2;
                    return (
                      <div
                        key={item.category}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          opacity: visible ? 1 : 0,
                          transform: visible ? 'translateY(0)' : 'translateY(4px)',
                          transition: `all 0.4s ease ${i * 80}ms`,
                        }}
                      >
                        <MiniRing score={visible ? item.score : 0} maxScore={item.max_score} color={catColor} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'capitalize', color: 'var(--dl-text)' }}>
                              {item.category}
                            </span>
                            <span style={{ fontSize: '9px', color: 'var(--dl-text-muted)', fontFeatureSettings: "'tnum'" }}>
                              {item.score}/{item.max_score}
                            </span>
                          </div>
                          <p style={{ fontSize: '10px', color: 'var(--dl-text-secondary)', margin: '1px 0 0', lineHeight: 1.4 }}>
                            {item.rationale}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verdict */}
              <div style={{
                fontSize: '12px', lineHeight: 1.6, color: 'var(--dl-text)', margin: '12px 0',
                opacity: showVerdict ? 1 : 0, transition: 'opacity 0.4s ease',
              }}>
                {DEMO_VERDICT}
              </div>

              {/* Metrics strip */}
              <div
                className="dp-metrics-strip"
                style={{ opacity: showMetrics ? 1 : 0, transition: 'opacity 0.4s ease' }}
              >
                {metrics.map((m) => (
                  <div key={m.label} className="dp-metric-badge">
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dl-text)', fontFeatureSettings: "'tnum'" }}>{m.value}</span>
                    <span style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--dl-text-muted)' }}>{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Top Fixes */}
              {fixVisibleCount > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div className="dp-section-title">
                    <Zap size={10} />
                    Top Fixes
                  </div>
                  <div className="dp-fixes-grid">
                    {DEMO_FIXES.slice(0, fixVisibleCount).map((fix, i) => {
                      const impact = IMPACT_COLORS[fix.impact] ?? IMPACT_COLORS.low;
                      return (
                        <div
                          key={fix.rank}
                          className="dp-fix-card"
                          style={{
                            borderLeftColor: impact.color,
                            animation: `dlFadeUp 0.35s ease ${i * 60}ms both`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{
                              width: '16px', height: '16px', borderRadius: '50%', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              fontSize: '8px', fontWeight: 700, background: impact.bg, color: impact.color,
                            }}>
                              {fix.rank}
                            </span>
                            <span style={{ fontSize: '9px', fontWeight: 500, textTransform: 'capitalize', color: 'var(--dl-text-muted)' }}>
                              {fix.category}
                            </span>
                            <span style={{
                              fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', padding: '1px 5px',
                              borderRadius: '3px', color: impact.color, background: impact.bg,
                            }}>
                              {impact.label}
                            </span>
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--dl-text)', margin: '0 0 3px', lineHeight: 1.4 }}>
                            {fix.issue}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                            <ArrowRight size={10} style={{ color: '#22c55e', marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ fontSize: '11px', color: 'var(--dl-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                              {fix.fix}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rewrite Comparison */}
              {hunkVisibleCount > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div className="dp-section-title">
                    <FileText size={10} />
                    Rewrite Comparison
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {DEMO_REWRITE_HUNKS.slice(0, hunkVisibleCount).map((hunk, i) => (
                      <div
                        key={i}
                        className="dp-rewrite-hunk"
                        style={{ animation: `dlFadeUp 0.35s ease ${i * 80}ms both` }}
                      >
                        <div className="dp-rewrite-side dp-rewrite-side--before">
                          <span className="dp-rewrite-tag dp-rewrite-tag--before">Original</span>
                          <div>{hunk.before}</div>
                        </div>
                        <div className="dp-rewrite-side dp-rewrite-side--after">
                          <span className="dp-rewrite-tag dp-rewrite-tag--after">Rewrite</span>
                          <div>{hunk.after}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </BrowserFrame>
      </div>
    </section>
  );
}
