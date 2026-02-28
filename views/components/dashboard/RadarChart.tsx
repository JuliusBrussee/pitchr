'use client';

import type { RubricCategory } from '@/lib/analytics';
import { getRubricColor } from '@/views/components/ui/colors';

interface RadarChartProps {
  categories: RubricCategory[];
}

export function RadarChart({ categories }: RadarChartProps) {
  const size = 280;
  const center = size / 2;
  const maxRadius = 90;
  const labelRadius = maxRadius + 30;
  const levels = 5;
  const angleStep = (2 * Math.PI) / categories.length;
  const startAngle = -Math.PI / 2;

  const getPoint = (index: number, radius: number) => ({
    x: center + radius * Math.cos(startAngle + index * angleStep),
    y: center + radius * Math.sin(startAngle + index * angleStep),
  });

  const gridPolygons = Array.from({ length: levels }, (_, l) => {
    const r = (maxRadius / levels) * (l + 1);
    return categories.map((_, i) => getPoint(i, r)).map((p) => `${p.x},${p.y}`).join(' ');
  });

  const dataPoints = categories.map((cat, i) => {
    const pct = cat.score / cat.maxScore;
    return getPoint(i, Math.max(pct, 0.05) * maxRadius);
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const sorted = [...categories].sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore));
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  return (
    <div
      className="rounded-2xl border p-5 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
        animationDelay: '0.25s',
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Rubric Breakdown
        </span>
        {categories.some((c) => c.score > 0) && (
          <span
            className="text-[11px] font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {strongest.label} is {Math.round((strongest.score / strongest.maxScore) / Math.max(weakest.score / weakest.maxScore, 0.01))}x stronger than {weakest.label}
          </span>
        )}
      </div>

      {/* Radar SVG */}
      <div className="flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="dash-radar" overflow="visible">
          {/* Grid */}
          {gridPolygons.map((pts, l) => (
            <polygon
              key={l}
              points={pts}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={l === levels - 1 ? 1 : 0.5}
              opacity={0.6}
            />
          ))}
          {/* Axis lines */}
          {categories.map((_, i) => {
            const p = getPoint(i, maxRadius);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke="var(--border-color)"
                strokeWidth={0.5}
                opacity={0.4}
              />
            );
          })}
          {/* Data polygon */}
          <polygon
            points={dataPolygon}
            fill="#ff594120"
            stroke="#ff5941"
            strokeWidth={2}
            strokeLinejoin="round"
            className="dash-radar-shape"
          />
          {/* Data points */}
          {dataPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={getRubricColor(categories[i].id)}
              stroke="var(--bg-primary)"
              strokeWidth={2}
              className="dash-radar-dot"
            />
          ))}
          {/* Labels */}
          {categories.map((cat, i) => {
            const pos = getPoint(i, labelRadius);
            const anchor = pos.x < center - 5 ? 'end' : pos.x > center + 5 ? 'start' : 'middle';
            return (
              <text
                key={i}
                x={pos.x}
                y={pos.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="text-[11px] font-medium"
                fill="var(--text-secondary)"
              >
                {cat.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Category rows — clean, no dropdowns */}
      <div className="flex flex-col gap-2 mt-4">
        {categories.map((cat, i) => {
          const pct = Math.round((cat.score / cat.maxScore) * 100);
          const isWeakest = cat.id === weakest.id && cat.score > 0;

          return (
            <div key={cat.id} className="flex items-center gap-3 py-1 px-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getRubricColor(cat.id) }}
              />
              <span
                className="text-sm font-medium w-44 flex-shrink-0"
                style={{ color: 'var(--text-secondary)' }}
              >
                {cat.label}
              </span>
              <div
                className="flex-1 h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--border-color)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getRubricColor(cat.id),
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              </div>
              <span
                className="text-xs font-bold tabular-nums w-14 text-right"
                style={{ color: 'var(--text-primary)' }}
              >
                {cat.score}/{cat.maxScore}
              </span>
              {isWeakest && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: '#f59e0b1a', color: '#f59e0b' }}
                >
                  Focus
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
