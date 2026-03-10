'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TrendingUp,
  Activity,
  Clock,
  MessageSquare,
} from 'lucide-react';
import {
  GlassCard,
  StatCard,
  SectionHeader,
  TimeRangeSelector,
  EmptyState,
  Skeleton,
  SkeletonStatRow,
  SkeletonCard,
  useDelayedLoading,
} from '@/views/components/ui';
import type { TimeRange } from '@/views/components/ui';
import { ProgressHero, SkillLadder, FixTracker } from '@/views/components/progress';
import {
  ScoreTrendChart,
  RubricTrendChart,
  WpmTrendChart,
  FillerTrendChart,
  FillerAggregateTable,
} from '@/views/components/insights';
import { AchievementSummary } from '@/views/components/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { useSmartTooltip } from '@/hooks/useSmartTooltip';
import { useProject } from '@/views/components/ProjectProvider';
import { ProjectSelect } from '@/views/components/ProjectSelect';
import { computeProgress } from '@/lib/progress';
import type { ProgressRunRecord, ProgressSummary } from '@/lib/progress';
import {
  filterByRange,
  computeTrend,
  computeStatDeltas,
  computeRubricTrend,
  computeWpmTrend,
  computeFillerData,
} from '@/lib/insightsAnalytics';
import type { RunRecord } from '@/lib/insightsAnalytics';

/* ——— Types ——— */

interface RawRun {
  id: string;
  mode: string;
  overallScore: number;
  createdAt: string;
  projectId?: string;
  projectName?: string;
  analysis: {
    one_line_verdict: string;
    rubric_breakdown: { category: string; score: number; max_score: number }[];
    delivery_metrics: {
      duration_seconds: number;
      wpm: number;
      filler_rate: number;
      filler_words?: { word: string; count: number }[];
    };
    top_fixes?: { rank: number; category: string; issue: string; fix: string; impact: string }[];
  };
}

/* ——— Normalization ——— */

function normalizeForProgress(raw: RawRun): ProgressRunRecord {
  return {
    id: raw.id,
    createdAt: raw.createdAt,
    overallScore: raw.overallScore,
    mode: raw.mode,
    projectId: raw.projectId,
    projectName: raw.projectName,
    analysis: {
      one_line_verdict: raw.analysis.one_line_verdict,
      rubric_breakdown: raw.analysis.rubric_breakdown ?? [],
      delivery_metrics: {
        duration_seconds: raw.analysis.delivery_metrics?.duration_seconds ?? 0,
        wpm: raw.analysis.delivery_metrics?.wpm ?? 0,
        filler_rate: raw.analysis.delivery_metrics?.filler_rate ?? 0,
      },
      top_fixes: raw.analysis.top_fixes ?? [],
    },
  };
}

function normalizeForAnalytics(raw: RawRun): RunRecord {
  return {
    id: raw.id,
    projectId: raw.projectId,
    overallScore: raw.overallScore,
    createdAt: raw.createdAt,
    analysis: {
      rubric_breakdown: raw.analysis.rubric_breakdown ?? [],
      delivery_metrics: {
        wpm: raw.analysis.delivery_metrics?.wpm ?? 0,
        duration_seconds: raw.analysis.delivery_metrics?.duration_seconds ?? 0,
        filler_words: raw.analysis.delivery_metrics?.filler_words ?? [],
        repeated_phrases: [],
        within_time_limit: true,
      },
    },
  };
}

/* ——— Page Component ——— */

export default function InsightsPage() {
  const [range, setRange] = useState<TimeRange>('30D');
  const [filterProjectId, setFilterProjectId] = useState('all');
  const [allRuns, setAllRuns] = useState<RawRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const { showTooltip } = useSmartTooltip();
  const { projects } = useProject();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const showTooltipRef = useRef(showTooltip);
  showTooltipRef.current = showTooltip;
  const showSkeleton = useDelayedLoading(loading);

  const loadRuns = useCallback(() => {
    setFetchError(false);
    setLoading(true);
    fetchEdge('pitch-run', { params: { allProjects: 'true', summary: 'true' } })
      .then((r) => r.json())
      .then((payload: { runs?: RawRun[] }) => {
        const data = Array.isArray(payload.runs) ? payload.runs : [];
        setAllRuns(data);
      })
      .catch(() => {
        setAllRuns([]);
        setFetchError(true);
        if (containerRef.current) {
          showTooltipRef.current(containerRef.current, 'error', 'Failed to load insights data. Check your connection and try again.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Filter by project
  const projectFilteredRuns = useMemo(
    () => filterProjectId === 'all' ? allRuns : allRuns.filter(r => r.projectId === filterProjectId),
    [allRuns, filterProjectId]
  );

  // For progress (no time range filter — progress is cumulative)
  const progressRuns = useMemo(() => projectFilteredRuns.map(normalizeForProgress), [projectFilteredRuns]);
  const progress: ProgressSummary = useMemo(() => computeProgress(progressRuns), [progressRuns]);

  // For analytics (apply time range filter)
  const analyticsRuns = useMemo(() => projectFilteredRuns.map(normalizeForAnalytics), [projectFilteredRuns]);
  const timeFilteredRuns = useMemo(() => filterByRange(analyticsRuns, range), [analyticsRuns, range]);
  const trendData = useMemo(() => computeTrend(timeFilteredRuns, range), [timeFilteredRuns, range]);
  const rubricTrend = useMemo(() => computeRubricTrend(timeFilteredRuns, range), [timeFilteredRuns, range]);
  const wpmTrend = useMemo(() => computeWpmTrend(timeFilteredRuns), [timeFilteredRuns]);
  const fillerData = useMemo(() => computeFillerData(timeFilteredRuns), [timeFilteredRuns]);
  const deltas = useMemo(() => computeStatDeltas(timeFilteredRuns), [timeFilteredRuns]);

  // Summary strip values
  const avgWpm = useMemo(() => {
    const wpmRuns = timeFilteredRuns.filter(r => Number.isFinite(r.analysis.delivery_metrics?.wpm) && r.analysis.delivery_metrics.wpm > 0);
    return wpmRuns.length > 0 ? Math.round(wpmRuns.reduce((s, r) => s + r.analysis.delivery_metrics.wpm, 0) / wpmRuns.length) : 0;
  }, [timeFilteredRuns]);

  const avgDuration = useMemo(() => {
    const durRuns = timeFilteredRuns.filter(r => r.analysis.delivery_metrics?.duration_seconds != null);
    if (durRuns.length === 0) return '0:00';
    const avg = Math.round(durRuns.reduce((s, r) => s + r.analysis.delivery_metrics.duration_seconds, 0) / durRuns.length);
    return `${Math.floor(avg / 60)}:${(avg % 60).toString().padStart(2, '0')}`;
  }, [timeFilteredRuns]);

  const totalFillers = useMemo(() => {
    return timeFilteredRuns.reduce((total, r) =>
      total + (r.analysis.delivery_metrics?.filler_words ?? []).reduce((s, f) => s + (f.count ?? 0), 0),
    0);
  }, [timeFilteredRuns]);

  const latestScore = progress.overallTrend.length > 0
    ? progress.overallTrend[progress.overallTrend.length - 1].score
    : 0;

  // Achievements
  const achievements = useAchievements();
  useEffect(() => {
    if (progressRuns.length > 0) achievements.processRuns(progressRuns);
  }, [progressRuns, achievements.processRuns]);

  // Project filter options
  const filterOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: 'all', label: 'All Projects' }];
    for (const p of projects) {
      if (!p.isArchived) {
        opts.push({ value: p.id, label: p.name });
      }
    }
    return opts;
  }, [projects]);

  if (loading) {
    if (!showSkeleton) return <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-5 pr-1" />;
    return (
      <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-5 pr-1">
        <Skeleton className="h-8 w-40" />
        <SkeletonCard />
        <SkeletonStatRow />
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>
    );
  }

  return (
    <main ref={containerRef} className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-5 pr-1">
      {/* ——— Header ——— */}
      <div
        className="flex items-center justify-between animate-fade-in-up"
        style={{ animationDelay: '0ms', animationFillMode: 'both' }}
      >
        <div className="flex items-center gap-3">
          <TrendingUp size={24} style={{ color: 'var(--text-primary)' }} />
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Insights
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Your pitch training analytics & progression
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allRuns.length > 0 && filterOptions.length > 1 && (
            <ProjectSelect
              value={filterProjectId}
              options={filterOptions}
              onChange={setFilterProjectId}
              ariaLabel="Filter by project"
              compact
              portal
            />
          )}
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      {/* ——— Empty State ——— */}
      {progress.totalSessions === 0 ? (
        <GlassCard animationDelay="60ms">
          <EmptyState
            icon={<TrendingUp size={32} style={{ color: 'var(--text-muted)' }} />}
            message={
              fetchError
                ? 'Failed to load insights data.'
                : projectFilteredRuns.length === 0 && allRuns.length > 0
                  ? 'No sessions for this project yet.'
                  : 'No pitch sessions yet. Complete your first pitch to start tracking insights.'
            }
          />
          {fetchError && (
            <div className="flex justify-center mt-3">
              <button
                onClick={loadRuns}
                className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-surface-hover)',
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </GlassCard>
      ) : (
        <>
          {/* ——— Level Hero ——— */}
          <ProgressHero
            progress={progress}
            latestScore={latestScore}
            animationDelay="60ms"
            streak={progress.currentStreak}
            sessionCount={progress.totalSessions}
          />

          {/* ——— Summary Strip ——— */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Avg WPM"
              value={String(avgWpm)}
              icon={<Activity size={16} />}
              delta={deltas.wpmDelta}
              deltaDirection={deltas.wpmDir}
              deltaIsGood={deltas.wpmIsGood}
              animationDelay="120ms"
            />
            <StatCard
              label="Avg Duration"
              value={avgDuration}
              icon={<Clock size={16} />}
              delta={deltas.durationDelta}
              deltaDirection={deltas.durationDir}
              deltaIsGood={deltas.durationIsGood}
              animationDelay="180ms"
            />
            <StatCard
              label="Filler Words"
              value={String(totalFillers)}
              icon={<MessageSquare size={16} />}
              delta={deltas.fillerDelta}
              deltaDirection={deltas.fillerDir}
              deltaIsGood={deltas.fillerIsGood}
              animationDelay="240ms"
            />
          </div>

          {/* ——— Score Trend ——— */}
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
              <ScoreTrendChart
                key={`score-${range}-${trendData.length}`}
                data={trendData}
              />
            )}
          </GlassCard>

          {/* ——— Rubric Category Trend ——— */}
          <GlassCard animationDelay="360ms">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader>Rubric Category Trend</SectionHeader>
              <Activity size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            {rubricTrend.length === 0 ? (
              <EmptyState message="No sessions to show rubric trends" />
            ) : (
              <RubricTrendChart
                key={`rubric-${range}-${rubricTrend.length}`}
                data={rubricTrend}
              />
            )}
          </GlassCard>

          {/* ——— Skill Progression ——— */}
          <div>
            <div
              className="flex items-center justify-between mb-1 animate-fade-in-up"
              style={{ animationDelay: '420ms', animationFillMode: 'both' }}
            >
              <SectionHeader>Skill Progression</SectionHeader>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Tap any skill for details
              </span>
            </div>
            <SkillLadder
              categories={progress.categories}
              animationDelay="440ms"
            />
          </div>

          {/* ——— Delivery Metrics ——— */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard animationDelay="500ms">
              <div className="flex items-center justify-between mb-5">
                <SectionHeader>Speaking Pace</SectionHeader>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Ideal: 130–160 WPM
                </span>
              </div>
              {wpmTrend.length === 0 ? (
                <EmptyState message="No WPM data available" />
              ) : (
                <WpmTrendChart
                  key={`wpm-${range}-${wpmTrend.length}`}
                  data={wpmTrend}
                />
              )}
            </GlassCard>

            <GlassCard animationDelay="560ms">
              <div className="flex items-center justify-between mb-5">
                <SectionHeader>Filler Words</SectionHeader>
                <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              {timeFilteredRuns.length === 0 ? (
                <EmptyState message="No filler word data available" />
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <FillerTrendChart
                    key={`filler-trend-${range}-${fillerData.trend.length}`}
                    data={fillerData.trend}
                  />
                  <FillerAggregateTable
                    key={`filler-table-${range}-${fillerData.aggregate.length}`}
                    data={fillerData.aggregate}
                  />
                </div>
              )}
            </GlassCard>
          </div>

          {/* ——— Fix Tracker ——— */}
          <GlassCard animationDelay="620ms">
            <FixTracker fixes={progress.fixes} />
            <p
              className="text-[10px] mt-3 italic"
              style={{ color: 'var(--text-muted)' }}
            >
              Fix status is inferred: issues not seen in the last 2 sessions are marked resolved.
            </p>
          </GlassCard>

          {/* ——— Achievements ——— */}
          <GlassCard animationDelay="680ms">
            <AchievementSummary
              state={achievements.state}
              progress={achievements.progress}
            />
          </GlassCard>

          {/* Bottom spacer */}
          <div className="h-2 flex-shrink-0" />
        </>
      )}
    </main>
  );
}
