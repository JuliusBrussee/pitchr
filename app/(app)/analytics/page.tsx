'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Activity,
  MessageSquare,
} from 'lucide-react';
import {
  GlassCard,
  StatCard,
  SectionHeader,
  TimeRangeSelector,
  EmptyState,
} from '@/views/components/ui';
import type { TimeRange } from '@/views/components/ui';
import { getScoreColor, getRubricColor, RUBRIC_COLORS } from '@/views/components/ui';

/* ——— Types ——— */

interface RubricBreakdownItem {
  category: string;
  score: number;
  max_score: number;
}

interface DeliveryMetrics {
  wpm: number;
  duration_seconds: number;
  filler_words: { word: string; count: number }[];
  repeated_phrases: string[];
  within_time_limit: boolean;
}

interface RunRecord {
  id: string;
  overallScore: number;
  createdAt: string;
  analysis: {
    rubric_breakdown: RubricBreakdownItem[];
    delivery_metrics: DeliveryMetrics;
  };
}

/* ——— Helpers ——— */

const DEFAULT_DELIVERY_METRICS: DeliveryMetrics = {
  wpm: 0,
  duration_seconds: 0,
  filler_words: [],
  repeated_phrases: [],
  within_time_limit: false,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : value;
}

function toDayKey(dateIso: string): string {
  return new Date(dateIso).toISOString().slice(0, 10);
}

function formatDayLabel(dayKey: string): string {
  return new Date(`${dayKey}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeCategory(rawCategory: string): string {
  const normalized = rawCategory.toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (normalized.includes('structure') || normalized.includes('narrative')) return 'structure';
  if (normalized.includes('clarity') || normalized.includes('concision')) return 'clarity';
  if (
    normalized.includes('evidence') ||
    normalized.includes('traction') ||
    normalized.includes('proof')
  ) {
    return 'evidence';
  }
  if (
    normalized.includes('market') ||
    normalized.includes('competition') ||
    normalized.includes('moat') ||
    normalized.includes('ask')
  ) {
    return 'market';
  }
  if (
    normalized.includes('delivery') ||
    normalized.includes('pace') ||
    normalized.includes('design') ||
    normalized.includes('speaking')
  ) {
    return 'delivery';
  }
  return normalized;
}

function getObjectField(
  source: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (source[key] !== undefined) {
      return source[key];
    }
  }
  return undefined;
}

function normalizeRubricBreakdown(value: unknown): RubricBreakdownItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isObject(item)) return null;
      const categoryRaw = item.category;
      const category = typeof categoryRaw === 'string' ? normalizeCategory(categoryRaw) : null;
      if (typeof category !== 'string' || category.trim().length === 0) return null;
      const rawScore = toFiniteNumber(item.score, 0);
      const rawMax = toFiniteNumber(item.max_score ?? item.maxScore, 20);
      const scaledScore = rawScore > 0 && rawScore <= 1.2 ? rawScore * 20 : rawScore;
      const scaledMax = rawMax > 0 && rawMax <= 1.2 ? rawMax * 20 : rawMax;
      return {
        category,
        score: scaledScore,
        max_score: scaledMax,
      };
    })
    .filter((item): item is RubricBreakdownItem => item !== null);
}

function normalizeFillerWords(value: unknown): { word: string; count: number }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isObject(item) || typeof item.word !== 'string') return null;
      return { word: item.word, count: toFiniteNumber(item.count, 0) };
    })
    .filter((item): item is { word: string; count: number } => item !== null);
}

function normalizeRepeatedPhrases(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (isObject(item) && typeof item.phrase === 'string') return item.phrase;
      return null;
    })
    .filter((item): item is string => item !== null && item.trim().length > 0);
}

function normalizeDeliveryMetrics(value: unknown): DeliveryMetrics {
  if (!isObject(value)) return DEFAULT_DELIVERY_METRICS;
  const rawWpm = toFiniteNumber(value.wpm, 0);
  return {
    wpm: rawWpm > 0 && rawWpm <= 2 ? rawWpm * 140 : rawWpm,
    duration_seconds: toFiniteNumber(value.duration_seconds ?? value.durationSeconds, 0),
    filler_words: normalizeFillerWords(value.filler_words ?? value.fillerWords),
    repeated_phrases: normalizeRepeatedPhrases(value.repeated_phrases ?? value.repeatedPhrases),
    within_time_limit: Boolean(value.within_time_limit),
  };
}

function extractFeedback(rawRun: Record<string, unknown>): Record<string, unknown> | null {
  const analysis = isObject(rawRun.analysis) ? rawRun.analysis : null;
  const outputs = isObject(rawRun.outputs) ? rawRun.outputs : null;

  if (analysis && Array.isArray(analysis.rubric_breakdown)) {
    return analysis;
  }
  if (outputs && isObject(outputs.feedback)) {
    return outputs.feedback;
  }
  if (analysis && isObject(analysis.outputs) && isObject(analysis.outputs.feedback)) {
    return analysis.outputs.feedback;
  }
  if (analysis && isObject(analysis.analysis) && Array.isArray(analysis.analysis.rubric_breakdown)) {
    return analysis.analysis;
  }
  return null;
}

function normalizeRunRecord(raw: unknown): RunRecord | null {
  if (!isObject(raw)) return null;

  const id = typeof raw.id === 'string' ? raw.id : null;
  const createdAt = toIsoDate(raw.createdAt ?? raw.created_at);
  const feedback = extractFeedback(raw);
  if (!id || !createdAt || !feedback) return null;

  const rubric_breakdown = normalizeRubricBreakdown(
    getObjectField(feedback, ['rubric_breakdown', 'rubricBreakdown']),
  );
  const delivery_metrics = normalizeDeliveryMetrics(
    getObjectField(feedback, ['delivery_metrics', 'deliveryMetrics']),
  );

  const rawOverall = toFiniteNumber(raw.overallScore ?? raw.overall_score, Number.NaN);
  const feedbackOverall = toFiniteNumber(
    getObjectField(feedback, ['overall_score', 'overallScore']),
    Number.NaN,
  );
  const selectedOverall = Number.isFinite(rawOverall) && rawOverall > 0
    ? rawOverall
    : Number.isFinite(feedbackOverall)
      ? feedbackOverall
      : 0;
  const overallScore =
    selectedOverall > 0 && selectedOverall <= 1.2 ? selectedOverall * 100 : selectedOverall;

  return {
    id,
    createdAt,
    overallScore,
    analysis: {
      rubric_breakdown,
      delivery_metrics,
    },
  };
}

function normalizeRuns(rawRuns: unknown): RunRecord[] {
  if (!Array.isArray(rawRuns)) return [];
  return rawRuns
    .map((run) => normalizeRunRecord(run))
    .filter((run): run is RunRecord => run !== null);
}

function sortChronological(runs: RunRecord[]): RunRecord[] {
  return runs
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
  return runs.filter((r) => new Date(r.createdAt) >= cutoff);
}

function computeTrend(runs: RunRecord[]): { label: string; value: number }[] {
  const byDay = new Map<string, number[]>();
  for (const run of sortChronological(runs)) {
    const score = toFiniteNumber(run.overallScore, 0);
    const dayKey = toDayKey(run.createdAt);
    const existing = byDay.get(dayKey) ?? [];
    existing.push(score);
    byDay.set(dayKey, existing);
  }
  return Array.from(byDay.entries()).map(([dayKey, scores]) => ({
    label: formatDayLabel(dayKey),
    value: Math.round(mean(scores)),
  }));
}

function formatSessionLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ——— Compute functions ——— */

function computeStatDeltas(runs: RunRecord[]) {
  const newestFirst = runs
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (newestFirst.length < 2) {
    return {
      scoreDelta: undefined as string | undefined,
      scoreDir: undefined as 'up' | 'down' | undefined,
      scoreIsGood: undefined as boolean | undefined,
      durationDelta: undefined as string | undefined,
      durationDir: undefined as 'up' | 'down' | undefined,
      durationIsGood: undefined as boolean | undefined,
    };
  }

  const mid = Math.floor(newestFirst.length / 2);
  const newerHalf = newestFirst.slice(0, mid);
  const olderHalf = newestFirst.slice(mid);

  const avgNewer = newerHalf.reduce((s, r) => s + r.overallScore, 0) / newerHalf.length;
  const avgOlder = olderHalf.reduce((s, r) => s + r.overallScore, 0) / olderHalf.length;
  const scoreDiff = Math.round(avgNewer - avgOlder);

  const newerDur = newerHalf.filter((r) => r.analysis.delivery_metrics?.duration_seconds != null);
  const olderDur = olderHalf.filter((r) => r.analysis.delivery_metrics?.duration_seconds != null);

  let durationDelta: string | undefined;
  let durationDir: 'up' | 'down' | undefined;
  let durationIsGood: boolean | undefined;

  if (newerDur.length > 0 && olderDur.length > 0) {
    const avgNewerDur = newerDur.reduce((s, r) => s + r.analysis.delivery_metrics.duration_seconds, 0) / newerDur.length;
    const avgOlderDur = olderDur.reduce((s, r) => s + r.analysis.delivery_metrics.duration_seconds, 0) / olderDur.length;
    const durDiff = Math.round(avgNewerDur - avgOlderDur);
    if (durDiff !== 0) {
      durationDelta = `${Math.abs(durDiff)}s`;
      durationDir = durDiff > 0 ? 'up' : 'down';
      durationIsGood = durDiff < 0; // shorter = better
    }
  }

  return {
    scoreDelta: scoreDiff !== 0 ? `${Math.abs(scoreDiff)} pts` : undefined,
    scoreDir: scoreDiff > 0 ? 'up' as const : scoreDiff < 0 ? 'down' as const : undefined,
    scoreIsGood: scoreDiff !== 0 ? scoreDiff > 0 : undefined,
    durationDelta,
    durationDir,
    durationIsGood,
  };
}

function computeRubricTrend(runs: RunRecord[]): { label: string; scores: { category: string; score: number }[] }[] {
  const byDay = new Map<string, Map<string, number[]>>();
  for (const run of sortChronological(runs)) {
    const dayKey = toDayKey(run.createdAt);
    const dayBucket = byDay.get(dayKey) ?? new Map<string, number[]>();
    for (const rb of run.analysis.rubric_breakdown ?? []) {
      const category = normalizeCategory(rb.category);
      if (!(category in RUBRIC_COLORS)) continue;
      const score = toFiniteNumber(rb.score, 0);
      const normalizedScore = score > 0 && score <= 1.2 ? score * 20 : score;
      const existing = dayBucket.get(category) ?? [];
      existing.push(normalizedScore);
      dayBucket.set(category, existing);
    }
    byDay.set(dayKey, dayBucket);
  }
  return Array.from(byDay.entries()).map(([dayKey, scoresByCategory]) => ({
    label: formatDayLabel(dayKey),
    scores: Object.keys(RUBRIC_COLORS).map((category) => ({
      category,
      score: Math.round(mean(scoresByCategory.get(category) ?? [])),
    })),
  }));
}

function computeWpmTrend(runs: RunRecord[]): { label: string; wpm: number }[] {
  return sortChronological(runs)
    .filter((r) => Number.isFinite(r.analysis.delivery_metrics?.wpm))
    .map((r) => ({
      label: formatSessionLabel(r.createdAt),
      wpm: r.analysis.delivery_metrics.wpm,
    }));
}

function computeFillerData(runs: RunRecord[]): {
  trend: { label: string; total: number }[];
  aggregate: { word: string; total: number }[];
} {
  const chronological = sortChronological(runs);
  const trend = chronological.map((r) => {
    const fillers = r.analysis.delivery_metrics?.filler_words ?? [];
    const total = fillers.reduce((s, f) => s + (f.count ?? 0), 0);
    return { label: formatSessionLabel(r.createdAt), total };
  });

  const wordMap = new Map<string, number>();
  for (const r of runs) {
    for (const f of r.analysis.delivery_metrics?.filler_words ?? []) {
      if (f.word) {
        wordMap.set(f.word, (wordMap.get(f.word) ?? 0) + (f.count ?? 0));
      }
    }
  }
  const aggregate = Array.from(wordMap.entries())
    .map(([word, total]) => ({ word, total }))
    .sort((a, b) => b.total - a.total);

  return { trend, aggregate };
}

/* ——— Page Component ——————————————————————————————————————————— */

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('30D');
  const [allRuns, setAllRuns] = useState<RunRecord[]>([]);

  useEffect(() => {
    fetch('/api/pitch/run')
      .then((r) => r.json())
      .then((payload: { runs?: unknown }) => setAllRuns(normalizeRuns(payload.runs)))
      .catch(() => setAllRuns([]));
  }, []);

  const filteredRuns = useMemo(() => filterByRange(allRuns, range), [allRuns, range]);
  const trendData = useMemo(() => computeTrend(filteredRuns), [filteredRuns]);
  const deltas = useMemo(() => computeStatDeltas(filteredRuns), [filteredRuns]);
  const rubricTrend = useMemo(() => computeRubricTrend(filteredRuns), [filteredRuns]);
  const wpmTrend = useMemo(() => computeWpmTrend(filteredRuns), [filteredRuns]);
  const fillerData = useMemo(() => computeFillerData(filteredRuns), [filteredRuns]);

  const avgScore = filteredRuns.length > 0
    ? Math.round(filteredRuns.reduce((s, r) => s + r.overallScore, 0) / filteredRuns.length)
    : 0;
  const runsWithDuration = filteredRuns.filter((r) => r.analysis.delivery_metrics?.duration_seconds != null);
  const avgDurationSecs = runsWithDuration.length > 0
    ? Math.round(runsWithDuration.reduce((s, r) => s + r.analysis.delivery_metrics.duration_seconds, 0) / runsWithDuration.length)
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
          delta={deltas.scoreDelta}
          deltaDirection={deltas.scoreDir}
          deltaIsGood={deltas.scoreIsGood}
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
          delta={deltas.durationDelta}
          deltaDirection={deltas.durationDir}
          deltaIsGood={deltas.durationIsGood}
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
        {trendData.length === 0 ? (
          <EmptyState message="No sessions in this time range" />
        ) : (
          <ScoreTrendChart data={trendData} />
        )}
      </GlassCard>

      {/* Rubric Category Trend */}
      <GlassCard animationDelay="360ms">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader>Rubric Category Trend</SectionHeader>
          <Activity size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
        {rubricTrend.length === 0 ? (
          <EmptyState message="No sessions to show rubric trends" />
        ) : (
          <RubricTrendChart data={rubricTrend} />
        )}
      </GlassCard>

      {/* Speaking Pace / WPM Trend */}
      <GlassCard animationDelay="420ms">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader>Speaking Pace</SectionHeader>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Ideal: 130–160 WPM
          </span>
        </div>
        {wpmTrend.length === 0 ? (
          <EmptyState message="No WPM data available" />
        ) : (
          <WpmTrendChart data={wpmTrend} />
        )}
      </GlassCard>

      {/* Filler Words */}
      <GlassCard animationDelay="480ms">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader>Filler Words</SectionHeader>
          <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
        {filteredRuns.length === 0 ? (
          <EmptyState message="No filler word data available" />
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <FillerTrendChart data={fillerData.trend} />
            <FillerAggregateTable data={fillerData.aggregate} />
          </div>
        )}
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
          className="flex-1 flex items-stretch gap-1 relative"
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
            const clampedHeightPct = d.value > 0 ? Math.max(1.5, heightPct) : 0;

            return (
              <div
                key={i}
                className="flex-1 h-full flex flex-col items-center justify-end relative z-10"
              >
                <div
                  className="w-full max-w-[36px] rounded-t-md relative overflow-hidden transition-all duration-500 ease-out group cursor-default"
                  style={{
                    height: `${clampedHeightPct}%`,
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

const CATEGORY_LABELS: Record<string, string> = {
  structure: 'Structure',
  clarity: 'Clarity',
  evidence: 'Evidence',
  market: 'Market',
  delivery: 'Delivery',
};

function RubricTrendChart({ data }: { data: { label: string; scores: { category: string; score: number }[] }[] }) {
  const maxVal = 20;
  const yLabels = [20, 15, 10, 5, 0];
  const categories = Object.keys(RUBRIC_COLORS);

  return (
    <div>
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
          <div
            className="flex-1 flex items-stretch gap-2 relative"
            style={{
              borderBottom: '1px solid var(--border-color)',
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            {/* Horizontal grid lines */}
            {[25, 50, 75].map((pct) => (
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

            {/* Grouped bars per session */}
            {data.map((session, i) => (
              <div
                key={i}
                className="flex-1 h-full flex items-end justify-center gap-[2px] relative z-10 group cursor-default"
              >
                {categories.map((cat) => {
                  const score = session.scores.find((s) => s.category === cat)?.score ?? 0;
                  const heightPct = (score / maxVal) * 100;
                  const clampedHeightPct = score > 0 ? Math.max(2.5, heightPct) : 0;
                  return (
                    <div
                      key={cat}
                      className="rounded-t-sm transition-all duration-500 ease-out"
                      style={{
                        width: '16%',
                        minWidth: 3,
                        maxWidth: 8,
                        height: `${clampedHeightPct}%`,
                        backgroundColor: getRubricColor(cat),
                        opacity: 0.85,
                      }}
                    />
                  );
                })}
                {/* Tooltip on hover */}
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-20"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="text-[10px] font-semibold mb-1">{session.label}</div>
                  {categories.map((cat) => {
                    const score = session.scores.find((s) => s.category === cat)?.score ?? 0;
                    return (
                      <div key={cat} className="flex items-center gap-1.5 text-[10px]">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: getRubricColor(cat) }}
                        />
                        <span>{CATEGORY_LABELS[cat] ?? cat}</span>
                        <span className="font-bold ml-auto pl-2">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-2 mt-2">
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

      {/* Legend row */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getRubricColor(cat) }}
            />
            <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WpmTrendChart({ data }: { data: { label: string; wpm: number }[] }) {
  const maxWpm = Math.max(200, ...data.map((d) => d.wpm)) + 10;
  const minWpm = 0;
  const range = maxWpm - minWpm;

  // Y-axis labels: round to nearest 20
  const yStep = 40;
  const yLabels: number[] = [];
  for (let v = 0; v <= maxWpm; v += yStep) {
    yLabels.push(v);
  }
  yLabels.reverse();

  const idealLow = 130;
  const idealHigh = 160;
  const idealBottomPct = ((idealLow - minWpm) / range) * 100;
  const idealHeightPct = ((idealHigh - idealLow) / range) * 100;

  function getWpmColor(wpm: number): string {
    if (wpm >= idealLow && wpm <= idealHigh) return '#22c55e';
    if (wpm < idealLow) return '#f59e0b';
    return '#ef4444';
  }

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
        <div
          className="flex-1 flex items-stretch gap-1 relative"
          style={{
            borderBottom: '1px solid var(--border-color)',
            borderLeft: '1px solid var(--border-color)',
          }}
        >
          {/* Ideal zone band */}
          <div
            className="absolute left-0 right-0 z-0"
            style={{
              bottom: `${idealBottomPct}%`,
              height: `${idealHeightPct}%`,
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              borderTop: '1px dashed rgba(34, 197, 94, 0.4)',
              borderBottom: '1px dashed rgba(34, 197, 94, 0.4)',
            }}
          />

          {/* Bars */}
          {data.map((d, i) => {
            const heightPct = ((d.wpm - minWpm) / range) * 100;
            const barColor = getWpmColor(d.wpm);

            return (
              <div
                key={i}
                className="flex-1 h-full flex flex-col items-center justify-end relative z-10"
              >
                <div
                  className="w-full max-w-[36px] rounded-t-md relative overflow-hidden transition-all duration-500 ease-out group cursor-default"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: barColor,
                    opacity: 0.85,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.15))',
                    }}
                  />
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
                    style={{
                      backgroundColor: 'var(--bg-surface-hover)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {d.wpm} WPM
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

function FillerTrendChart({ data }: { data: { label: string; total: number }[] }) {
  const maxVal = Math.max(1, ...data.map((d) => d.total));
  const yStep = Math.max(1, Math.ceil(maxVal / 4));
  const yLabels: number[] = [];
  for (let v = 0; v <= maxVal + yStep; v += yStep) {
    yLabels.push(v);
  }
  const yMax = yLabels[yLabels.length - 1];
  yLabels.reverse();

  return (
    <div>
      <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        Filler Count per Session
      </h4>
      <div className="flex gap-0" style={{ height: 180 }}>
        {/* Y-axis labels */}
        <div
          className="flex flex-col justify-between pr-3 py-1"
          style={{ width: 30 }}
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
          <div
            className="flex-1 flex items-stretch gap-1 relative"
            style={{
              borderBottom: '1px solid var(--border-color)',
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            {data.map((d, i) => {
              const heightPct = yMax > 0 ? (d.total / yMax) * 100 : 0;
              const clampedHeightPct = d.total > 0 ? Math.max(2, heightPct) : 0;
              return (
                <div
                  key={i}
                  className="flex-1 h-full flex flex-col items-center justify-end relative z-10"
                >
                  <div
                    className="w-full max-w-[36px] rounded-t-md relative overflow-hidden transition-all duration-500 ease-out group cursor-default"
                    style={{
                      height: `${clampedHeightPct}%`,
                      backgroundColor: '#f59e0b',
                      opacity: 0.85,
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{
                        background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.15))',
                      }}
                    />
                    <div
                      className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
                      style={{
                        backgroundColor: 'var(--bg-surface-hover)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {d.total}
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
    </div>
  );
}

function FillerAggregateTable({ data }: { data: { word: string; total: number }[] }) {
  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const topItems = data.slice(0, 8);

  return (
    <div>
      <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        Most Used Filler Words
      </h4>
      {topItems.length === 0 ? (
        <div className="flex items-center justify-center h-[180px]">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No filler words detected</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {topItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="text-xs font-mono font-medium shrink-0"
                style={{ color: 'var(--text-primary)', width: 72 }}
              >
                &ldquo;{item.word}&rdquo;
              </span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.total / maxTotal) * 100}%`,
                    backgroundColor: '#f59e0b',
                    opacity: 0.8,
                  }}
                />
              </div>
              <span
                className="text-[11px] font-bold tabular-nums shrink-0"
                style={{ color: 'var(--text-secondary)', width: 24, textAlign: 'right' }}
              >
                {item.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
