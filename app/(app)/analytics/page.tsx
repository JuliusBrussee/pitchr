'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';

/* ─── Mock Data ──────────────────────────────────────────────── */

const TIME_RANGES = ['7D', '30D', '90D', 'All'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

const SCORE_TREND: Record<TimeRange, { label: string; value: number }[]> = {
  '7D': [
    { label: 'Feb 15', value: 7.1 },
    { label: 'Feb 16', value: 7.4 },
    { label: 'Feb 17', value: 6.9 },
    { label: 'Feb 18', value: 7.6 },
    { label: 'Feb 19', value: 7.8 },
    { label: 'Feb 20', value: 8.0 },
    { label: 'Feb 21', value: 7.8 },
  ],
  '30D': [
    { label: 'Jan 23', value: 6.2 },
    { label: 'Jan 26', value: 6.5 },
    { label: 'Jan 29', value: 6.8 },
    { label: 'Feb 1', value: 7.0 },
    { label: 'Feb 4', value: 6.7 },
    { label: 'Feb 7', value: 7.2 },
    { label: 'Feb 10', value: 7.0 },
    { label: 'Feb 13', value: 7.5 },
    { label: 'Feb 16', value: 7.4 },
    { label: 'Feb 18', value: 7.6 },
    { label: 'Feb 20', value: 8.0 },
    { label: 'Feb 21', value: 7.8 },
  ],
  '90D': [
    { label: 'Dec', value: 5.4 },
    { label: 'Dec', value: 5.8 },
    { label: 'Jan', value: 6.1 },
    { label: 'Jan', value: 6.5 },
    { label: 'Jan', value: 6.3 },
    { label: 'Jan', value: 6.8 },
    { label: 'Feb', value: 7.0 },
    { label: 'Feb', value: 7.2 },
    { label: 'Feb', value: 7.5 },
    { label: 'Feb', value: 7.4 },
    { label: 'Feb', value: 8.0 },
    { label: 'Feb', value: 7.8 },
  ],
  All: [
    { label: 'Oct', value: 4.2 },
    { label: 'Oct', value: 4.8 },
    { label: 'Nov', value: 5.1 },
    { label: 'Nov', value: 5.5 },
    { label: 'Dec', value: 5.4 },
    { label: 'Dec', value: 5.8 },
    { label: 'Jan', value: 6.1 },
    { label: 'Jan', value: 6.5 },
    { label: 'Jan', value: 6.8 },
    { label: 'Feb', value: 7.2 },
    { label: 'Feb', value: 7.6 },
    { label: 'Feb', value: 7.8 },
  ],
};

const CATEGORY_SCORES = [
  { label: 'Clarity', score: 8.2, color: '#22c55e' },
  { label: 'Eye Contact', score: 8.0, color: '#22c55e' },
  { label: 'Pacing', score: 7.5, color: '#3b82f6' },
  { label: 'Body Language', score: 7.1, color: '#3b82f6' },
  { label: 'Conciseness', score: 6.8, color: '#eab308' },
  { label: 'Filler Words', score: 5.9, color: '#ef4444' },
];

const INSIGHTS = [
  {
    type: 'strength' as const,
    icon: CheckCircle,
    title: 'Strong opening hook',
    body: 'Your opening statements consistently grab attention within the first 10 seconds.',
  },
  {
    type: 'strength' as const,
    icon: Award,
    title: 'Excellent eye contact',
    body: 'You maintain steady eye contact 82% of the time, well above the 60% benchmark.',
  },
  {
    type: 'improve' as const,
    icon: AlertTriangle,
    title: 'Reduce filler words',
    body: 'Averaging 6.3 filler words per minute. Try pausing instead of saying "um" or "like".',
  },
  {
    type: 'improve' as const,
    icon: AlertTriangle,
    title: 'Tighten your closing',
    body: 'Your closing section runs 40% longer than your opening. Aim for a concise call to action.',
  },
  {
    type: 'strength' as const,
    icon: CheckCircle,
    title: 'Improving pacing',
    body: 'Your speaking pace has become more consistent, with fewer rushed segments.',
  },
];

const RECOMMENDATIONS = [
  {
    icon: Target,
    title: 'Practice the 60-second pitch',
    description:
      'Condense your full pitch into 60 seconds. This forces clarity and helps you identify the core message. Try recording 3 attempts back-to-back.',
    tag: 'Conciseness',
  },
  {
    icon: Zap,
    title: 'Pause replacement drill',
    description:
      'Record a 2-minute pitch and consciously replace every filler word with a 1-second pause. Silence feels longer to you than to your audience.',
    tag: 'Filler Words',
  },
  {
    icon: Award,
    title: 'Mirror practice for body language',
    description:
      'Practice your pitch in front of a mirror or with the webcam on. Focus on open gestures and avoiding crossed arms or fidgeting.',
    tag: 'Body Language',
  },
];

/* ─── Component ──────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('30D');
  const trendData = SCORE_TREND[range];

  return (
      <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-5 pr-1">
        {/* Header */}
        <div
          className="flex items-center justify-between animate-fade-in-up"
          style={{ animationDelay: '0ms' }}
        >
          <div className="flex items-center gap-3">
            <BarChart3 size={24} style={{ color: 'var(--text-primary)' }} />
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Analytics
            </h1>
          </div>

          {/* Time Range Selector */}
          <div
            className="flex rounded-xl p-1 border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{
                  backgroundColor: range === r ? 'var(--bg-surface-hover)' : 'transparent',
                  color: range === r ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Top Stats Row */}
        <div
          className="grid grid-cols-4 gap-4 animate-fade-in-up"
          style={{ animationDelay: '60ms' }}
        >
          <StatCard
            label="Overall Score"
            value="7.8"
            delta="+0.6"
            deltaDirection="up"
            icon={<TrendingUp size={16} />}
            delay={0}
          />
          <StatCard
            label="Sessions This Period"
            value="12"
            delta="+3"
            deltaDirection="up"
            icon={<BarChart3 size={16} />}
            delay={1}
          />
          <StatCard
            label="Avg Duration"
            value="5:12"
            delta="-0:18"
            deltaDirection="down"
            icon={<Clock size={16} />}
            delay={2}
            deltaIsGood
          />
          <StatCard
            label="Improvement Rate"
            value="+14%"
            delta="+4%"
            deltaDirection="up"
            icon={<ArrowUpRight size={16} />}
            delay={3}
          />
        </div>

        {/* Score Trend Chart */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '120ms' }}
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Score Trend
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {range === '7D'
                  ? 'Last 7 days'
                  : range === '30D'
                    ? 'Last 30 days'
                    : range === '90D'
                      ? 'Last 90 days'
                      : 'All time'}
              </span>
            </div>
            <ScoreTrendChart data={trendData} />
          </GlassCard>
        </div>

        {/* Two-Column: Category Scores + Insights */}
        <div className="grid grid-cols-2 gap-4">
          {/* Category Scores */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '180ms' }}
          >
            <GlassCard>
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'var(--text-muted)' }}
              >
                Category Scores
              </h2>
              <div className="flex flex-col gap-3.5">
                {CATEGORY_SCORES.map((cat, i) => (
                  <CategoryBar key={cat.label} {...cat} delay={i} />
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Top Insights */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '240ms' }}
          >
            <GlassCard>
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'var(--text-muted)' }}
              >
                Top Insights
              </h2>
              <div className="flex flex-col gap-3">
                {INSIGHTS.map((insight, i) => (
                  <InsightCard key={i} {...insight} delay={i} />
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Practice Recommendations */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <GlassCard>
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Practice Recommendations
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {RECOMMENDATIONS.map((rec, i) => (
                <RecommendationCard key={i} {...rec} delay={i} />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Bottom spacer */}
        <div className="h-2 flex-shrink-0" />
      </main>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
      }}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  deltaDirection,
  icon,
  delay,
  deltaIsGood,
}: {
  label: string;
  value: string;
  delta: string;
  deltaDirection: 'up' | 'down';
  icon: React.ReactNode;
  delay: number;
  deltaIsGood?: boolean;
}) {
  const isPositive = deltaDirection === 'up';
  const isGood = deltaIsGood !== undefined ? deltaIsGood : isPositive;

  return (
    <div
      className="rounded-2xl border p-4 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
        animationDelay: `${80 + delay * 60}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </span>
        <span
          className="flex items-center gap-0.5 text-xs font-semibold mb-0.5"
          style={{ color: isGood ? '#22c55e' : '#ef4444' }}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta}
        </span>
      </div>
    </div>
  );
}

function ScoreTrendChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = 10;
  const yLabels = [10, 8, 6, 4, 2, 0];

  return (
    <div className="flex gap-0" style={{ height: 220 }}>
      {/* Y-axis labels */}
      <div
        className="flex flex-col justify-between pr-3 py-1"
        style={{ width: 32 }}
      >
        {yLabels.map((y) => (
          <span
            key={y}
            className="text-[10px] font-medium tabular-nums text-right leading-none"
            style={{ color: 'var(--text-muted)' }}
          >
            {y}
          </span>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 flex flex-col">
        {/* Bars container */}
        <div
          className="flex-1 flex items-end gap-1 relative"
          style={{
            borderBottom: '1px solid var(--border-color)',
            borderLeft: '1px solid var(--border-color)',
          }}
        >
          {/* Horizontal grid lines */}
          {[20, 40, 60, 80].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0"
              style={{
                bottom: `${pct}%`,
                height: 1,
                backgroundColor: 'var(--border-color)',
              }}
            />
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const heightPct = (d.value / maxVal) * 100;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end relative z-10"
              >
                <div
                  className="w-full max-w-[36px] rounded-t-md relative overflow-hidden transition-all duration-500 ease-out group cursor-default"
                  style={{
                    height: `${heightPct}%`,
                    background: `linear-gradient(to top, #7c3aed, #3b82f6)`,
                    opacity: 0.85,
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  {/* Shine effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      background:
                        'linear-gradient(to top, transparent, rgba(255,255,255,0.15))',
                    }}
                  />
                  {/* Tooltip */}
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
                    style={{
                      backgroundColor: 'var(--bg-surface-hover)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {d.value.toFixed(1)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-1 mt-2">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <span
                className="text-[10px] font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryBar({
  label,
  score,
  color,
  delay,
}: {
  label: string;
  score: number;
  color: string;
  delay: number;
}) {
  const pct = (score / 10) * 100;

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-sm font-medium w-28 flex-shrink-0"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-2.5 rounded-full overflow-hidden relative"
        style={{ backgroundColor: 'var(--border-color)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transitionDelay: `${delay * 80}ms`,
          }}
        />
      </div>
      <span
        className="text-sm font-bold tabular-nums w-8 text-right"
        style={{ color: 'var(--text-primary)' }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

function InsightCard({
  type,
  icon: Icon,
  title,
  body,
  delay,
}: {
  type: 'strength' | 'improve';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: string;
  delay: number;
}) {
  const borderColor = type === 'strength' ? '#22c55e' : '#f59e0b';
  const iconColor = type === 'strength' ? '#22c55e' : '#f59e0b';

  return (
    <div
      className="rounded-xl p-3 border transition-all duration-200 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        borderLeftWidth: 3,
        borderLeftColor: borderColor,
        animationDelay: `${280 + delay * 60}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex-shrink-0 mt-0.5" style={{ color: iconColor }}>
          <Icon size={15} />
        </span>
        <div>
          <p
            className="text-xs font-semibold mb-0.5"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  icon: Icon,
  title,
  description,
  tag,
  delay,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  tag: string;
  delay: number;
}) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 animate-fade-in-up hover:scale-[1.01]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        animationDelay: `${360 + delay * 60}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          }}
        >
          <Icon size={16} className="text-white" />
        </div>
        <h3
          className="text-sm font-semibold leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
      <span
        className="self-start text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
        style={{
          color: 'var(--text-muted)',
          backgroundColor: 'var(--border-color)',
        }}
      >
        {tag}
      </span>
    </div>
  );
}
