'use client';

import { useEffect, useRef, useState } from 'react';
import { Timer, Clock, MessageSquare, TrendingDown } from 'lucide-react';
import type { FeedbackOutput } from '@/types/analysis-v2';
import { getScoreColor, getScoreBandLabel, getScoreBgColor } from '@/views/components/ui/colors';

interface ScoreHeroProps {
  feedback: FeedbackOutput;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/* ── Mini rubric ring constants ──────────────────────────────── */

const MINI_R = 20;
const MINI_STROKE = 4;
const MINI_C = 2 * Math.PI * MINI_R;

export function ScoreHero({ feedback }: ScoreHeroProps) {
  const score = feedback.overall_score;
  const color = getScoreColor(score);
  const bgColor = getScoreBgColor(score);
  const bandLabel = getScoreBandLabel(score);

  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1100;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(eased * score));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 350);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - score / 100);

  const totalFillers = (feedback.delivery_metrics?.filler_words ?? []).reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const metrics = [
    { label: 'WPM', value: String(feedback.delivery_metrics?.wpm ?? 0), icon: <Timer size={12} /> },
    { label: 'Duration', value: formatDuration(feedback.delivery_metrics?.duration_seconds ?? 0), icon: <Clock size={12} /> },
    { label: 'Fillers', value: String(totalFillers), icon: <MessageSquare size={12} /> },
    { label: 'Penalty', value: String(feedback.penalty ?? 0), icon: <TrendingDown size={12} /> },
  ];

  const rubricItems = (feedback.rubric_breakdown ?? []).filter(
    (item) => !item.category.startsWith('deck_'),
  );

  return (
    <section
      className="rounded-2xl border p-5 md:p-6"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
      }}
    >
      {/* ── Score composition row ─────────────────────────────── */}
      <div className="flex items-start gap-5 md:gap-6">

        {/* Left: Main score ring + badge */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className="relative results-ring-glow"
            style={{ '--ring-glow-color': `${color}33` } as React.CSSProperties}
          >
            <svg width="110" height="110" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="5"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeLinecap="round"
                className="results-score-ring"
                style={{
                  '--ring-offset': offset,
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '60px 60px',
                } as React.CSSProperties}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center results-score-pop">
              <span
                className="text-3xl font-bold tabular-nums tracking-tight"
                style={{ color }}
              >
                {displayScore}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                / 100
              </span>
            </div>
          </div>

          <span
            className="text-[11px] font-semibold px-3 py-0.5 rounded-full mt-2 results-band-badge"
            style={{ color, backgroundColor: bgColor }}
          >
            {bandLabel}
          </span>
        </div>

        {/* Right: Rubric breakdown as contributing scores */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider mb-2.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Score Breakdown
          </p>

          <div className="flex flex-col gap-2">
            {rubricItems.map((item, i) => {
              const pct = clamp(item.max_score > 0 ? item.score / item.max_score : 0, 0, 1);
              const catColor = getScoreColor(item.max_score > 0 ? (item.score / item.max_score) * 100 : 0);
              const dashOffset = MINI_C * (1 - pct);
              const label = item.category.replace(/_/g, ' ');

              return (
                <div
                  key={item.category}
                  className="flex items-center gap-2.5 results-card-enter"
                  style={{ '--card-delay': `${200 + i * 80}ms` } as React.CSSProperties}
                >
                  {/* Mini ring */}
                  <div className="relative w-11 h-11 shrink-0">
                    <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden>
                      <circle
                        cx="24" cy="24" r={MINI_R}
                        fill="none"
                        stroke={`${catColor}20`}
                        strokeWidth={MINI_STROKE}
                      />
                      <circle
                        cx="24" cy="24" r={MINI_R}
                        fill="none"
                        strokeWidth={MINI_STROKE}
                        strokeLinecap="round"
                        className="results-rubric-ring-progress"
                        style={{
                          stroke: catColor,
                          '--ring-circumference': MINI_C,
                          '--ring-offset': dashOffset,
                          '--ring-delay': `${400 + i * 100}ms`,
                          transform: 'rotate(-90deg)',
                          transformOrigin: '24px 24px',
                        } as React.CSSProperties}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-xs font-bold tabular-nums leading-none"
                        style={{ color: catColor }}
                      >
                        {item.score}
                      </span>
                    </div>
                  </div>

                  {/* Label + rationale */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                        {label}
                      </span>
                      <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        /{item.max_score}
                      </span>
                    </div>
                    <p
                      className="text-[11px] leading-snug mt-0.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.rationale}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Verdict ──────────────────────────────────────────── */}
      <p
        className="text-sm leading-relaxed mt-4 results-verdict"
        style={{ color: 'var(--text-primary)' }}
      >
        {feedback.one_line_verdict}
      </p>

      {/* ── Metric strip ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border results-metric-enter"
            style={{
              borderColor: 'var(--border-color)',
              '--metric-delay': `${1200 + i * 70}ms`,
            } as React.CSSProperties}
          >
            <span style={{ color: 'var(--text-muted)' }}>{m.icon}</span>
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {m.value}
            </span>
            <span
              className="text-[9px] uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
