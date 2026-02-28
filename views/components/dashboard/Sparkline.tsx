'use client';

import { TrendingUp } from 'lucide-react';
import type { ScoreTrend } from '@/lib/analytics';

interface SparklineProps {
  trend: ScoreTrend;
}

export function Sparkline({ trend }: SparklineProps) {
  const { points, bestImprovement } = trend;
  if (points.length < 2) return null;

  const width = 300;
  const height = 140;
  const padding = 8;

  const scores = points.map((p) => p.score);
  const min = Math.max(0, Math.min(...scores) - 10);
  const max = Math.min(100, Math.max(...scores) + 10);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    x: padding + (i / (points.length - 1)) * (width - padding * 2),
    y: padding + (1 - (p.score - min) / range) * (height - padding * 2),
  }));

  const pathD = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const gradientId = 'sparkline-gradient';
  const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;

  return (
    <div
      className="rounded-xl border p-4 animate-fade-in-up flex-1 flex flex-col"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        animationDelay: '0.2s',
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Performance Trend
        </span>
        {bestImprovement && (
          <span
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: '#22c55e' }}
          >
            <TrendingUp size={11} />
            Best jump: {bestImprovement.label}
          </span>
        )}
      </div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="dash-sparkline flex-1"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5941" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ff5941" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={areaD}
          fill={`url(#${gradientId})`}
          className="dash-sparkline-area"
        />
        <path
          d={pathD}
          fill="none"
          stroke="#ff5941"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="dash-sparkline-line"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 3.5 : 2}
            fill={i === coords.length - 1 ? '#ff5941' : 'var(--bg-primary)'}
            stroke="#ff5941"
            strokeWidth={i === coords.length - 1 ? 2 : 1.5}
          />
        ))}
      </svg>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {points.length} sessions
        </span>
        <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
          Latest: {points[points.length - 1].score}/100
        </span>
      </div>
    </div>
  );
}
