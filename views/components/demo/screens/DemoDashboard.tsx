'use client';

import { Play, TrendingUp, Clock } from 'lucide-react';
import { DemoSidebar } from '@/views/components/demo/DemoSidebar';
import {
  DEMO_SCORE,
  DEMO_SPARKLINE,
  DEMO_RECENT_RUNS,
} from '@/views/components/demo/demoData';
import {
  getScoreColor,
  getScoreBgColor,
  getScoreBandLabel,
  getModeColor,
} from '@/views/components/ui/colors';

function ScoreRingSvg({ score, size = 160 }: { score: number; size?: number }) {
  const r = size / 2 - 12;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border-color)"
        strokeWidth={8}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const w = 200;
  const h = 48;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points}
        fill="none"
        stroke={getScoreColor(data[data.length - 1])}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 8) - 4;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            fill={getScoreColor(v)}
            opacity={i === data.length - 1 ? 1 : 0.5}
          />
        );
      })}
    </svg>
  );
}

function pentagonPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 5 })
    .map((_, i) => {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(' ');
}

function radarDataPoints(cx: number, cy: number, maxR: number, scores: number[]): string {
  return scores
    .map((score, i) => {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const r = (score / 20) * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    })
    .join(' ');
}

export function DemoDashboard() {
  const color = getScoreColor(DEMO_SCORE);
  const bgColor = getScoreBgColor(DEMO_SCORE);
  const bandLabel = getScoreBandLabel(DEMO_SCORE);
  const best = Math.max(...DEMO_SPARKLINE);
  const avg = Math.round(DEMO_SPARKLINE.reduce((a, b) => a + b, 0) / DEMO_SPARKLINE.length);

  return (
    <div className="demo-app-layout">
      <DemoSidebar activeNav="dashboard" />
      <main className="demo-main">
        {/* Header */}
        <div className="demo-dash__header">
          <div>
            <h1 className="demo-dash__greeting">Good morning, Alex</h1>
            <p className="demo-dash__date">Friday, March 7, 2026</p>
          </div>
          <button className="demo-dash__start-btn">
            <Play size={15} fill="currentColor" />
            Start Session
          </button>
        </div>

        {/* Score + Sparkline + Mini Stats */}
        <div className="demo-dash__stats">
          <div className="demo-dash__score-ring-wrap">
            <div
              className="demo-dash__score-ring-glow"
              style={{ background: `radial-gradient(circle, ${color}30 0%, transparent 70%)` }}
            />
            <ScoreRingSvg score={DEMO_SCORE} />
            <div className="demo-dash__score-ring-center">
              <span className="demo-dash__score-value">{DEMO_SCORE}</span>
              <span
                className="demo-dash__score-band"
                style={{ color, backgroundColor: bgColor }}
              >
                {bandLabel}
              </span>
              <span className="demo-dash__delta" style={{ color: '#22c55e' }}>
                <TrendingUp size={12} />
                +4
              </span>
            </div>
          </div>

          <div className="demo-dash__sparkline-wrap">
            <Sparkline data={DEMO_SPARKLINE} />
            <div className="demo-dash__mini-stats">
              <div className="demo-dash__mini-stat">
                <span className="demo-dash__mini-stat-value">{best}</span>
                <span className="demo-dash__mini-stat-label">Best</span>
              </div>
              <div className="demo-dash__mini-stat">
                <span className="demo-dash__mini-stat-value">{avg}</span>
                <span className="demo-dash__mini-stat-label">Average</span>
              </div>
              <div className="demo-dash__mini-stat">
                <span className="demo-dash__mini-stat-value">{DEMO_SPARKLINE.length}</span>
                <span className="demo-dash__mini-stat-label">Sessions</span>
              </div>
            </div>
          </div>

          {/* Radar placeholder */}
          <svg width={140} height={140} viewBox="0 0 140 140">
            {[1, 0.75, 0.5, 0.25].map((scale) => (
              <polygon
                key={scale}
                points={pentagonPoints(70, 70, 60 * scale)}
                fill="none"
                stroke="var(--border-color)"
                strokeWidth={1}
              />
            ))}
            <polygon
              points={radarDataPoints(70, 70, 60, [16, 15, 13, 12, 16])}
              fill={`${color}1a`}
              stroke={color}
              strokeWidth={2}
            />
          </svg>
        </div>

        {/* Recent Runs */}
        <h3 className="demo-dash__section-title">
          <Clock size={12} />
          Recent Sessions
        </h3>
        <div className="demo-dash__runs">
          {DEMO_RECENT_RUNS.map((run) => {
            const modeColor = getModeColor(run.mode);
            const sColor = getScoreColor(run.score);
            return (
              <div key={run.id} className="demo-dash__run-row">
                <span className="demo-dash__run-title">{run.title}</span>
                <span className="demo-dash__run-date">{run.date}</span>
                <span
                  className="demo-dash__run-mode"
                  style={{ color: modeColor, backgroundColor: `${modeColor}1a` }}
                >
                  {run.mode === 'elevator' ? 'Elevator' : 'VC Pitch'}
                </span>
                <span
                  className="demo-dash__run-score"
                  style={{ color: sColor, backgroundColor: `${sColor}1a` }}
                >
                  {run.score}
                </span>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
