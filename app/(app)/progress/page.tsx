'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { useTutorial } from '@/hooks/useTutorial';
import { useSmartTooltip } from '@/hooks/useSmartTooltip';
import {
  TrendingUp,
  Flame,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
} from 'lucide-react';
import {
  GlassCard,
  StatCard,
  SectionHeader,
  EmptyState,
  Skeleton,
  SkeletonStatRow,
  SkeletonCard,
  useDelayedLoading,
} from '@/views/components/ui';
import {
  ProgressKanban,
  CategoryProgressCard,
  FixTracker,
  ScoreTimeline,
} from '@/views/components/progress';
import { AchievementSummary } from '@/views/components/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { computeProgress } from '@/lib/progress';
import type { ProgressRunRecord, ProgressSummary } from '@/lib/progress';
import { getScoreBandLabel } from '@/views/components/ui/colors';

/* ——— Types ——— */

interface RawRunRecord {
  id: string;
  mode: string;
  overallScore: number;
  createdAt: string;
  analysis: {
    one_line_verdict: string;
    rubric_breakdown: { category: string; score: number; max_score: number }[];
    delivery_metrics: {
      duration_seconds: number;
      wpm: number;
      filler_rate: number;
    };
    top_fixes?: {
      rank: number;
      category: string;
      issue: string;
      fix: string;
      impact: string;
    }[];
  };
}

/* ——— Helpers ——— */

function normalizeRunToProgress(raw: RawRunRecord): ProgressRunRecord {
  return {
    id: raw.id,
    createdAt: raw.createdAt,
    overallScore: raw.overallScore,
    mode: raw.mode,
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

/* ——— Page Component ——— */

export default function ProgressPage() {
  const [runs, setRuns] = useState<ProgressRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const { showTooltip } = useSmartTooltip();
  const { registerPage } = useTutorial('progress');
  const statsContainerRef = useRef<HTMLDivElement | null>(null);

  const loadRuns = useCallback(() => {
    setFetchError(false);
    setLoading(true);
    fetchEdge('pitch-run')
      .then((r) => r.json())
      .then((payload: { runs?: RawRunRecord[] }) => {
        const data = Array.isArray(payload.runs) ? payload.runs : [];
        setRuns(data.map(normalizeRunToProgress));
      })
      .catch(() => {
        setRuns([]);
        setFetchError(true);
        if (statsContainerRef.current) {
          showTooltip(statsContainerRef.current, 'error', 'Failed to load progress data. Check your connection and try again.');
        }
      })
      .finally(() => setLoading(false));
  }, [showTooltip]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    registerPage('progress');
  }, [registerPage]);

  const progress: ProgressSummary = useMemo(
    () => computeProgress(runs),
    [runs],
  );

  const achievements = useAchievements();

  useEffect(() => {
    if (runs.length > 0) achievements.processRuns(runs);
  }, [runs, achievements.processRuns]);

  const showSkeleton = useDelayedLoading(loading);

  const latestScore =
    progress.overallTrend.length > 0
      ? progress.overallTrend[progress.overallTrend.length - 1].score
      : 0;

  if (loading) {
    if (!showSkeleton) return <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-5 pr-1" />;
    return (
      <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-5 pr-1">
        <Skeleton className="h-8 w-40" />
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
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-5 pr-1">
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
              Progress
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Track your pitch improvement journey
            </p>
          </div>
        </div>
      </div>

      {progress.totalSessions === 0 ? (
        <GlassCard animationDelay="60ms">
          <EmptyState
            icon={<TrendingUp size={32} style={{ color: 'var(--text-muted)' }} />}
            message={fetchError ? 'Failed to load progress data.' : 'No pitch sessions yet. Complete your first pitch to start tracking progress.'}
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
          {/* ——— Stat Cards ——— */}
          <div ref={statsContainerRef} data-tour="tour-progress-stats" className="grid grid-cols-4 gap-4">
            <StatCard
              label="Current Score"
              value={`${latestScore}/100`}
              icon={<Target size={16} />}
              animationDelay="60ms"
            />
            <StatCard
              label="Overall Change"
              value={`${progress.overallDelta > 0 ? '+' : ''}${progress.overallDelta} pts`}
              icon={
                progress.overallDelta > 0 ? (
                  <ArrowUp size={16} />
                ) : progress.overallDelta < 0 ? (
                  <ArrowDown size={16} />
                ) : (
                  <Minus size={16} />
                )
              }
              animationDelay="120ms"
            />
            <StatCard
              label="Current Streak"
              value={`${progress.currentStreak} run${progress.currentStreak !== 1 ? 's' : ''}`}
              icon={<Flame size={16} />}
              animationDelay="180ms"
            />
            <StatCard
              label="Sessions"
              value={String(progress.totalSessions)}
              icon={<BarChart3 size={16} />}
              animationDelay="240ms"
            />
          </div>

          {/* ——— Score Band Summary ——— */}
          <GlassCard animationDelay="280ms">
            <div className="flex items-center justify-between mb-2">
              <SectionHeader>Current Level</SectionHeader>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor:
                    latestScore >= 80
                      ? 'rgba(34,197,94,0.12)'
                      : latestScore >= 60
                        ? 'rgba(59,130,246,0.12)'
                        : latestScore >= 40
                          ? 'rgba(234,179,8,0.12)'
                          : 'rgba(239,68,68,0.12)',
                  color:
                    latestScore >= 80
                      ? '#22c55e'
                      : latestScore >= 60
                        ? '#3b82f6'
                        : latestScore >= 40
                          ? '#eab308'
                          : '#ef4444',
                }}
              >
                {getScoreBandLabel(latestScore)}
              </span>
            </div>
            <p
              className="text-xs mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {latestScore >= 80
                ? 'Your pitch is investor-ready. Focus on maintaining consistency.'
                : latestScore >= 60
                  ? 'Solid foundation. Address your weakest categories to reach investor-ready.'
                  : latestScore >= 40
                    ? 'Making progress. The Kanban board below shows what to focus on next.'
                    : 'Early stages. Keep practicing and watch your skills move across the board.'}
            </p>
          </GlassCard>

          {/* ——— Skill Kanban Board ——— */}
          <div data-tour="tour-progress-kanban">
          <GlassCard animationDelay="320ms">
            <SectionHeader className="mb-4">Skill Board</SectionHeader>
            <p
              className="text-xs mb-4 -mt-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Each rubric skill moves through bands as you improve. Track your
              strengths and weak areas at a glance.
            </p>
            <ProgressKanban categories={progress.categories} />
          </GlassCard>
          </div>

          {/* ——— Score Timeline ——— */}
          <div data-tour="tour-progress-timeline">
          <GlassCard animationDelay="380ms">
            <SectionHeader className="mb-4">Score Timeline</SectionHeader>
            <ScoreTimeline data={progress.overallTrend} />
          </GlassCard>
          </div>

          {/* ——— Category Deep-Dive ——— */}
          <div data-tour="tour-progress-categories">
            <SectionHeader className="mb-3">
              <span
                className="animate-fade-in-up"
                style={{ animationDelay: '420ms', animationFillMode: 'both' }}
              >
                Category Breakdown
              </span>
            </SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {progress.categories.map((cat, i) => (
                <CategoryProgressCard
                  key={cat.id}
                  category={cat}
                  animationDelay={`${440 + i * 60}ms`}
                />
              ))}
            </div>
          </div>

          {/* ——— Fix Tracker ——— */}
          <GlassCard animationDelay="720ms">
            <FixTracker fixes={progress.fixes} />
            <p
              className="text-[10px] mt-3 italic"
              style={{ color: 'var(--text-muted)' }}
            >
              Fix status is inferred: issues not seen in the last 2 sessions are marked resolved.
            </p>
          </GlassCard>

          {/* ——— Achievements ——— */}
          <GlassCard animationDelay="780ms">
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
