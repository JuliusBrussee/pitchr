'use client';

import { useEffect, useRef, useState } from 'react';
import { Timer, Clock, MessageSquare, TrendingDown } from 'lucide-react';
import type { FeedbackOutput, RubricScore } from '@/types/analysis-v2';
import { getScoreColor, getScoreBandLabel, getScoreBgColor } from '@/views/components/ui/colors';

interface ScoreDashboardProps {
  feedback: FeedbackOutput;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* ── Rubric bar row ─────────────────────────────────────────── */

function RubricBar({
  item,
  index,
}: {
  item: RubricScore;
  index: number;
}) {
  const pct = clamp(item.max_score > 0 ? item.score / item.max_score : 0, 0, 1);
  const color = getScoreColor(item.max_score > 0 ? (item.score / item.max_score) * 100 : 0);
  const label = item.category.replace(/_/g, ' ');

  return (
    <div
      className="results-rubric-row-enter"
      style={{ '--row-delay': `${800 + index * 100}ms` } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs font-medium capitalize tracking-wide"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color }}
        >
          {item.score}
          <span style={{ color: 'var(--text-muted)' }}>/{item.max_score}</span>
        </span>
      </div>

      {/* Progress track */}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: `${color}18` }}
      >
        <div
          className="h-full rounded-full results-rubric-bar"
          style={{
            '--bar-width': `${pct * 100}%`,
            '--bar-delay': `${900 + index * 100}ms`,
            backgroundColor: color,
          } as React.CSSProperties}
        />
      </div>

      {/* Rationale — subtle, compact */}
      <p
        className="text-[11px] leading-snug mt-1 line-clamp-2"
        style={{ color: 'var(--text-muted)' }}
      >
        {item.rationale}
      </p>
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────────────────── */

export function ScoreDashboard({ feedback }: ScoreDashboardProps) {
  const score = feedback.overall_score ?? 0;
  const color = getScoreColor(score);
  const bgColor = getScoreBgColor(score);
  const bandLabel = getScoreBandLabel(score);

  /* Animated score counter */
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

  const delivery = feedback.delivery_metrics;
  const fillerWords = delivery?.filler_words ?? [];
  const totalFillers = fillerWords.reduce((sum, item) => sum + item.count, 0);

  const metrics = [
    { label: 'WPM', value: String(delivery?.wpm ?? 0), icon: <Timer size={12} /> },
    { label: 'Duration', value: formatDuration(delivery?.duration_seconds ?? 0), icon: <Clock size={12} /> },
    { label: 'Fillers', value: String(totalFillers), icon: <MessageSquare size={12} /> },
    { label: 'Penalty', value: String(feedback.penalty ?? 0), icon: <TrendingDown size={12} /> },
  ];

  const rubricItems = (feedback.rubric_breakdown ?? []).filter(
    (item) => !item.category.startsWith('deck_'),
  );

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
      }}
    >
      {/* ── Two-column hero grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* Left: Score ring + verdict */}
        <div className="flex flex-col items-center justify-center text-center p-6 md:p-8 md:border-r" style={{ borderColor: 'var(--border-color)' }}>
          {/* Score Ring */}
          <div
            className="relative results-ring-glow"
            style={{ '--ring-glow-color': `${color}33` } as React.CSSProperties}
          >
            <svg width="132" height="132" viewBox="0 0 120 120">
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
                className="text-4xl font-bold tabular-nums tracking-tight"
                style={{ color }}
              >
                {displayScore}
              </span>
              <span className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                / 100
              </span>
            </div>
          </div>

          {/* Band Badge */}
          <span
            className="text-xs font-semibold px-3 py-0.5 rounded-full mt-3 results-band-badge"
            style={{ color, backgroundColor: bgColor }}
          >
            {bandLabel}
          </span>

          {/* Verdict */}
          <p
            className="text-sm md:text-base leading-relaxed max-w-md mt-3 results-verdict"
            style={{ color: 'var(--text-primary)' }}
          >
            {feedback.one_line_verdict}
          </p>
        </div>

        {/* Right: Rubric bars + metrics */}
        <div className="flex flex-col p-5 md:p-6">
          {/* Rubric label */}
          <h3
            className="text-[10px] font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Score Breakdown
          </h3>

          {/* Rubric bars */}
          <div className="flex flex-col gap-3 flex-1">
            {rubricItems.map((item, index) => (
              <RubricBar key={item.category} item={item} index={index} />
            ))}
          </div>

          {/* Metric strip */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            {metrics.map((m, i) => (
              <div
                key={m.label}
                className="flex flex-col items-center gap-0.5 results-metric-enter"
                style={{ '--metric-delay': `${1200 + i * 70}ms` } as React.CSSProperties}
              >
                <span style={{ color: 'var(--text-muted)' }}>{m.icon}</span>
                <span
                  className="text-sm font-semibold tabular-nums leading-none"
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
        </div>
      </div>
    </section>
  );
}
