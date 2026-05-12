'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScrollReveal } from '@/views/components/landing/animations/useScrollReveal';
import { AnimatedCard } from '@/views/components/landing/animations/AnimatedCard';
import { MiniAppFrame } from '@/views/components/landing/animations/MiniAppFrame';

/* ── Shared helpers ── */
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

/* ── Card 1: Score & Rubric ── */
function ScoreRubricDemo({ visible }: { visible: boolean }) {
  const [score, setScore] = useState(0);
  const [barWidths, setBarWidths] = useState([0, 0, 0, 0, 0]);
  const frameRef = useRef<number>(0);

  const rubric = [
    { label: 'Structure', s: 18, m: 20 },
    { label: 'Clarity', s: 16, m: 20 },
    { label: 'Evidence', s: 14, m: 20 },
    { label: 'Market', s: 17, m: 20 },
    { label: 'Delivery', s: 15, m: 20 },
  ];

  const animate = useCallback(() => {
    setScore(0);
    setBarWidths([0, 0, 0, 0, 0]);
    const target = 87;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 900, 1);
      setScore(Math.round((1 - Math.pow(1 - t, 3)) * target));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    setTimeout(() => setBarWidths(rubric.map((r) => (r.s / r.m) * 100)), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoopAnimation(9000, animate, visible);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const color = getScoreColor(score);
  const circ = 2 * Math.PI * 22;

  return (
    <MiniAppFrame>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="mini-score-ring-wrap" style={{ width: 50, height: 50 }}>
          <svg width={50} height={50} viewBox="0 0 50 50">
            <circle cx={25} cy={25} r={22} fill="none" stroke="var(--surface-border)" strokeWidth={3} />
            <circle cx={25} cy={25} r={22} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.1s linear' }} />
          </svg>
          <span className="mini-score-value" style={{ color, fontSize: 13 }}>{score}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rubric.map((r, i) => {
            const pct = (r.s / r.m) * 100;
            const c = getScoreColor(pct);
            return (
              <div key={r.label} className="mini-rubric-row">
                <span className="mini-rubric-label" style={{ width: 44, fontSize: 8 }}>{r.label}</span>
                <div className="mini-rubric-track">
                  <div className="mini-rubric-fill" style={{ width: `${barWidths[i]}%`, backgroundColor: c, transitionDelay: `${i * 80}ms` }} />
                </div>
                <span className="mini-rubric-score" style={{ color: c, fontSize: 8, width: 24 }}>{r.s}/{r.m}</span>
              </div>
            );
          })}
        </div>
      </div>
    </MiniAppFrame>
  );
}

/* ── Card 2: Top Fixes ── */
function TopFixesDemo({ visible }: { visible: boolean }) {
  const [show, setShow] = useState([false, false, false]);
  const fixes = [
    { rank: 1, text: 'Add TAM/SAM market sizing', impact: 'High', color: '#ef4444' },
    { rank: 2, text: 'Include customer traction data', impact: 'Med', color: '#ffaa33' },
    { rank: 3, text: 'Tighten opening hook', impact: 'Low', color: '#6b7280' },
  ];

  const animate = useCallback(() => {
    setShow([false, false, false]);
    fixes.forEach((_, i) => {
      setTimeout(() => setShow((p) => { const n = [...p]; n[i] = true; return n; }), 150 + i * 150);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoopAnimation(9000, animate, visible);

  return (
    <MiniAppFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {fixes.map((fix, i) => (
          <div key={fix.rank} className={`mini-fix ${show[i] ? 'visible' : ''}`}
            style={{ borderLeftColor: fix.color, transitionDelay: `${i * 0.1}s` }}>
            <span className="mini-fix-rank" style={{ backgroundColor: `${fix.color}1a`, color: fix.color }}>{fix.rank}</span>
            <span className="mini-fix-text">{fix.text}</span>
            <span className="mini-fix-impact" style={{ backgroundColor: `${fix.color}1a`, color: fix.color }}>{fix.impact}</span>
          </div>
        ))}
      </div>
    </MiniAppFrame>
  );
}

/* ── Card 3: AI Rewrite ── */
function RewriteDemo({ visible }: { visible: boolean }) {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const animate = useCallback(() => {
    setShowOld(false);
    setShowNew(false);
    setTimeout(() => setShowOld(true), 200);
    setTimeout(() => setShowNew(true), 800);
  }, []);

  useLoopAnimation(9000, animate, visible);

  return (
    <MiniAppFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className={`mini-diff-line mini-diff-old ${showOld ? 'visible' : ''}`}>
          <span className="mini-diff-tag" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>Before</span>
          &ldquo;We&apos;re building a platform for founders&rdquo;
        </div>
        <div className={`mini-diff-line mini-diff-new ${showNew ? 'visible' : ''}`}>
          <span className="mini-diff-tag" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)' }}>After</span>
          &ldquo;We&apos;re the AI pitch coach that helped 200+ founders raise $50M+&rdquo;
        </div>
      </div>
    </MiniAppFrame>
  );
}

/* ── Card 4: Delivery Metrics ── */
function DeliveryMetricsDemo({ visible }: { visible: boolean }) {
  const [wpm, setWpm] = useState(0);
  const [fillers, setFillers] = useState(0);
  const [durPct, setDurPct] = useState(0);
  const frameRef = useRef<number>(0);

  const animate = useCallback(() => {
    setWpm(0);
    setFillers(0);
    setDurPct(0);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1000, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setWpm(Math.round(e * 142));
      setFillers(Math.round(e * 3));
      setDurPct(e * 85);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useLoopAnimation(9000, animate, visible);
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  return (
    <MiniAppFrame>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{wpm}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>WPM</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{fillers}</div>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fillers</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <span className="mini-metric-pill" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: 8 }}>Optimal</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: 'var(--text-muted)', marginBottom: 3 }}>Duration: 1:52 / 2:00</div>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: '#22c55e', width: `${durPct}%`, transition: 'width 0.1s linear' }} />
          </div>
        </div>
      </div>
    </MiniAppFrame>
  );
}

/* ── Card 5: QA Pack ── */
function QAPackDemo({ visible }: { visible: boolean }) {
  const [fanned, setFanned] = useState(false);
  const questions = [
    "What's your competitive moat?",
    'How do you plan to monetize?',
    "What's your CAC/LTV?",
  ];

  const animate = useCallback(() => {
    setFanned(false);
    setTimeout(() => setFanned(true), 400);
  }, []);

  useLoopAnimation(9000, animate, visible);

  return (
    <MiniAppFrame>
      <div className="mini-qa-stack" style={{ height: 90 }}>
        {questions.map((q, i) => (
          <div
            key={i}
            className="mini-qa-card"
            style={{
              zIndex: 3 - i,
              transform: fanned
                ? `rotate(${(i - 1) * 5}deg) translateX(${(i - 1) * 8}px) translateY(${i * 2}px)`
                : `translateX(${i * 2}px) translateY(${i * 2}px)`,
            }}
          >
            <span className="mini-qa-icon">?</span>
            <span className="mini-qa-text">{q}</span>
          </div>
        ))}
      </div>
    </MiniAppFrame>
  );
}

/* ── Card 6: Deck Analysis ── */
function DeckAnalysisDemo({ visible }: { visible: boolean }) {
  const [badges, setBadges] = useState([false, false, false]);
  const slides = [
    { score: 72, color: '#3b82f6' },
    { score: 85, color: '#22c55e' },
    { score: 64, color: '#ffaa33' },
  ];

  const animate = useCallback(() => {
    setBadges([false, false, false]);
    slides.forEach((_, i) => {
      setTimeout(() => setBadges((p) => { const n = [...p]; n[i] = true; return n; }), 300 + i * 300);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoopAnimation(9000, animate, visible);

  return (
    <MiniAppFrame>
      <div style={{ display: 'flex', gap: 6 }}>
        {slides.map((s, i) => (
          <div key={i} className="mini-slide" style={{ flex: 1 }}>
            <div className="mini-slide-lines">
              <div className="mini-slide-line" style={{ width: '70%' }} />
              <div className="mini-slide-line" style={{ width: '90%' }} />
              <div className="mini-slide-line" style={{ width: '50%' }} />
            </div>
            <span
              className={`mini-slide-badge ${badges[i] ? 'visible' : ''}`}
              style={{ backgroundColor: s.color, transitionDelay: `${i * 0.1}s` }}
            >
              {s.score}
            </span>
          </div>
        ))}
      </div>
    </MiniAppFrame>
  );
}

/* ── Main Section ── */
export function ToolkitSection() {
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
    <section className="grid-section" id="toolkit">
      <div className="container" ref={containerRef}>
        <div className="grid-section-header">
          <h2 className="grid-section-title">Your investor-ready toolkit.</h2>
          <p className="grid-section-sub">Everything you need to nail your next investor meeting.</p>
        </div>
        <div className="card-grid">
          <AnimatedCard href="/features/score-rubric" label="Score & Rubric" tagline="Know exactly where you stand.">
            <ScoreRubricDemo visible={visible} />
          </AnimatedCard>
          <AnimatedCard href="/features/top-fixes" label="Top Fixes" tagline="Ranked by investor impact.">
            <TopFixesDemo visible={visible} />
          </AnimatedCard>
          <AnimatedCard href="/features/ai-rewrite" label="AI Rewrite" tagline="Your pitch, but better.">
            <RewriteDemo visible={visible} />
          </AnimatedCard>
          <AnimatedCard href="/features/delivery-metrics" label="Delivery Metrics" tagline="Every um. Every pause. Every second.">
            <DeliveryMetricsDemo visible={visible} />
          </AnimatedCard>
          <AnimatedCard href="/features/qa-pack" label="QA Pack" tagline="Prep for the hard questions.">
            <QAPackDemo visible={visible} />
          </AnimatedCard>
          <AnimatedCard href="/features/deck-analysis" label="Deck Analysis" tagline="Score your slides too.">
            <DeckAnalysisDemo visible={visible} />
          </AnimatedCard>
        </div>
      </div>
    </section>
  );
}
