'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Shared helpers ── */
function getScoreColor(score: number): string {
  const hue = (score / 100) * 120;
  return `hsl(${hue}, 72%, 45%)`;
}

function useLoop(interval: number, onTick: () => void, visible: boolean) {
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => {
    if (!visible) return;
    onTick();
    timerRef.current = setInterval(onTick, interval);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, interval]);
}

/* ═══════════════════════════════════════
   1. Score & Rubric — Full radar + ring
   ═══════════════════════════════════════ */
function ScoreRubricHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [score, setScore] = useState(0);
  const [barWidths, setBarWidths] = useState([0, 0, 0, 0, 0]);
  const [radarPts, setRadarPts] = useState('');
  const frameRef = useRef<number>(0);

  const rubric = [
    { label: 'Structure', s: 18, m: 20, angle: -90 },
    { label: 'Clarity', s: 16, m: 20, angle: -18 },
    { label: 'Evidence', s: 14, m: 20, angle: 54 },
    { label: 'Market', s: 17, m: 20, angle: 126 },
    { label: 'Delivery', s: 15, m: 20, angle: 198 },
  ];

  const animate = useCallback(() => {
    setScore(0);
    setBarWidths([0, 0, 0, 0, 0]);
    setRadarPts('');
    const target = 87;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1200, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setScore(Math.round(e * target));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    setTimeout(() => setBarWidths(rubric.map((r) => (r.s / r.m) * 100)), 300);

    // Build radar polygon
    setTimeout(() => {
      const cx = 60, cy = 60, maxR = 45;
      const pts = rubric.map((r) => {
        const pct = r.s / r.m;
        const rad = (r.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * maxR * pct;
        const y = cy + Math.sin(rad) * maxR * pct;
        return `${x},${y}`;
      });
      setRadarPts(pts.join(' '));
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoop(10000, animate, visible);
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const circ = 2 * Math.PI * 52;

  return (
    <div className="fhd-score-rubric">
      {/* Left: Score ring */}
      <div className="fhd-score-left">
        <div className="fhd-ring-wrap">
          <svg width={130} height={130} viewBox="0 0 130 130">
            <circle cx={65} cy={65} r={52} fill="none" stroke="var(--border-color)" strokeWidth={6} />
            <circle
              cx={65} cy={65} r={52} fill="none" stroke={getScoreColor(score)} strokeWidth={6}
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.1s linear' }}
            />
          </svg>
          <div className="fhd-ring-score" style={{ color: getScoreColor(score) }}>
            <span className="fhd-ring-number">{score}</span>
            <span className="fhd-ring-label">/ 100</span>
          </div>
        </div>
        <div className="fhd-score-verdict" style={{ color: getScoreColor(score) }}>
          {score >= 80 ? 'Investor-Ready' : score >= 60 ? 'Solid' : score >= 40 ? 'Getting There' : 'Needs Work'}
        </div>
      </div>

      {/* Right: Radar + bars */}
      <div className="fhd-score-right">
        {/* Radar chart */}
        <div className="fhd-radar-wrap">
          <svg width={120} height={120} viewBox="0 0 120 120">
            {/* Grid rings */}
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <polygon
                key={pct}
                points={rubric.map((r) => {
                  const rad = (r.angle * Math.PI) / 180;
                  const x = 60 + Math.cos(rad) * 45 * pct;
                  const y = 60 + Math.sin(rad) * 45 * pct;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none" stroke="var(--border-color)" strokeWidth={0.5} opacity={0.5}
              />
            ))}
            {/* Data polygon */}
            {radarPts && (
              <polygon
                points={radarPts}
                fill={`${color}20`} stroke={color} strokeWidth={1.5}
                style={{ transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)' }}
              />
            )}
            {/* Category labels */}
            {rubric.map((r) => {
              const rad = (r.angle * Math.PI) / 180;
              const x = 60 + Math.cos(rad) * 56;
              const y = 60 + Math.sin(rad) * 56;
              return (
                <text key={r.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                  fill="var(--text-secondary)" fontSize={7} fontWeight={600}>
                  {r.label.slice(0, 4)}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Category bars */}
        <div className="fhd-bars">
          {rubric.map((r, i) => {
            const pct = (r.s / r.m) * 100;
            const c = getScoreColor(pct);
            return (
              <div key={r.label} className="fhd-bar-row">
                <span className="fhd-bar-label">{r.label}</span>
                <div className="fhd-bar-track">
                  <div className="fhd-bar-fill" style={{ width: `${barWidths[i]}%`, backgroundColor: c, transitionDelay: `${i * 80}ms` }} />
                </div>
                <span className="fhd-bar-score" style={{ color: c }}>{r.s}/{r.m}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   2. Top Fixes — Cascading fix cards
   ═══════════════════════════════════════ */
function TopFixesHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [show, setShow] = useState([false, false, false, false]);
  const fixes = [
    { rank: 1, text: 'Add TAM/SAM market sizing with specific numbers', impact: 'High', color: '#ef4444', points: '+8 pts', category: 'Market' },
    { rank: 2, text: 'Include customer traction metrics (ARR, users)', impact: 'High', color: '#ef4444', points: '+6 pts', category: 'Evidence' },
    { rank: 3, text: 'Tighten opening hook — lead with the problem', impact: 'Med', color: '#ffaa33', points: '+4 pts', category: 'Structure' },
    { rank: 4, text: 'Reduce filler words in closing ask', impact: 'Low', color: '#6b7280', points: '+2 pts', category: 'Delivery' },
  ];

  const animate = useCallback(() => {
    setShow([false, false, false, false]);
    fixes.forEach((_, i) => {
      setTimeout(() => setShow((p) => { const n = [...p]; n[i] = true; return n; }), 200 + i * 200);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoop(10000, animate, visible);

  return (
    <div className="fhd-fixes">
      <div className="fhd-fixes-header">
        <span className="fhd-fixes-title">Prioritized Improvements</span>
        <span className="fhd-fixes-total" style={{ color }}>+20 pts potential</span>
      </div>
      {fixes.map((fix, i) => (
        <div
          key={fix.rank}
          className="fhd-fix-card"
          style={{
            borderLeftColor: fix.color,
            opacity: show[i] ? 1 : 0,
            transform: show[i] ? 'translateX(0)' : 'translateX(-20px)',
            transitionDelay: `${i * 0.1}s`,
          }}
        >
          <div className="fhd-fix-rank" style={{ backgroundColor: `${fix.color}15`, color: fix.color }}>#{fix.rank}</div>
          <div className="fhd-fix-content">
            <div className="fhd-fix-text">{fix.text}</div>
            <div className="fhd-fix-meta">
              <span className="fhd-fix-category">{fix.category}</span>
              <span className="fhd-fix-impact" style={{ backgroundColor: `${fix.color}15`, color: fix.color }}>{fix.impact}</span>
            </div>
          </div>
          <div className="fhd-fix-points" style={{ color: '#22c55e' }}>{fix.points}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   3. AI Rewrite — Animated diff
   ═══════════════════════════════════════ */
function RewriteHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [phase, setPhase] = useState(0); // 0=hidden, 1=before, 2=processing, 3=after
  const diffs = [
    {
      before: '"We\'re building a platform for founders to practice their pitch"',
      after: '"We\'re the AI pitch coach that helped 200+ founders raise $50M+ in seed funding"',
      category: 'Opening Hook',
    },
    {
      before: '"Our market is really big and growing fast"',
      after: '"The pitch coaching market is $2.4B, growing 18% YoY — and 94% of founders have no structured way to practice"',
      category: 'Market Sizing',
    },
    {
      before: '"We have some early customers who like the product"',
      after: '"42 paying teams, $18K MRR, 89% retention rate, and a waitlist of 1,200 founders"',
      category: 'Traction',
    },
  ];

  const animate = useCallback(() => {
    setPhase(0);
    setTimeout(() => setPhase(1), 300);
    setTimeout(() => setPhase(2), 1500);
    setTimeout(() => setPhase(3), 2500);
  }, []);

  useLoop(12000, animate, visible);

  return (
    <div className="fhd-rewrite">
      <div className="fhd-rewrite-header">
        <span className="fhd-rewrite-title">AI Rewrite Preview</span>
        {phase >= 3 && (
          <span className="fhd-rewrite-badge" style={{ backgroundColor: `${color}15`, color }}>All fixes applied</span>
        )}
      </div>
      {phase === 2 && (
        <div className="fhd-rewrite-processing">
          <div className="fhd-rewrite-spinner" style={{ borderTopColor: color }} />
          <span>Applying 3 fixes...</span>
        </div>
      )}
      <div className="fhd-diffs">
        {diffs.map((d, i) => (
          <div key={i} className="fhd-diff-block" style={{ opacity: phase >= 1 ? 1 : 0, transitionDelay: `${i * 0.15}s` }}>
            <div className="fhd-diff-category">{d.category}</div>
            <div className={`fhd-diff-line fhd-diff-before ${phase >= 1 ? 'show' : ''}`} style={{ transitionDelay: `${i * 0.1}s` }}>
              <span className="fhd-diff-tag" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>Before</span>
              <span className="fhd-diff-text">{d.before}</span>
            </div>
            {phase >= 3 && (
              <div className={`fhd-diff-line fhd-diff-after show`} style={{ transitionDelay: `${i * 0.15}s` }}>
                <span className="fhd-diff-tag" style={{ color, background: `${color}15` }}>After</span>
                <span className="fhd-diff-text">{d.after}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   4. Delivery Metrics — Live gauges
   ═══════════════════════════════════════ */
function DeliveryMetricsHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [tick, setTick] = useState(0);
  const frameRef = useRef<number>(0);

  const animate = useCallback(() => {
    setTick(0);
    const start = performance.now();
    const loop = (now: number) => {
      const t = Math.min((now - start) / 2000, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setTick(e);
      if (t < 1) frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
  }, []);

  useLoop(10000, animate, visible);
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const wpm = Math.round(tick * 142);
  const fillers = Math.round(tick * 3);
  const duration = Math.round(tick * 112);
  const durMin = Math.floor(duration / 60);
  const durSec = duration % 60;

  // Waveform bars
  const waveformBars = Array.from({ length: 32 }, (_, i) => {
    const phase = tick * 6 + i * 0.3;
    return Math.abs(Math.sin(phase)) * 0.7 + 0.15;
  });

  return (
    <div className="fhd-delivery">
      {/* Waveform visualization */}
      <div className="fhd-waveform">
        {waveformBars.map((h, i) => (
          <div
            key={i}
            className="fhd-wave-bar"
            style={{
              height: `${h * 100}%`,
              backgroundColor: wpm > 150 ? '#ef4444' : wpm > 130 ? color : '#6b7280',
              opacity: tick > 0 ? 0.7 : 0.2,
            }}
          />
        ))}
      </div>

      {/* Metrics */}
      <div className="fhd-delivery-metrics">
        <div className="fhd-metric-card">
          <div className="fhd-metric-value" style={{ color: wpm > 150 ? '#ef4444' : wpm >= 130 ? '#22c55e' : color }}>{wpm}</div>
          <div className="fhd-metric-label">WPM</div>
          <div className="fhd-metric-range">
            <div className="fhd-range-track">
              <div className="fhd-range-zone fhd-range-slow" />
              <div className="fhd-range-zone fhd-range-optimal" />
              <div className="fhd-range-zone fhd-range-fast" />
              <div className="fhd-range-marker" style={{ left: `${Math.min((wpm / 200) * 100, 100)}%` }} />
            </div>
            <div className="fhd-range-labels">
              <span>Slow</span>
              <span style={{ color: '#22c55e' }}>Optimal</span>
              <span>Fast</span>
            </div>
          </div>
        </div>

        <div className="fhd-metric-card">
          <div className="fhd-metric-value" style={{ color: fillers === 0 ? '#22c55e' : fillers <= 3 ? color : '#ef4444' }}>{fillers}</div>
          <div className="fhd-metric-label">Filler Words</div>
          {fillers > 0 && (
            <div className="fhd-filler-tags">
              <span className="fhd-filler-tag">&quot;um&quot; × 2</span>
              <span className="fhd-filler-tag">&quot;like&quot; × 1</span>
            </div>
          )}
        </div>

        <div className="fhd-metric-card">
          <div className="fhd-metric-value" style={{ color: '#22c55e' }}>{durMin}:{durSec.toString().padStart(2, '0')}</div>
          <div className="fhd-metric-label">Duration</div>
          <div className="fhd-duration-bar">
            <div className="fhd-duration-fill" style={{ width: `${(duration / 120) * 100}%`, backgroundColor: duration > 120 ? '#ef4444' : '#22c55e' }} />
          </div>
          <div className="fhd-duration-target">Target: 2:00</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   5. QA Pack — Interactive Q&A cards
   ═══════════════════════════════════════ */
function QAPackHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);

  const questions = [
    { q: "What's your competitive moat against incumbents?", a: 'Our moat is the proprietary scoring model trained on 10,000+ real pitch evaluations from VC partners.', difficulty: 'Hard' },
    { q: 'How do you plan to monetize beyond subscriptions?', a: 'Three revenue streams: SaaS subscriptions, accelerator partnerships, and enterprise pitch training.', difficulty: 'Medium' },
    { q: "What's your customer acquisition cost?", a: 'CAC is $12 via content marketing. LTV is $340 with 89% annual retention, giving us a 28:1 LTV/CAC ratio.', difficulty: 'Hard' },
    { q: 'How big is the addressable market?', a: 'TAM is $2.4B (pitch coaching + startup tools). SAM is $480M (English-speaking founders raising capital).', difficulty: 'Easy' },
  ];

  const animate = useCallback(() => {
    setActiveIdx(-1);
    setShowAnswer(false);
    setTimeout(() => setActiveIdx(0), 400);
    setTimeout(() => setActiveIdx(1), 900);
    setTimeout(() => setActiveIdx(2), 1400);
    setTimeout(() => setActiveIdx(3), 1900);
    setTimeout(() => setShowAnswer(true), 2800);
  }, []);

  useLoop(12000, animate, visible);

  return (
    <div className="fhd-qa">
      <div className="fhd-qa-header">
        <span className="fhd-qa-title">Investor Questions</span>
        <span className="fhd-qa-count" style={{ color }}>{Math.max(0, Math.min(activeIdx + 1, questions.length))} / {questions.length}</span>
      </div>
      <div className="fhd-qa-list">
        {questions.map((q, i) => (
          <div
            key={i}
            className={`fhd-qa-card ${activeIdx >= i ? 'show' : ''} ${activeIdx === i && showAnswer ? 'expanded' : ''}`}
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <div className="fhd-qa-question">
              <span className="fhd-qa-icon" style={{ backgroundColor: `${color}15`, color }}>Q{i + 1}</span>
              <span className="fhd-qa-text">{q.q}</span>
              <span className={`fhd-qa-difficulty fhd-qa-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
            </div>
            {activeIdx === i && showAnswer && (
              <div className="fhd-qa-answer">
                <span className="fhd-qa-answer-label" style={{ color }}>Suggested Answer</span>
                <p className="fhd-qa-answer-text">{q.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   6. Deck Analysis — Slide scoring
   ═══════════════════════════════════════ */
function DeckAnalysisHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [scored, setScored] = useState<number[]>([]);
  const slides = [
    { title: 'Title Slide', score: 82, icon: '📄' },
    { title: 'Problem', score: 91, icon: '🔥' },
    { title: 'Solution', score: 78, icon: '💡' },
    { title: 'Market Size', score: 65, icon: '📊' },
    { title: 'Traction', score: 88, icon: '📈' },
    { title: 'Team', score: 74, icon: '👥' },
  ];

  const animate = useCallback(() => {
    setScored([]);
    slides.forEach((_, i) => {
      setTimeout(() => setScored((p) => [...p, i]), 300 + i * 400);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoop(12000, animate, visible);

  return (
    <div className="fhd-deck">
      <div className="fhd-deck-header">
        <span className="fhd-deck-title">Deck Analysis</span>
        <span className="fhd-deck-count">{scored.length} / {slides.length} slides scored</span>
      </div>
      <div className="fhd-slide-grid">
        {slides.map((slide, i) => {
          const isScored = scored.includes(i);
          return (
            <div key={i} className={`fhd-slide ${isScored ? 'scored' : ''}`}>
              <div className="fhd-slide-preview">
                <div className="fhd-slide-icon">{slide.icon}</div>
                <div className="fhd-slide-lines">
                  <div className="fhd-slide-line" style={{ width: '70%' }} />
                  <div className="fhd-slide-line" style={{ width: '90%' }} />
                  <div className="fhd-slide-line" style={{ width: '50%' }} />
                </div>
                {isScored && (
                  <div className="fhd-slide-badge" style={{ backgroundColor: getScoreColor(slide.score) }}>
                    {slide.score}
                  </div>
                )}
              </div>
              <div className="fhd-slide-name">{slide.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   7. Progress — Animated line chart
   ═══════════════════════════════════════ */
function ProgressHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [drawPct, setDrawPct] = useState(0);
  const frameRef = useRef<number>(0);
  const scores = [42, 48, 55, 51, 63, 68, 71, 78, 82, 85];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];
  const w = 400, h = 160, padding = 30;
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
      const t = Math.min((now - start) / 1500, 1);
      setDrawPct(1 - Math.pow(1 - t, 3));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useLoop(10000, animate, visible);
  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const totalLength = 500;

  return (
    <div className="fhd-progress">
      <div className="fhd-progress-header">
        <span className="fhd-progress-title">Score Timeline</span>
        <div className="fhd-progress-legend">
          <span className="fhd-legend-dot" style={{ backgroundColor: '#ef4444' }} /> Needs Work
          <span className="fhd-legend-dot" style={{ backgroundColor: '#ffaa33' }} /> Getting There
          <span className="fhd-legend-dot" style={{ backgroundColor: '#22c55e' }} /> Investor-Ready
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
        {/* Score zones */}
        <rect x={padding} y={h - padding - 0.8 * (h - 2 * padding)} width={w - 2 * padding}
          height={0.2 * (h - 2 * padding)} fill="rgba(34,197,94,0.05)" rx={2} />
        <rect x={padding} y={h - padding - 0.6 * (h - 2 * padding)} width={w - 2 * padding}
          height={0.2 * (h - 2 * padding)} fill="rgba(255,170,51,0.04)" rx={2} />
        <rect x={padding} y={h - padding - 0.4 * (h - 2 * padding)} width={w - 2 * padding}
          height={0.4 * (h - 2 * padding)} fill="rgba(239,68,68,0.03)" rx={2} />

        {/* Grid lines */}
        {[20, 40, 60, 80].map((v) => (
          <g key={v}>
            <line x1={padding} y1={h - padding - (v / 100) * (h - 2 * padding)}
              x2={w - padding} y2={h - padding - (v / 100) * (h - 2 * padding)}
              stroke="var(--border-color)" strokeWidth={0.5} strokeDasharray="4 4" />
            <text x={padding - 6} y={h - padding - (v / 100) * (h - 2 * padding) + 3}
              textAnchor="end" fill="var(--text-muted)" fontSize={8}>{v}</text>
          </g>
        ))}

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <text key={i} x={padding + i * xStep} y={h - 8}
            textAnchor="middle" fill="var(--text-muted)" fontSize={8}>{label}</text>
        ))}

        {/* Area fill */}
        <path d={areaD} fill={`url(#progressGradHero)`} opacity={drawPct * 0.5} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={totalLength} strokeDashoffset={totalLength * (1 - drawPct)} />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5}
            fill={getScoreColor(scores[i])} stroke="#fff" strokeWidth={1.5}
            opacity={drawPct > (i / scores.length) ? 1 : 0}
            style={{ transition: 'opacity 0.2s ease' }} />
        ))}
        {/* Glow on latest */}
        {drawPct > 0.9 && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={6}
            fill="none" stroke="#22c55e" strokeWidth={1.5} opacity={0.5}>
            <animate attributeName="r" from="4" to="10" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
        <defs>
          <linearGradient id="progressGradHero" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════
   8. Analytics — Multi-chart dashboard
   ═══════════════════════════════════════ */
function AnalyticsHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [widths, setWidths] = useState([0, 0, 0, 0, 0]);
  const [velocityShow, setVelocityShow] = useState(false);

  const categories = [
    { label: 'Structure', pct: 85, color: '#ff5941' },
    { label: 'Clarity', pct: 72, color: '#ffaa33' },
    { label: 'Evidence', pct: 58, color: '#22c55e' },
    { label: 'Market', pct: 79, color: '#f97316' },
    { label: 'Delivery', pct: 65, color: '#ef4444' },
  ];

  const animate = useCallback(() => {
    setWidths([0, 0, 0, 0, 0]);
    setVelocityShow(false);
    setTimeout(() => setWidths(categories.map((c) => c.pct)), 200);
    setTimeout(() => setVelocityShow(true), 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoop(10000, animate, visible);

  return (
    <div className="fhd-analytics">
      <div className="fhd-analytics-grid">
        {/* Category breakdown */}
        <div className="fhd-analytics-card">
          <div className="fhd-analytics-card-title">Category Breakdown</div>
          <div className="fhd-analytics-bars">
            {categories.map((c, i) => (
              <div key={c.label} className="fhd-analytics-bar-row">
                <span className="fhd-analytics-bar-label">{c.label}</span>
                <div className="fhd-analytics-bar-track">
                  <div
                    className="fhd-analytics-bar-fill"
                    style={{
                      width: `${widths[i]}%`,
                      backgroundColor: c.color,
                      transitionDelay: `${i * 100}ms`,
                    }}
                  />
                </div>
                <span className="fhd-analytics-bar-value" style={{ color: c.color }}>{c.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Velocity + Focus */}
        <div className="fhd-analytics-card">
          <div className="fhd-analytics-card-title">Improvement Velocity</div>
          <div className="fhd-velocity" style={{ opacity: velocityShow ? 1 : 0 }}>
            <div className="fhd-velocity-number" style={{ color }}>+4.2</div>
            <div className="fhd-velocity-unit">pts/week</div>
            <div className="fhd-velocity-trend">
              <span style={{ color: '#22c55e' }}>↑ 12%</span> vs last week
            </div>
          </div>
          <div className="fhd-focus" style={{ opacity: velocityShow ? 1 : 0 }}>
            <div className="fhd-focus-label">Focus recommendation</div>
            <div className="fhd-focus-area">
              <span className="fhd-focus-dot" style={{ backgroundColor: '#22c55e' }} />
              Evidence — biggest potential gain (+8 pts)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   9. Arena — Leaderboard + challenge
   ═══════════════════════════════════════ */
function ArenaHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [rowsIn, setRowsIn] = useState<boolean[]>([false, false, false, false, false]);
  const [challengeShow, setChallengeShow] = useState(false);

  const leaderboard = [
    { rank: 1, name: 'Sarah K.', score: 92, medal: '#FFD700', delta: '+3' },
    { rank: 2, name: 'Mike T.', score: 88, medal: '#C0C0C0', delta: '+5' },
    { rank: 3, name: 'You', score: 85, medal: '#CD7F32', delta: '+7', highlight: true },
    { rank: 4, name: 'Alex R.', score: 81, medal: '', delta: '+2' },
    { rank: 5, name: 'Priya S.', score: 78, medal: '', delta: '+4' },
  ];

  const animate = useCallback(() => {
    setRowsIn([false, false, false, false, false]);
    setChallengeShow(false);
    setTimeout(() => setChallengeShow(true), 200);
    leaderboard.forEach((_, i) => {
      setTimeout(() => setRowsIn((p) => { const n = [...p]; n[i] = true; return n; }), 500 + i * 150);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoop(10000, animate, visible);

  return (
    <div className="fhd-arena">
      {/* Challenge card */}
      <div className="fhd-challenge" style={{ opacity: challengeShow ? 1 : 0, transform: challengeShow ? 'translateY(0)' : 'translateY(10px)' }}>
        <div className="fhd-challenge-badge" style={{ backgroundColor: `${color}15`, color }}>This Week</div>
        <div className="fhd-challenge-title">60-Second Elevator Pitch</div>
        <div className="fhd-challenge-desc">Pitch your startup in under 60 seconds. Highest score wins.</div>
        <div className="fhd-challenge-meta">
          <span className="fhd-challenge-difficulty" style={{ backgroundColor: 'rgba(255,170,51,0.1)', color: '#ffaa33' }}>Hard</span>
          <span className="fhd-challenge-participants">127 participants</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="fhd-leaderboard">
        <div className="fhd-lb-header">
          <span>Rank</span><span>Founder</span><span>Score</span><span>Δ</span>
        </div>
        {leaderboard.map((row, i) => (
          <div
            key={row.rank}
            className={`fhd-lb-row ${row.highlight ? 'highlight' : ''}`}
            style={{
              opacity: rowsIn[i] ? 1 : 0,
              transform: rowsIn[i] ? 'translateX(0)' : 'translateX(-16px)',
              transitionDelay: `${i * 0.08}s`,
            }}
          >
            <span className="fhd-lb-rank" style={{ background: row.medal || 'var(--border-color)' }}>#{row.rank}</span>
            <span className="fhd-lb-name">{row.name}</span>
            <span className="fhd-lb-score">{row.score}</span>
            <span className="fhd-lb-delta" style={{ color: '#22c55e' }}>{row.delta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   10. Projects — Stacked project cards
   ═══════════════════════════════════════ */
function ProjectsHeroDemo({ color, visible }: { color: string; visible: boolean }) {
  const [activeProject, setActiveProject] = useState(-1);

  const projects = [
    { name: 'Series A Pitch', score: 85, sessions: 12, mode: 'VC Pitch', color: '#22c55e', trend: [62, 68, 74, 79, 82, 85] },
    { name: 'Demo Day', score: 72, sessions: 5, mode: 'Elevator', color: '#3b82f6', trend: [55, 60, 65, 68, 72] },
    { name: 'Product Demo', score: 68, sessions: 3, mode: 'VC Pitch', color: '#ffaa33', trend: [58, 63, 68] },
  ];

  const animate = useCallback(() => {
    setActiveProject(-1);
    setTimeout(() => setActiveProject(0), 400);
    setTimeout(() => setActiveProject(1), 2500);
    setTimeout(() => setActiveProject(0), 4500);
  }, []);

  useLoop(12000, animate, visible);

  return (
    <div className="fhd-projects">
      <div className="fhd-projects-sidebar">
        {projects.map((p, i) => (
          <div
            key={p.name}
            className={`fhd-project-tab ${activeProject === i ? 'active' : ''}`}
            style={{ borderLeftColor: activeProject === i ? p.color : 'transparent' }}
          >
            <div className="fhd-project-tab-name">{p.name}</div>
            <div className="fhd-project-tab-meta">
              <span className="fhd-project-score" style={{ color: getScoreColor(p.score) }}>{p.score}</span>
              <span className="fhd-project-sessions">{p.sessions} sessions</span>
            </div>
          </div>
        ))}
      </div>
      <div className="fhd-projects-detail">
        {activeProject >= 0 && (
          <div className="fhd-project-detail" key={activeProject}>
            <div className="fhd-project-detail-header">
              <h3 className="fhd-project-detail-name">{projects[activeProject].name}</h3>
              <span className="fhd-project-mode" style={{ backgroundColor: `${projects[activeProject].color}15`, color: projects[activeProject].color }}>
                {projects[activeProject].mode}
              </span>
            </div>
            <div className="fhd-project-sparkline">
              <svg width="100%" height={50} viewBox="0 0 200 50" preserveAspectRatio="none">
                <path
                  d={projects[activeProject].trend.map((s, i) => {
                    const x = (i / (projects[activeProject].trend.length - 1)) * 200;
                    const y = 50 - (s / 100) * 50;
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  }).join(' ')}
                  fill="none" stroke={projects[activeProject].color} strokeWidth={2} strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="fhd-project-stats">
              <div><span className="fhd-project-stat-value" style={{ color: getScoreColor(projects[activeProject].score) }}>{projects[activeProject].score}</span> Current</div>
              <div><span className="fhd-project-stat-value">{projects[activeProject].sessions}</span> Sessions</div>
              <div><span className="fhd-project-stat-value" style={{ color: '#22c55e' }}>+{projects[activeProject].score - projects[activeProject].trend[0]}</span> Growth</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Router
   ═══════════════════════════════════════ */
export function FeatureHeroDemo({ slug, color, visible }: { slug: string; color: string; visible: boolean }) {
  const demos: Record<string, React.ReactNode> = {
    'score-rubric': <ScoreRubricHeroDemo color={color} visible={visible} />,
    'top-fixes': <TopFixesHeroDemo color={color} visible={visible} />,
    'ai-rewrite': <RewriteHeroDemo color={color} visible={visible} />,
    'delivery-metrics': <DeliveryMetricsHeroDemo color={color} visible={visible} />,
    'qa-pack': <QAPackHeroDemo color={color} visible={visible} />,
    'deck-analysis': <DeckAnalysisHeroDemo color={color} visible={visible} />,
    'progress': <ProgressHeroDemo color={color} visible={visible} />,
    'analytics': <AnalyticsHeroDemo color={color} visible={visible} />,
    'arena': <ArenaHeroDemo color={color} visible={visible} />,
    'projects': <ProjectsHeroDemo color={color} visible={visible} />,
  };

  return (
    <div className="fhd-frame">
      <div className="fhd-chrome">
        <span className="fhd-dot" style={{ background: '#ff5f57' }} />
        <span className="fhd-dot" style={{ background: '#febc2e' }} />
        <span className="fhd-dot" style={{ background: '#28c840' }} />
        <div className="fhd-url">
          <span className="fhd-url-lock">🔒</span>
          <span className="fhd-url-text">app.pitchr.io/{slug}</span>
        </div>
      </div>
      <div className="fhd-content">
        {demos[slug] || <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Demo coming soon</div>}
      </div>
    </div>
  );
}
