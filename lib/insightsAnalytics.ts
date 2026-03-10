import type { TimeRange } from '@/views/components/ui';
import { RUBRIC_COLORS } from '@/views/components/ui';

/* ——— Types ——— */

export interface RubricBreakdownItem {
  category: string;
  score: number;
  max_score: number;
}

export interface DeliveryMetrics {
  wpm: number;
  duration_seconds: number;
  filler_words: { word: string; count: number }[];
  repeated_phrases: string[];
  within_time_limit: boolean;
}

export interface RunRecord {
  id: string;
  projectId?: string;
  overallScore: number;
  createdAt: string;
  analysis: {
    rubric_breakdown: RubricBreakdownItem[];
    delivery_metrics: DeliveryMetrics;
  };
}

export interface TrendPoint {
  label: string;
  value: number;
  hasData: boolean;
}

export interface RubricTrendPoint {
  label: string;
  hasData: boolean;
  scores: { category: string; score: number; hasData: boolean }[];
}

export interface TimeBucket {
  fromMs: number;
  toMs: number;
  label: string;
}

/* ——— Helpers ——— */

export function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toDayKey(dateIso: string): string {
  return new Date(dateIso).toISOString().slice(0, 10);
}

export function formatDayLabel(dayKey: string): string {
  return new Date(`${dayKey}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function buildTimeBuckets(runs: RunRecord[], range: TimeRange): TimeBucket[] {
  const now = new Date();
  const today = startOfDay(now);

  if (range === '7D' || range === '30D') {
    const days = range === '7D' ? 7 : 30;
    const firstDay = addDays(today, -(days - 1));
    return Array.from({ length: days }, (_, index) => {
      const from = addDays(firstDay, index);
      const to = addDays(from, 1);
      return {
        fromMs: from.getTime(),
        toMs: to.getTime(),
        label: from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  }

  if (range === '90D') {
    const weeks = 13;
    const firstWeek = addDays(today, -(weeks - 1) * 7);
    return Array.from({ length: weeks }, (_, index) => {
      const from = addDays(firstWeek, index * 7);
      const to = addDays(from, 7);
      return {
        fromMs: from.getTime(),
        toMs: to.getTime(),
        label: from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
    });
  }

  const sorted = sortChronological(runs);
  if (sorted.length === 0) return [];

  const firstRunDate = new Date(sorted[0].createdAt);
  const lastRunDate = new Date(sorted[sorted.length - 1].createdAt);
  const firstMonth = startOfMonth(firstRunDate);
  const lastMonth = startOfMonth(lastRunDate);

  const buckets: TimeBucket[] = [];
  let cursor = firstMonth;
  while (cursor.getTime() <= lastMonth.getTime()) {
    const next = addMonths(cursor, 1);
    buckets.push({
      fromMs: cursor.getTime(),
      toMs: next.getTime(),
      label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    });
    cursor = next;
  }
  return buckets;
}

export function labelStride(length: number): number {
  if (length <= 10) return 1;
  return Math.ceil(length / 10);
}

export function applySparseLabels<T extends { label: string }>(points: T[]): T[] {
  const stride = labelStride(points.length);
  return points.map((point, index) => ({
    ...point,
    label: index % stride === 0 || index === points.length - 1 ? point.label : '',
  }));
}

export function normalizeCategory(rawCategory: string): string {
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

export function sortChronological(runs: RunRecord[]): RunRecord[] {
  return runs
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getDaysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function filterByRange(runs: RunRecord[], range: TimeRange): RunRecord[] {
  if (range === 'All') return runs;
  const daysMap: Record<string, number> = { '7D': 7, '30D': 30, '90D': 90 };
  const cutoff = getDaysAgo(daysMap[range]);
  return runs.filter((r) => new Date(r.createdAt) >= cutoff);
}

export function computeTrend(runs: RunRecord[], range: TimeRange): TrendPoint[] {
  const chronological = sortChronological(runs);
  const buckets = buildTimeBuckets(chronological, range);

  const points: TrendPoint[] = buckets.map((bucket) => {
    const bucketScores = chronological
      .filter((run) => {
        const ts = new Date(run.createdAt).getTime();
        return ts >= bucket.fromMs && ts < bucket.toMs;
      })
      .map((run) => toFiniteNumber(run.overallScore, 0))
      .filter((score) => Number.isFinite(score));

    return {
      label: bucket.label,
      value: bucketScores.length > 0 ? Math.round(mean(bucketScores)) : 0,
      hasData: bucketScores.length > 0,
    };
  });

  return applySparseLabels(points);
}

/* ——— Compute functions ——— */

export function computeStatDeltas(runs: RunRecord[]) {
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
      wpmDelta: undefined as string | undefined,
      wpmDir: undefined as 'up' | 'down' | undefined,
      wpmIsGood: undefined as boolean | undefined,
      fillerDelta: undefined as string | undefined,
      fillerDir: undefined as 'up' | 'down' | undefined,
      fillerIsGood: undefined as boolean | undefined,
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
      durationIsGood = durDiff < 0;
    }
  }

  // WPM delta
  const newerWpm = newerHalf.filter(r => Number.isFinite(r.analysis.delivery_metrics?.wpm));
  const olderWpm = olderHalf.filter(r => Number.isFinite(r.analysis.delivery_metrics?.wpm));
  let wpmDelta: string | undefined;
  let wpmDir: 'up' | 'down' | undefined;
  let wpmIsGood: boolean | undefined;
  if (newerWpm.length > 0 && olderWpm.length > 0) {
    const avgNewerWpm = newerWpm.reduce((s, r) => s + r.analysis.delivery_metrics.wpm, 0) / newerWpm.length;
    const avgOlderWpm = olderWpm.reduce((s, r) => s + r.analysis.delivery_metrics.wpm, 0) / olderWpm.length;
    const wpmDiff = Math.round(avgNewerWpm - avgOlderWpm);
    if (wpmDiff !== 0) {
      wpmDelta = `${Math.abs(wpmDiff)} WPM`;
      wpmDir = wpmDiff > 0 ? 'up' : 'down';
      wpmIsGood = undefined;
    }
  }

  // Filler delta
  const newerFillers = newerHalf.map(r =>
    (r.analysis.delivery_metrics?.filler_words ?? []).reduce((s, f) => s + (f.count ?? 0), 0)
  );
  const olderFillers = olderHalf.map(r =>
    (r.analysis.delivery_metrics?.filler_words ?? []).reduce((s, f) => s + (f.count ?? 0), 0)
  );
  let fillerDelta: string | undefined;
  let fillerDir: 'up' | 'down' | undefined;
  let fillerIsGood: boolean | undefined;
  if (newerFillers.length > 0 && olderFillers.length > 0) {
    const avgNewerFiller = newerFillers.reduce((s, v) => s + v, 0) / newerFillers.length;
    const avgOlderFiller = olderFillers.reduce((s, v) => s + v, 0) / olderFillers.length;
    const fillerDiff = Math.round(avgNewerFiller - avgOlderFiller);
    if (fillerDiff !== 0) {
      fillerDelta = `${Math.abs(fillerDiff)}`;
      fillerDir = fillerDiff > 0 ? 'up' : 'down';
      fillerIsGood = fillerDiff < 0;
    }
  }

  return {
    scoreDelta: scoreDiff !== 0 ? `${Math.abs(scoreDiff)} pts` : undefined,
    scoreDir: scoreDiff > 0 ? 'up' as const : scoreDiff < 0 ? 'down' as const : undefined,
    scoreIsGood: scoreDiff !== 0 ? scoreDiff > 0 : undefined,
    durationDelta,
    durationDir,
    durationIsGood,
    wpmDelta,
    wpmDir,
    wpmIsGood,
    fillerDelta,
    fillerDir,
    fillerIsGood,
  };
}

export function computeRubricTrend(runs: RunRecord[], range: TimeRange): RubricTrendPoint[] {
  const chronological = sortChronological(runs);
  const buckets = buildTimeBuckets(chronological, range);
  const categories = Object.keys(RUBRIC_COLORS);

  const points: RubricTrendPoint[] = buckets.map((bucket) => {
    const runsInBucket = chronological.filter((run) => {
      const ts = new Date(run.createdAt).getTime();
      return ts >= bucket.fromMs && ts < bucket.toMs;
    });

    const scoresByCategory = new Map<string, number[]>();
    for (const category of categories) {
      scoresByCategory.set(category, []);
    }

    for (const run of runsInBucket) {
      for (const rb of run.analysis.rubric_breakdown ?? []) {
        const category = normalizeCategory(rb.category);
        if (!scoresByCategory.has(category)) continue;
        const score = toFiniteNumber(rb.score, 0);
        const normalizedScore = score > 0 && score <= 1.2 ? score * 20 : score;
        scoresByCategory.get(category)?.push(normalizedScore);
      }
    }

    return {
      label: bucket.label,
      hasData: runsInBucket.length > 0,
      scores: categories.map((category) => {
        const values = scoresByCategory.get(category) ?? [];
        return {
          category,
          score: values.length > 0 ? Math.round(mean(values)) : 0,
          hasData: values.length > 0,
        };
      }),
    };
  });

  return applySparseLabels(points);
}

export function computeWpmTrend(runs: RunRecord[]): { label: string; wpm: number }[] {
  return sortChronological(runs)
    .filter((r) => Number.isFinite(r.analysis.delivery_metrics?.wpm))
    .map((r) => ({
      label: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      wpm: r.analysis.delivery_metrics.wpm,
    }));
}

export function computeFillerData(runs: RunRecord[]): {
  trend: { label: string; total: number }[];
  aggregate: { word: string; total: number }[];
} {
  const chronological = sortChronological(runs);
  const trend = chronological.map((r) => {
    const fillers = r.analysis.delivery_metrics?.filler_words ?? [];
    const total = fillers.reduce((s, f) => s + (f.count ?? 0), 0);
    return {
      label: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total,
    };
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

export const INSIGHTS_CATEGORY_LABELS: Record<string, string> = {
  structure: 'Structure',
  clarity: 'Clarity',
  evidence: 'Evidence',
  market: 'Market',
  delivery: 'Delivery',
};
