'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScrollReveal } from '@/views/components/landing/animations/useScrollReveal';
import { AnimatedCard } from '@/views/components/landing/animations/AnimatedCard';
import { MiniAppFrame } from '@/views/components/landing/animations/MiniAppFrame';

function getScoreColor(score: number): string {
  const hue = (score / 100) * 120;
  return `hsl(${hue}, 72%, 45%)`;
}

function useLoopAnimation(interval: number, onTick: () => void, visible: boolean) {
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (!visible) return;
    onTick();
    timerRef.current = setInterval(onTick, interval);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, interval]);
}

/* ── Card 1: Progress Dashboard (line chart) ── */
function ProgressDemo({ visible }: { visible: boolean }) {
  const [drawPct, setDrawPct] = useState(0);
  const frameRef = useRef<number>(0);
  const scores = [42, 55, 48, 63, 71, 78, 85];
  const w = 200;
  const h = 80;
  const padding = 10;
  const xStep = (w - 2 * padding) / (scores.length - 1);

  const points = scores.map((s, i) => ({
    x: padding + i * xStep,
    y: h - padding - ((s / 100) * (h - 2 * padding)),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${h - padding} L${padding},${h - padding} Z`;

  const animate = useCallback(() => {
    setDrawPct(0);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1200, 1);
      setDrawPct(1 - Math.pow(1 - t, 3));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useLoopAnimation(10000, animate, visible);
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  // Approximate total path length
  const totalLength = 300;

  return (
    <MiniAppFrame>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {/* Score zones */}
        <rect x={padding} y={h - padding - 0.4 * (h - 2 * padding)} width={w - 2 * padding}
          height={0.2 * (h - 2 * padding)} fill="rgba(239,68,68,0.04)" rx={2} />
        <rect x={padding} y={h - padding - (h - 2 * padding)} width={w - 2 * padding}
          height={0.2 * (h - 2 * padding)} fill="rgba(34,197,94,0.04)" rx={2} />
        {/* Area fill */}
        <path d={areaD} fill="url(#progressGrad)" opacity={drawPct * 0.4} />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#ff5941" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={totalLength} strokeDashoffset={totalLength * (1 - drawPct)} />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5}
            fill={getScoreColor(scores[i])} opacity={drawPct > (i / scores.length) ? 1 : 0}
            style={{ transition: 'opacity 0.2s ease' }} />
        ))}
        {/* Latest glow */}
        {drawPct > 0.9 && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={5}
            fill="none" stroke="#22c55e" strokeWidth={1} opacity={0.5}>
            <animate attributeName="r" from="3" to="8" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
        <defs>
          <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5941" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff5941" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </MiniAppFrame>
  );
}

/* ── Card 2: Analytics (category bars) ── */
function AnalyticsDemo({ visible }: { visible: boolean }) {
  const [widths, setWidths] = useState([0, 0, 0]);
  const bars = [
    { label: 'Structure', pct: 85, color: getScoreColor(85) },
    { label: 'Clarity', pct: 72, color: getScoreColor(72) },
    { label: 'Evidence', pct: 58, color: getScoreColor(58) },
  ];

  const animate = useCallback(() => {
    setWidths([0, 0, 0]);
    setTimeout(() => setWidths(bars.map((b) => b.pct)), 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoopAnimation(9000, animate, visible);

  return (
    <MiniAppFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bars.map((b, i) => (
          <div key={b.label}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3 }}>{b.label}</div>
            <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, backgroundColor: b.color,
                width: `${widths[i]}%`, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                transitionDelay: `${i * 100}ms`,
              }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 2 }}>5 sessions analyzed</div>
      </div>
    </MiniAppFrame>
  );
}

/* ── Card 3: Arena & Challenges ── */
function ArenaDemo({ visible }: { visible: boolean }) {
  const [rowsIn, setRowsIn] = useState([false, false, false]);
  const leaderboard = [
    { rank: 1, name: 'Sarah K.', score: 92, medal: '#FFD700' },
    { rank: 2, name: 'Mike T.', score: 88, medal: '#C0C0C0' },
    { rank: 3, name: 'You', score: 85, medal: '#CD7F32', highlight: true },
  ];

  const animate = useCallback(() => {
    setRowsIn([false, false, false]);
    leaderboard.forEach((_, i) => {
      setTimeout(() => setRowsIn((p) => { const n = [...p]; n[i] = true; return n; }), 200 + i * 150);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoopAnimation(9000, animate, visible);

  return (
    <MiniAppFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, fontWeight: 700 }}>Weekly Challenge</div>
          <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,170,51,0.1)', color: '#ffaa33' }}>Hard</span>
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2 }}>60-Second Elevator Pitch</div>
        {leaderboard.map((row, i) => (
          <div
            key={row.rank}
            className={`mini-lb-row ${row.highlight ? 'highlight' : ''}`}
            style={{
              opacity: rowsIn[i] ? 1 : 0,
              transform: rowsIn[i] ? 'translateX(0)' : 'translateX(-12px)',
              transition: 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)',
              transitionDelay: `${i * 0.08}s`,
            }}
          >
            <span className="mini-lb-rank" style={{ background: row.medal }}>#{row.rank}</span>
            <span className="mini-lb-name">{row.name}</span>
            <span className="mini-lb-score" style={{ color: '#22c55e' }}>{row.score}</span>
          </div>
        ))}
      </div>
    </MiniAppFrame>
  );
}

/* ── Card 4: Projects ── */
function ProjectsDemo({ visible }: { visible: boolean }) {
  const [show, setShow] = useState(false);

  const animate = useCallback(() => {
    setShow(false);
    setTimeout(() => setShow(true), 300);
  }, []);

  useLoopAnimation(9000, animate, visible);

  return (
    <MiniAppFrame>
      <div style={{ position: 'relative', height: 80 }}>
        {/* Back card */}
        <div className="mini-project" style={{
          position: 'absolute', left: 8, top: 8, right: 0, bottom: 0,
          opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)', transitionDelay: '0.15s',
        }}>
          <div className="mini-project-title">Product Demo</div>
          <div className="mini-project-meta">
            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>72</span>
            <span>5 sessions</span>
          </div>
        </div>
        {/* Front card */}
        <div className="mini-project" style={{
          position: 'absolute', left: 0, top: 0, right: 8, bottom: 8,
          opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
          zIndex: 1, boxShadow: show ? '0 4px 16px var(--shadow-deep)' : 'none',
        }}>
          <div className="mini-project-title">Series A Pitch</div>
          <div className="mini-project-meta">
            <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>85</span>
            <span>3 sessions</span>
            <div className="mini-project-bar">
              <div className="mini-project-bar-fill" style={{ width: show ? '70%' : '0%', background: '#22c55e', transition: 'width 0.8s ease 0.3s' }} />
            </div>
          </div>
        </div>
      </div>
    </MiniAppFrame>
  );
}

/* ── Main Section ── */
export function GrowthSection() {
  const containerRef = useScrollReveal({ threshold: 0.1, staggerDelay: 0.12 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new MutationObserver(() => {
      if (el.classList.contains('visible')) setVisible(true);
    });
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    if (el.classList.contains('visible')) setVisible(true);
    return () => obs.disconnect();
  }, [containerRef]);

  return (
    <section className="grid-section" id="growth-grid">
      <div className="container" ref={containerRef}>
        <div className="grid-section-header">
          <h2 className="grid-section-title">Track every improvement.</h2>
          <p className="grid-section-sub">See your pitch get stronger with every iteration.</p>
        </div>
        <div className="card-grid">
          <AnimatedCard href="/features/progress" label="Progress Dashboard" tagline="Watch your score climb.">
            <ProgressDemo visible={visible} />
          </AnimatedCard>
          <AnimatedCard href="/features/analytics" label="Analytics" tagline="Deep dive into your data.">
            <AnalyticsDemo visible={visible} />
          </AnimatedCard>
          <AnimatedCard href="/features/arena" label="Arena & Challenges" tagline="Compete. Improve. Win.">
            <ArenaDemo visible={visible} />
          </AnimatedCard>
          <AnimatedCard href="/features/projects" label="Projects" tagline="Organize every pitch.">
            <ProjectsDemo visible={visible} />
          </AnimatedCard>
        </div>
      </div>
    </section>
  );
}
