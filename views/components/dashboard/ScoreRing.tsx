'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getScoreColor, getScoreBandLabel, SUCCESS, DANGER } from '@/views/components/ui/colors';

interface ScoreRingProps {
  score: number;
  delta?: number;
  totalRuns: number;
}

export function ScoreRing({ score, delta = 0, totalRuns }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (score === 0) return;
    const start = performance.now();
    const duration = 1200;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [score]);

  const color = getScoreColor(score);
  const band = getScoreBandLabel(score);
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const fillPct = score / 100;
  const dashOffset = circumference * (1 - fillPct);

  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta > 0 ? SUCCESS : delta < 0 ? DANGER : 'var(--text-muted)';

  return (
    <div className="dash-score-ring-container flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 192, height: 192 }}>
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full dash-score-glow"
          style={{
            background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
          }}
        />
        <svg
          width={192}
          height={192}
          viewBox="0 0 192 192"
          className="dash-score-ring-svg"
        >
          {/* Track */}
          <circle
            cx={96}
            cy={96}
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
          />
          {/* Fill */}
          <circle
            cx={96}
            cy={96}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="dash-score-ring-fill"
            style={{
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold tabular-nums dash-score-counter"
            style={{ color: 'var(--text-primary)' }}
          >
            {totalRuns > 0 ? animatedScore : '--'}
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-wider mt-0.5"
            style={{ color }}
          >
            {totalRuns > 0 ? band : 'No Data'}
          </span>
        </div>
      </div>

      {/* Delta indicator */}
      {totalRuns >= 2 && delta !== 0 && (
        <div
          className="flex items-center gap-1 text-sm font-semibold dash-delta-badge"
          style={{ color: deltaColor }}
        >
          <DeltaIcon size={14} />
          <span>{delta > 0 ? '+' : ''}{delta} from last session</span>
        </div>
      )}
    </div>
  );
}
