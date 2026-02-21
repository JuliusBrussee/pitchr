'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  GlassCard,
  StatCard,
  CategoryBar,
  SectionHeader,
  TimeRangeSelector,
  InsightCard,
  RecommendationCard,
  getRubricColor,
} from '@/views/components/ui';
import type { TimeRange } from '@/views/components/ui';
import { getScoreColor } from '@/views/components/ui';
import {
  computeRubricAverages,
  computeInsights,
  computeRecommendations,
} from '@/lib/analytics';

/* ——— Types ——— */

interface RunRecord {
  id: string;
  overall_score: number;
  created_at: string;
  analysis: {
    rubric_breakdown: { category: string; score: number; max_score: number }[];
    delivery_metrics: { wpm: number; duration_seconds: number; filler_words: { count: number }[] };
  };
}

function getDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function filterByRange(runs: RunRecord[], range: TimeRange): RunRecord[] {
  if (range === 'All') return runs;
  const daysMap: Record<string, number> = { '7D': 7, '30D': 30, '90D': 90 };
  const cutoff = getDaysAgo(daysMap[range]);
  return runs.filter((r) => new Date(r.created_at) >= cutoff);
}

function computeTrend(runs: RunRecord[]): { label: string; value: number }[] {
  return runs
    .slice()
    .reverse()
    .map((r) => ({
      label: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: r.overall_score,
    }));
}

/* ——— Page Component ——————————————————————————————————————————— */

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('30D');
  const [allRuns, setAllRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pitch/run')
      .then((r) => r.json())
      .then((data) => setAllRuns(Array.isArray(data) ? data : []))
      .catch(() => setAllRuns([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredRuns = useMemo(() => filterByRange(allRuns, range), [allRuns, range]);
  const trendData = useMemo(() => computeTrend(filteredRuns), [filteredRuns]);
  const rubricCategories = useMemo(() => computeRubricAverages(filteredRuns), [filteredRuns]);
  const insights = useMemo(() => computeInsights(rubricCategories), [rubricCategories]);
  const recommendations = useMemo(() => computeRecommendations(rubricCategories), [rubricCategories]);

  const avgScore = filteredRuns.length > 0
    ? Math.round(filteredRuns.reduce((s, r) => s + r.overall_score, 0) / filteredRuns.length)
    : 0;
  const avgDurationSecs = filteredRuns.length > 0
    ? Math.round(filteredRuns.reduce((s, r) => s + r.analysis.delivery_metrics.duration_seconds, 0) / filteredRuns.length)
    : 0;
  const avgDurationStr = `${Math.floor(avgDurationSecs / 60)}:${(avgDurationSecs % 60).toString().padStart(2, '0')}`;

  return (
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-5 pr-1">
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
          value={`${avgScore}/100`}
          icon={<TrendingUp size={16} />}
          animationDelay="60ms"
        />
        <StatCard
          label="Sessions This Period"
          value={String(filteredRuns.length)}
          icon={<BarChart3 size={16} />}
          animationDelay="120ms"
        />
        <StatCard
          label="Avg Duration"
          value={avgDurationStr}
          icon={<Clock size={16} />}
          animationDelay="180ms"
        />
        <StatCard
          label="Total Runs"
          value={String(allRuns.length)}
          icon={<ArrowUpRight size={16} />}
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
            {rubricCategories.map((cat, i) => (
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
            {insights.map((insight, i) => (
              <InsightCard key={i} {...insight} delay={i} />
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Practice Recommendations */}
      <GlassCard animationDelay="480ms">
        <SectionHeader className="mb-4">Practice Recommendations</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} {...rec} delay={i} />
          ))}
        </div>
      </GlassCard>

      {/* Bottom spacer */}
      <div className="h-2 flex-shrink-0" />
    </main>
  );
}

/* ——— Sub-components ——————————————————————————————————————————— */

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
