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

const LEVEL_ZONES = [
  { label: 'Rough Draft', min: 0, max: 24, color: '#ef4444' },
  { label: 'Finding Voice', min: 25, max: 39, color: '#f97316' },
  { label: 'Structured', min: 40, max: 54, color: '#eab308' },
  { label: 'Confident', min: 55, max: 69, color: '#3b82f6' },
  { label: 'Polished', min: 70, max: 84, color: '#8b5cf6' },
  { label: 'Investor-Ready', min: 85, max: 100, color: '#22c55e' },
];

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
  const svgWidth = 600;
  const svgHeight = 200;
  const padding = { top: 12, right: 80, bottom: 32, left: 44 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + (1 - d.score / maxScore) * chartHeight;
    return { x, y, score: d.score, date: d.date };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const yLabels = [0, 25, 50, 75, 100];

  const gridLines = [25, 50, 75].map((val) => ({
    y: padding.top + (1 - val / maxScore) * chartHeight,
    label: val,
  }));

  return (
    <div>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        style={{ height: svgHeight, maxHeight: svgHeight }}
      >
        <defs>
          {/* Main gradient */}
          <linearGradient id="timeline-gradient-v2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5941" stopOpacity="0.18" />
            <stop offset="50%" stopColor="#ff5941" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ff5941" stopOpacity="0" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="line-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* Level zone backgrounds */}
        {LEVEL_ZONES.map((zone) => {
          const y1 = padding.top + (1 - Math.min(zone.max, maxScore) / maxScore) * chartHeight;
          const y2 = padding.top + (1 - zone.min / maxScore) * chartHeight;
          return (
            <g key={zone.label}>
              <rect
                x={padding.left}
                y={y1}
                width={chartWidth}
                height={y2 - y1}
                fill={`${zone.color}05`}
              />
              {/* Zone label on right edge */}
              <text
                x={padding.left + chartWidth + 6}
                y={(y1 + y2) / 2 + 3}
                fontSize={8.5}
                fill={`${zone.color}80`}
                fontFamily="inherit"
                fontWeight="500"
                textAnchor="start"
              >
                {zone.label}
              </text>
            </g>
          );
        })}

        {/* Grid lines */}
        {gridLines.map((line) => (
          <line
            key={line.label}
            x1={padding.left}
            y1={line.y}
            x2={padding.left + chartWidth}
            y2={line.y}
            stroke="var(--border-color)"
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((val) => {
          const y = padding.top + (1 - val / maxScore) * chartHeight;
          return (
            <text
              key={val}
              x={padding.left - 8}
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

        {/* Area fill */}
        <path d={areaD} fill="url(#timeline-gradient-v2)" />

        {/* Glow line (behind main line) */}
        <path
          d={pathD}
          fill="none"
          stroke="#ff5941"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#line-glow)"
          opacity={0.3}
        />

        {/* Main line */}
        <path
          d={pathD}
          fill="none"
          stroke="#ff5941"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          const showLabel =
            i === 0 ||
            i === points.length - 1 ||
            data.length <= 10 ||
            i % Math.ceil(data.length / 8) === 0;

          return (
            <g key={i}>
              {/* Point glow */}
              {isLast && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={8}
                  fill={getScoreColor(p.score)}
                  opacity={0.15}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isLast ? 5 : 3.5}
                fill={getScoreColor(p.score)}
                stroke="var(--bg-surface)"
                strokeWidth={isLast ? 2.5 : 2}
                style={isLast ? { filter: `drop-shadow(0 0 4px ${getScoreColor(p.score)}80)` } : undefined}
              />
              {/* Score label on last point */}
              {isLast && (
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="700"
                  fill={getScoreColor(p.score)}
                  fontFamily="inherit"
                >
                  {p.score}
                </text>
              )}
              {/* X-axis date labels */}
              {showLabel && (
                <text
                  x={p.x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--text-muted)"
                  fontFamily="inherit"
                >
                  {formatDate(p.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
