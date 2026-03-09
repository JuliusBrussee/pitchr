'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const RUBRIC = [
  { label: 'Structure', score: 18, max: 20, color: '#ff5941' },
  { label: 'Clarity', score: 16, max: 20, color: '#ffaa33' },
  { label: 'Evidence', score: 14, max: 20, color: '#22c55e' },
  { label: 'Market', score: 17, max: 20, color: '#f97316' },
  { label: 'Delivery', score: 15, max: 20, color: '#ef4444' },
];

const TOTAL_SCORE = RUBRIC.reduce((sum, r) => sum + r.score, 0);
const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScoreColor(score: number): string {
  const hue = (score / 100) * 120;
  return `hsl(${hue}, 72%, 45%)`;
}

export function ScoringLogicHero() {
  const [score, setScore] = useState(0);
  const [barWidths, setBarWidths] = useState<number[]>(RUBRIC.map(() => 0));
  const [rowsVisible, setRowsVisible] = useState<boolean[]>(RUBRIC.map(() => false));
  const [glowActive, setGlowActive] = useState(false);
  const frameRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const animate = useCallback(() => {
    const start = performance.now();
    const tick = (now: number) => {
      if (!mountedRef.current) return;
      const t = Math.min((now - start) / 1100, 1);
      const e = 1 - Math.pow(1 - t, 3);
      setScore(Math.round(e * TOTAL_SCORE));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
      else setGlowActive(true);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Stagger row reveals
    RUBRIC.forEach((_, i) => {
      setTimeout(() => {
        if (!mountedRef.current) return;
        setRowsVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 600 + i * 120);
    });

    // Start bar fills
    setTimeout(() => {
      if (!mountedRef.current) return;
      setBarWidths(RUBRIC.map((r) => (r.score / r.max) * 100));
    }, 800);

    // Start score counter
    setTimeout(() => {
      if (mountedRef.current) animate();
    }, 700);

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [animate]);

  const scoreColor = getScoreColor(score);
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);

  return (
    <div className="pp-hero-visual">
      <div className="pp-score-container">
        <div className="pp-score-ring-wrap">
          <div className={`pp-score-ring-glow ${glowActive ? 'active' : ''}`} />
          <svg width={140} height={140} viewBox="0 0 140 140">
            <circle
              cx={70}
              cy={70}
              r={RADIUS}
              fill="none"
              stroke="var(--pp-border)"
              strokeWidth={5}
            />
            <circle
              cx={70}
              cy={70}
              r={RADIUS}
              fill="none"
              stroke={scoreColor}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease',
              }}
            />
          </svg>
          <div className="pp-score-ring-value">
            <div className="pp-score-number" style={{ color: scoreColor }}>
              {score}
            </div>
            <div className="pp-score-label">/ 100</div>
          </div>
        </div>

        <div className="pp-rubric-bars">
          {RUBRIC.map((r, i) => (
            <div
              key={r.label}
              className={`pp-rubric-row ${rowsVisible[i] ? 'visible' : ''}`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <span className="pp-rubric-label">{r.label}</span>
              <div className="pp-rubric-track">
                <div
                  className="pp-rubric-fill"
                  style={{
                    width: `${barWidths[i]}%`,
                    backgroundColor: r.color,
                    transitionDelay: `${i * 0.1}s`,
                  }}
                />
              </div>
              <span className="pp-rubric-score" style={{ color: r.color }}>
                {r.score}/{r.max}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
