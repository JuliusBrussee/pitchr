'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  Target,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import {
  GlassCard,
  StatCard,
  CategoryBar,
  TagPill,
  SectionHeader,
  TimeRangeSelector,
  getRubricColor,
} from '@/views/components/ui';
import type { TimeRange } from '@/views/components/ui';
import { getScoreColor } from '@/views/components/ui';

/* ─── Mock Data ──────────────────────────────────────────────── */

const SCORE_TREND: Record<TimeRange, { label: string; value: number }[]> = {
  '7D': [
    { label: 'Feb 15', value: 62 },
    { label: 'Feb 16', value: 71 },
    { label: 'Feb 17', value: 56 },
    { label: 'Feb 18', value: 79 },
    { label: 'Feb 19', value: 84 },
    { label: 'Feb 20', value: 68 },
    { label: 'Feb 21', value: 78 },
  ],
  '30D': [
    { label: 'Jan 23', value: 52 },
    { label: 'Jan 26', value: 58 },
    { label: 'Jan 29', value: 64 },
    { label: 'Feb 1', value: 61 },
    { label: 'Feb 4', value: 67 },
    { label: 'Feb 7', value: 72 },
    { label: 'Feb 10', value: 70 },
    { label: 'Feb 13', value: 75 },
    { label: 'Feb 16', value: 71 },
    { label: 'Feb 18', value: 79 },
    { label: 'Feb 20', value: 84 },
    { label: 'Feb 21', value: 78 },
  ],
  '90D': [
    { label: 'Dec', value: 42 },
    { label: 'Dec', value: 48 },
    { label: 'Jan', value: 55 },
    { label: 'Jan', value: 61 },
    { label: 'Jan', value: 58 },
    { label: 'Jan', value: 64 },
    { label: 'Feb', value: 70 },
    { label: 'Feb', value: 72 },
    { label: 'Feb', value: 75 },
    { label: 'Feb', value: 79 },
    { label: 'Feb', value: 84 },
    { label: 'Feb', value: 78 },
  ],
  All: [
    { label: 'Oct', value: 32 },
    { label: 'Oct', value: 38 },
    { label: 'Nov', value: 44 },
    { label: 'Nov', value: 51 },
    { label: 'Dec', value: 48 },
    { label: 'Dec', value: 55 },
    { label: 'Jan', value: 61 },
    { label: 'Jan', value: 64 },
    { label: 'Jan', value: 67 },
    { label: 'Feb', value: 72 },
    { label: 'Feb', value: 79 },
    { label: 'Feb', value: 78 },
  ],
};

const RUBRIC_CATEGORIES = [
  { id: 'structure', label: 'Structure', score: 16.4, maxScore: 20 },
  { id: 'clarity', label: 'Clarity & Concision', score: 15.8, maxScore: 20 },
  { id: 'evidence', label: 'Evidence & Traction', score: 12.2, maxScore: 20 },
  { id: 'market', label: 'Market & Differentiation', score: 14.6, maxScore: 20 },
  { id: 'delivery', label: 'Delivery', score: 18.0, maxScore: 20 },
];

const INSIGHTS = [
  {
    type: 'strength' as const,
    title: 'Exceptional delivery confidence',
    body: 'Your vocal presence and pacing consistently score above 85th percentile across all sessions.',
  },
  {
    type: 'strength' as const,
    title: 'Strong narrative structure',
    body: 'Problem \u2192 solution \u2192 traction flow is well-established. Keep the opening hook under 15 seconds.',
  },
  {
    type: 'improve' as const,
    title: 'Evidence section needs hard numbers',
    body: 'Scoring 12.2/20 on Evidence & Traction. Add specific metrics: MRR, user count, growth rate.',
  },
  {
    type: 'improve' as const,
    title: 'Market sizing lacks depth',
    body: 'TAM/SAM/SOM breakdown is vague. Use bottom-up calculation with cited sources for credibility.',
  },
  {
    type: 'strength' as const,
    title: 'Clarity improving over time',
    body: 'Filler word usage dropped 40% over the last 30 days. Average WPM now in the ideal 140\u2013160 range.',
  },
];

const RECOMMENDATIONS = [
  {
    title: 'Add traction proof points',
    description:
      'Record a VC Pitch run and focus on weaving 3 specific metrics into your evidence section. Target: 16/20 on Evidence.',
    tag: 'evidence',
  },
  {
    title: 'Refine your market slide',
    description:
      'Practice a 30-second segment on TAM/SAM/SOM using bottom-up analysis. Cite your data sources explicitly.',
    tag: 'market',
  },
  {
    title: 'Maintain delivery excellence',
    description:
      'Your delivery scores are strong. Keep practicing with the webcam on to maintain confidence and eye contact.',
    tag: 'delivery',
  },
];

/* ─── Gradient map for recommendation icon backgrounds ─────── */

const RECOMMENDATION_GRADIENTS: Record<string, string> = {
  evidence: 'linear-gradient(135deg, #22c55e, #16a34a)',
  market: 'linear-gradient(135deg, #f97316, #ea580c)',
  delivery: 'linear-gradient(135deg, #ef4444, #dc2626)',
  structure: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  clarity: 'linear-gradient(135deg, #3b82f6, #2563eb)',
};

const RECOMMENDATION_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  evidence: Target,
  market: Lightbulb,
  delivery: Sparkles,
};

/* ─── Page Component ─────────────────────────────────────────── */

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('30D');
  const trendData = SCORE_TREND[range];

  return (
    <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-5 pr-1">
      {/* Header */}
      <div
        className="flex items-center justify-between animate-fade-in-up"
        style={{ animationDelay: '0ms', animationFillMode: 'both' }}
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
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Overall Score"
          value="78/100"
          icon={<TrendingUp size={16} />}
          delta="+6"
          deltaDirection="up"
          animationDelay="60ms"
        />
        <StatCard
          label="Sessions This Period"
          value="12"
          icon={<BarChart3 size={16} />}
          delta="+3"
          deltaDirection="up"
          animationDelay="120ms"
        />
        <StatCard
          label="Avg Duration"
          value="5:12"
          icon={<Clock size={16} />}
          delta="-0:18"
          deltaDirection="down"
          deltaIsGood
          animationDelay="180ms"
        />
        <StatCard
          label="Improvement Rate"
          value="+14%"
          icon={<ArrowUpRight size={16} />}
          delta="+4%"
          deltaDirection="up"
          animationDelay="240ms"
        />
      </div>

      {/* Score Trend Chart */}
      <GlassCard animationDelay="300ms">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader>Score Trend</SectionHeader>
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

      {/* Two-Column: Rubric Breakdown + Top Insights */}
      <div className="grid grid-cols-2 gap-4">
        {/* Rubric Breakdown */}
        <GlassCard animationDelay="360ms">
          <SectionHeader className="mb-4">Rubric Breakdown</SectionHeader>
          <div className="flex flex-col gap-3.5">
            {RUBRIC_CATEGORIES.map((cat, i) => (
              <CategoryBar
                key={cat.id}
                label={cat.label}
                score={cat.score}
                maxScore={cat.maxScore}
                color={getRubricColor(cat.id)}
                delay={i}
              />
            ))}
          </div>
        </GlassCard>

        {/* Top Insights */}
        <GlassCard animationDelay="420ms">
          <SectionHeader className="mb-4">Top Insights</SectionHeader>
          <div className="flex flex-col gap-3">
            {INSIGHTS.map((insight, i) => (
              <InsightCard key={i} {...insight} delay={i} />
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Practice Recommendations */}
      <GlassCard animationDelay="480ms">
        <SectionHeader className="mb-4">Practice Recommendations</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          {RECOMMENDATIONS.map((rec, i) => (
            <RecommendationCard key={i} {...rec} delay={i} />
          ))}
        </div>
      </GlassCard>

      {/* Bottom spacer */}
      <div className="h-2 flex-shrink-0" />
    </main>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function ScoreTrendChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = 100;
  const yLabels = [100, 80, 60, 40, 20, 0];

  return (
    <div className="flex gap-0" style={{ height: 220 }}>
      {/* Y-axis labels */}
      <div
        className="flex flex-col justify-between pr-3 py-1"
        style={{ width: 36 }}
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
            const barColor = getScoreColor(d.value);

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end relative z-10"
              >
                <div
                  className="w-full max-w-[36px] rounded-t-md relative overflow-hidden transition-all duration-500 ease-out group cursor-default"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: barColor,
                    opacity: 0.85,
                  }}
                >
                  {/* Shine effect on hover */}
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
                    {d.value}
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

function InsightCard({
  type,
  title,
  body,
  delay,
}: {
  type: 'strength' | 'improve';
  title: string;
  body: string;
  delay: number;
}) {
  const isStrength = type === 'strength';
  const borderColor = isStrength ? '#22c55e' : '#f59e0b';
  const iconColor = isStrength ? '#22c55e' : '#f59e0b';
  const Icon = isStrength ? CheckCircle : AlertTriangle;

  return (
    <div
      className="rounded-xl p-3 border transition-all duration-200 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        borderLeftWidth: 3,
        borderLeftColor: borderColor,
        animationDelay: `${480 + delay * 60}ms`,
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
          <p
            className="text-xs leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  title,
  description,
  tag,
  delay,
}: {
  title: string;
  description: string;
  tag: string;
  delay: number;
}) {
  const Icon = RECOMMENDATION_ICONS[tag] ?? Target;
  const gradient = RECOMMENDATION_GRADIENTS[tag] ?? 'linear-gradient(135deg, #6b7280, #4b5563)';
  const tagColor = getRubricColor(tag);

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 animate-fade-in-up hover:scale-[1.01]"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        animationDelay: `${540 + delay * 60}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: gradient }}
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
      <div className="self-start">
        <TagPill
          label={tag.charAt(0).toUpperCase() + tag.slice(1)}
          color={tagColor}
        />
      </div>
    </div>
  );
}
