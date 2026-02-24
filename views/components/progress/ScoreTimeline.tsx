'use client';

import { getScoreColor } from '@/views/components/ui/colors';

interface ScoreTimelineProps {
  data: { date: string; score: number }[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function ScoreTimeline({ data }: ScoreTimelineProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-8"
        style={{ color: 'var(--text-muted)' }}
      >
        <span className="text-xs">No session data available</span>
      </div>
    );
  }

  const maxScore = 100;
  const width = 100; // percentage based
  const height = 180;
  const padding = { top: 10, right: 10, bottom: 30, left: 36 };
  const chartWidth = width;
  const chartHeight = height - padding.top - padding.bottom;

  // SVG points
  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? 50
        : padding.left +
          (i / (data.length - 1)) * (chartWidth - padding.left - padding.right);
    const y = padding.top + (1 - d.score / maxScore) * chartHeight;
    return { x, y, score: d.score, date: d.date };
  });

  // SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}`)
    .join(' ');

  // Area path
  const areaD = `${pathD} L ${points[points.length - 1].x}% ${padding.top + chartHeight} L ${points[0].x}% ${padding.top + chartHeight} Z`;

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  // Grid lines
  const gridLines = [25, 50, 75].map((val) => ({
    y: padding.top + (1 - val / maxScore) * chartHeight,
    label: val,
  }));

  // Score band zones
  const bands = [
    { min: 0, max: 39, color: 'rgba(239,68,68,0.04)' },
    { min: 40, max: 59, color: 'rgba(234,179,8,0.04)' },
    { min: 60, max: 79, color: 'rgba(59,130,246,0.04)' },
    { min: 80, max: 100, color: 'rgba(34,197,94,0.04)' },
  ];

  return (
    <div>
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {/* Score band background zones */}
        {bands.map((band) => {
          const y1 = padding.top + (1 - band.max / maxScore) * chartHeight;
          const y2 = padding.top + (1 - band.min / maxScore) * chartHeight;
          return (
            <rect
              key={band.min}
              x={`${padding.left}%`}
              y={y1}
              width={`${chartWidth - padding.left - padding.right}%`}
              height={y2 - y1}
              fill={band.color}
            />
          );
        })}

        {/* Grid lines */}
        {gridLines.map((line) => (
          <line
            key={line.label}
            x1={`${padding.left}%`}
            y1={line.y}
            x2={`${chartWidth - padding.right}%`}
            y2={line.y}
            stroke="var(--border-color)"
            strokeWidth={0.5}
            strokeDasharray="3,3"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((val) => {
          const y = padding.top + (1 - val / maxScore) * chartHeight;
          return (
            <text
              key={val}
              x={`${padding.left - 2}%`}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fill="var(--text-muted)"
              fontFamily="inherit"
            >
              {val}
            </text>
          );
        })}

        {/* Area gradient fill */}
        <defs>
          <linearGradient id="timeline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5941" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ff5941" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#timeline-gradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#ff5941"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={`${p.x}%`}
              cy={p.y}
              r={4}
              fill={getScoreColor(p.score)}
              stroke="var(--bg-surface)"
              strokeWidth={2}
            />
            {/* X-axis date labels (sparse) */}
            {(i === 0 || i === points.length - 1 || (data.length <= 10) || i % Math.ceil(data.length / 8) === 0) && (
              <text
                x={`${p.x}%`}
                y={height - 5}
                textAnchor="middle"
                fontSize={8}
                fill="var(--text-muted)"
                fontFamily="inherit"
              >
                {formatDate(p.date)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
