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

  const totalFillers = feedback.delivery_metrics.filler_words.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const metrics = [
    { label: 'WPM', value: String(feedback.delivery_metrics.wpm), icon: <Timer size={13} /> },
    { label: 'Duration', value: formatDuration(feedback.delivery_metrics.duration_seconds), icon: <Clock size={13} /> },
    { label: 'Fillers', value: String(totalFillers), icon: <MessageSquare size={13} /> },
    { label: 'Penalty', value: String(feedback.penalty), icon: <TrendingDown size={13} /> },
  ];

  return (
    <section
      className="rounded-2xl border p-6 md:p-8"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
      }}
    >
      <div className="flex flex-col items-center text-center gap-5">
        {/* Score Ring */}
        <div
          className="relative results-ring-glow"
          style={{ '--ring-glow-color': `${color}33` } as React.CSSProperties}
        >
          <svg width="148" height="148" viewBox="0 0 120 120">
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
              className="text-5xl font-bold tabular-nums tracking-tight"
              style={{ color }}
            >
              {displayScore}
            </span>
            <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              / 100
            </span>
          </div>
        </div>

        {/* Band Badge */}
        <span
          className="text-xs font-semibold px-3.5 py-1 rounded-full results-band-badge"
          style={{ color, backgroundColor: bgColor }}
        >
          {bandLabel}
        </span>

        {/* Verdict */}
        <p
          className="text-base md:text-lg leading-relaxed max-w-2xl results-verdict"
          style={{ color: 'var(--text-primary)' }}
        >
          {feedback.one_line_verdict}
        </p>

        {/* Metric Strip */}
        <div className="flex flex-wrap justify-center gap-2.5 mt-1">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border results-metric-enter"
              style={{
                borderColor: 'var(--border-color)',
                '--metric-delay': `${1200 + i * 70}ms`,
              } as React.CSSProperties}
            >
              <span style={{ color: 'var(--text-muted)' }}>{m.icon}</span>
              <div className="flex flex-col items-start">
                <span
                  className="text-[10px] uppercase tracking-wider leading-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {m.label}
                </span>
                <span
                  className="text-sm font-semibold tabular-nums leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {m.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
