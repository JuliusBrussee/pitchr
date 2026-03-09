'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Target, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { BrowserFrame } from '@/views/components/landing-demos/BrowserFrame';
import { DpSidebar } from '@/views/components/landing-demos/DpSidebar';
import {
  DEMO_SCORE,
  DEMO_SPARKLINE,
  DEMO_RECENT_RUNS,
  DEMO_COACH_SUMMARY,
  DEMO_RUBRIC_CATEGORIES,
} from '@/views/components/demo/demoData';
import {
  getScoreColor,
  getScoreBgColor,
  getScoreBandLabel,
  getModeColor,
} from '@/views/components/ui/colors';

function pentagonPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 5 })
    .map((_, i) => {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(' ');
}

function radarDataPoints(cx: number, cy: number, maxR: number, scores: number[]): string {
  return scores
    .map((score, i) => {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const r = (score / 20) * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(' ');
}

export function DashboardDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tick, setTick] = useState(0);

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

  // Derived state
  const showHeader = tick >= 4;
  const showCoach = tick >= 10;
  const showStats = tick >= 18;
  const showCategories = tick >= 30;
  const showRuns = tick >= 45;

  const color = getScoreColor(DEMO_SCORE);
  const bgColor = getScoreBgColor(DEMO_SCORE);
  const bandLabel = getScoreBandLabel(DEMO_SCORE);

  const ringR = 38;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = showStats ? ringC - (DEMO_SCORE / 100) * ringC : ringC;

  const best = Math.max(...DEMO_SPARKLINE);
  const avg = Math.round(DEMO_SPARKLINE.reduce((a, b) => a + b, 0) / DEMO_SPARKLINE.length);

  // Sparkline points
  const spW = 160;
  const spH = 36;
  const spMax = Math.max(...DEMO_SPARKLINE);
  const spMin = Math.min(...DEMO_SPARKLINE);
  const spRange = spMax - spMin || 1;
  const sparklinePoints = DEMO_SPARKLINE
    .map((v, i) => {
      const x = (i / (DEMO_SPARKLINE.length - 1)) * spW;
      const y = spH - ((v - spMin) / spRange) * (spH - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  // Category progress
  const catProgress = showCategories ? Math.min((tick - 30) / 15, 1) : 0;
  const catEased = 1 - Math.pow(1 - catProgress, 3);

  const weakest = DEMO_RUBRIC_CATEGORIES.reduce((min, cat) =>
    (cat.score / cat.maxScore) < (min.score / min.maxScore) ? cat : min
  );

  return (
    <section ref={sectionRef} className="dl-section">
      <div className="dl-container">
        <div className="dl-section-header">
          <div className="dl-section-label">Your Dashboard</div>
          <h2 className="dl-section-title">Track your progress<br />across every session.</h2>
          <p className="dl-section-subtitle">
            See your score trend, category breakdown, AI coaching insights,
            and session history in one view.
          </p>
        </div>

        <BrowserFrame url="app.pitchr.com/dashboard">
          <div className="dp-app-layout">
            <DpSidebar active="dashboard" />
            <div className="dp-main dp-main--scroll">
              {/* Header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '16px',
                  opacity: showHeader ? 1 : 0, transition: 'opacity 0.4s ease',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--dl-text)' }}>Good morning, Alex</div>
                  <div style={{ fontSize: '11px', color: 'var(--dl-text-secondary)', marginTop: '2px' }}>Friday, March 7, 2026</div>
                </div>
                <div className="dp-start-btn">
                  <Play size={12} fill="currentColor" />
                  Start Session
                </div>
              </div>

              {/* Coach Card */}
              <div
                className="dp-coach-card"
                style={{
                  opacity: showCoach ? 1 : 0,
                  transform: showCoach ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'all 0.5s ease',
                }}
              >
                <div className="dp-coach-icon">
                  <Sparkles size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dl-text)', marginBottom: '3px' }}>
                    {DEMO_COACH_SUMMARY.headline}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--dl-text-secondary)', lineHeight: 1.5 }}>
                    {DEMO_COACH_SUMMARY.detail}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px',
                    fontSize: '10px', fontWeight: 500, color: 'var(--dl-accent)',
                  }}>
                    <Target size={9} />
                    {DEMO_COACH_SUMMARY.recommendation}
                  </div>
                </div>
              </div>

              {/* Stats grid: Score Ring + Sparkline + Radar */}
              <div
                className="dp-stats-grid"
                style={{
                  opacity: showStats ? 1 : 0,
                  transform: showStats ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'all 0.5s ease',
                }}
              >
                {/* Score ring */}
                <div style={{ position: 'relative', width: 92, height: 92 }}>
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
                    filter: 'blur(6px)',
                  }} />
                  <svg width={92} height={92} viewBox="0 0 92 92">
                    <circle cx={46} cy={46} r={ringR} fill="none" stroke="var(--dl-border)" strokeWidth={5} />
                    <circle
                      cx={46} cy={46} r={ringR}
                      fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
                      strokeDasharray={ringC} strokeDashoffset={ringOffset}
                      transform="rotate(-90 46 46)"
                      style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--dl-text)', fontFeatureSettings: "'tnum'", lineHeight: 1 }}>
                      {DEMO_SCORE}
                    </span>
                    <span style={{
                      fontSize: '8px', fontWeight: 600, padding: '1px 6px', borderRadius: '99px',
                      marginTop: '2px', color, backgroundColor: bgColor,
                    }}>
                      {bandLabel}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px', fontWeight: 600, color: '#22c55e', marginTop: '2px' }}>
                      <TrendingUp size={8} /> +4
                    </span>
                  </div>
                </div>

                {/* Sparkline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <svg width={spW} height={spH} viewBox={`0 0 ${spW} ${spH}`} style={{ display: 'block' }}>
                    <polyline
                      points={sparklinePoints}
                      fill="none" stroke={getScoreColor(DEMO_SPARKLINE[DEMO_SPARKLINE.length - 1])}
                      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    />
                    {DEMO_SPARKLINE.map((v, i) => {
                      const x = (i / (DEMO_SPARKLINE.length - 1)) * spW;
                      const y = spH - ((v - spMin) / spRange) * (spH - 6) - 3;
                      return (
                        <circle
                          key={i} cx={x} cy={y} r={2.5}
                          fill={getScoreColor(v)}
                          opacity={i === DEMO_SPARKLINE.length - 1 ? 1 : 0.5}
                        />
                      );
                    })}
                  </svg>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ v: best, l: 'Best' }, { v: avg, l: 'Average' }, { v: DEMO_SPARKLINE.length, l: 'Sessions' }].map((s) => (
                      <div key={s.l} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '4px 10px', borderRadius: '6px',
                        border: '1px solid var(--dl-border)', background: 'var(--dl-bg-elevated)',
                      }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dl-text)', fontFeatureSettings: "'tnum'" }}>{s.v}</span>
                        <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--dl-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar */}
                <svg width={80} height={80} viewBox="0 0 80 80">
                  {[1, 0.75, 0.5, 0.25].map((scale) => (
                    <polygon
                      key={scale}
                      points={pentagonPoints(40, 40, 34 * scale)}
                      fill="none" stroke="var(--dl-border)" strokeWidth={0.8}
                    />
                  ))}
                  <polygon
                    points={radarDataPoints(40, 40, 34, [16, 15, 13, 12, 16])}
                    fill={`${color}1a`} stroke={color} strokeWidth={1.5}
                  />
                </svg>
              </div>

              {/* Category Breakdown */}
              {showCategories && (
                <div style={{ marginTop: '16px' }}>
                  <div className="dp-section-title">
                    <Target size={10} />
                    Category Breakdown
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {DEMO_RUBRIC_CATEGORIES.map((cat, i) => {
                      const pct = Math.round((cat.score / cat.maxScore) * 100);
                      const isWeakest = cat === weakest;
                      return (
                        <div
                          key={cat.category}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            opacity: catEased > 0 ? 1 : 0,
                            transition: `all 0.4s ease ${i * 80}ms`,
                          }}
                        >
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: cat.color, flexShrink: 0,
                          }} />
                          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--dl-text-secondary)', width: '60px', flexShrink: 0 }}>
                            {cat.category}
                          </span>
                          <div style={{
                            flex: 1, height: '6px', borderRadius: '3px',
                            background: 'var(--dl-bg-elevated)', overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${pct * catEased}%`, height: '100%', borderRadius: '3px',
                              backgroundColor: cat.color,
                              transition: 'width 0.6s ease-out',
                            }} />
                          </div>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, fontFeatureSettings: "'tnum'",
                            color: 'var(--dl-text)', width: '28px', textAlign: 'right',
                          }}>
                            {Math.round(pct * catEased)}%
                          </span>
                          {isWeakest && catEased >= 0.8 && (
                            <span style={{
                              fontSize: '8px', fontWeight: 600, padding: '1px 5px',
                              borderRadius: '4px', color: 'var(--dl-red)', background: 'var(--dl-red-muted)',
                              textTransform: 'uppercase',
                            }}>
                              Focus
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
              {showRuns && (
                <div style={{ marginTop: '16px' }}>
                  <div className="dp-section-title">
                    <Clock size={10} />
                    Recent Sessions
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {DEMO_RECENT_RUNS.map((run, i) => {
                      const modeColor = getModeColor(run.mode);
                      const sColor = getScoreColor(run.score);
                      return (
                        <div
                          key={run.id}
                          className="dp-run-row"
                          style={{ animation: `dlFadeUp 0.35s ease ${i * 80}ms both` }}
                        >
                          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--dl-text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {run.title}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--dl-text-muted)', fontFeatureSettings: "'tnum'" }}>{run.duration}</span>
                          <span style={{ fontSize: '10px', color: 'var(--dl-text-muted)' }}>{run.date}</span>
                          <span style={{
                            fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
                            color: modeColor, background: `${modeColor}1a`,
                          }}>
                            {run.mode === 'elevator' ? 'Elevator' : 'VC Pitch'}
                          </span>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, fontFeatureSettings: "'tnum'",
                            padding: '1px 6px', borderRadius: '4px',
                            color: sColor, background: `${sColor}1a`,
                          }}>
                            {run.score}
                          </span>
                          <ChevronRight size={11} style={{ color: 'var(--dl-text-muted)' }} />
                        </div>
                      );
                    })}
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
