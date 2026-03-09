'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { useTutorial } from '@/hooks/useTutorial';
import { useSmartTooltip } from '@/hooks/useSmartTooltip';
import {
  TrendingUp,
  Radio,
} from 'lucide-react';
import {
  GlassCard,
  SectionHeader,
  EmptyState,
  Skeleton,
  SkeletonStatRow,
  SkeletonCard,
  useDelayedLoading,
} from '@/views/components/ui';
import {
  ProgressHero,
  SkillLadder,
  MomentumPanel,
  CategoryProgressCard,
  FixTracker,
  ScoreTimeline,
} from '@/views/components/progress';
import { AchievementSummary } from '@/views/components/achievements';
import { useAchievements } from '@/hooks/useAchievements';
import { useProject } from '@/views/components/ProjectProvider';
import { ProjectSelect } from '@/views/components/ProjectSelect';
import { computeProgress } from '@/lib/progress';
import type { ProgressRunRecord, ProgressSummary } from '@/lib/progress';

/* ——— Types ——— */

interface RawRunRecord {
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

/* ——— Page Component ——— */

export default function ProgressPage() {
  const [runs, setRuns] = useState<ProgressRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState('all');
  const { showTooltip } = useSmartTooltip();
  const { registerPage } = useTutorial('progress');
  const { projects } = useProject();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const showTooltipRef = useRef(showTooltip);
  showTooltipRef.current = showTooltip;

  const loadRuns = useCallback(() => {
    setFetchError(false);
    setLoading(true);
    fetchEdge('pitch-run', { params: { allProjects: 'true', summary: 'true' } })
      .then((r) => r.json())
      .then((payload: { runs?: RawRunRecord[] }) => {
        const data = Array.isArray(payload.runs) ? payload.runs : [];
        setRuns(data.map(normalizeRunToProgress));
      })
      .catch(() => {
        setRuns([]);
        setFetchError(true);
        if (containerRef.current) {
          showTooltipRef.current(containerRef.current, 'error', 'Failed to load progress data. Check your connection and try again.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    registerPage('progress');
  }, [registerPage]);

  const filterOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: 'all', label: 'All Projects' }];
    for (const p of projects) {
      if (!p.isArchived) {
        opts.push({ value: p.id, label: p.name });
      }
    }
    return opts;
  }, [projects]);

  const filteredRuns = useMemo(
    () => filterProjectId === 'all' ? runs : runs.filter((r) => r.projectId === filterProjectId),
    [runs, filterProjectId],
  );

  const progress: ProgressSummary = useMemo(
    () => computeProgress(filteredRuns),
    [filteredRuns],
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
              Progress
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Your pitch training progression
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {runs.length > 0 && filterOptions.length > 1 && (
            <ProjectSelect
              value={filterProjectId}
              options={filterOptions}
              onChange={setFilterProjectId}
              ariaLabel="Filter by project"
              compact
              portal
            />
          )}
          {progress.totalSessions > 0 && (
            <a
              href="/session"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                backgroundColor: '#ff5941',
                color: '#ffffff',
                boxShadow: '0 0 12px rgba(255,89,65,0.3)',
              }}
            >
              <Radio size={13} />
              Practice
            </a>
          )}
        </div>
      </div>

      {progress.totalSessions === 0 ? (
        <GlassCard animationDelay="60ms">
          <EmptyState
            icon={<TrendingUp size={32} style={{ color: 'var(--text-muted)' }} />}
            message={
              fetchError
                ? 'Failed to load progress data.'
                : filteredRuns.length === 0 && runs.length > 0
                  ? 'No sessions for this project yet.'
                  : 'No pitch sessions yet. Complete your first pitch to start tracking progress.'
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
          <div data-tour="tour-progress-level">
            <ProgressHero
              progress={progress}
              latestScore={latestScore}
              animationDelay="60ms"
            />
          </div>

          {/* ——— Momentum Panel ——— */}
          <MomentumPanel
            progress={progress}
            animationDelay="140ms"
          />

          {/* ——— Skill Progression Ladder ——— */}
          <div data-tour="tour-progress-skills">
            <div
              className="flex items-center justify-between mb-1 animate-fade-in-up"
              style={{ animationDelay: '200ms', animationFillMode: 'both' }}
            >
              <SectionHeader>Skill Progression</SectionHeader>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Tap any skill for details
              </span>
            </div>
            <SkillLadder
              categories={progress.categories}
              animationDelay="220ms"
            />
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
                style={{ animationDelay: '440ms', animationFillMode: 'both' }}
              >
                Category Breakdown
              </span>
            </SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {progress.categories.map((cat, i) => (
                <CategoryProgressCard
                  key={cat.id}
                  category={cat}
                  animationDelay={`${460 + i * 60}ms`}
                />
              ))}
            </div>
          </div>

          {/* ——— Fix Tracker ——— */}
          <GlassCard animationDelay="760ms">
            <FixTracker fixes={progress.fixes} />
            <p
              className="text-[10px] mt-3 italic"
              style={{ color: 'var(--text-muted)' }}
            >
              Fix status is inferred: issues not seen in the last 2 sessions are marked resolved.
            </p>
          </GlassCard>

          {/* ——— Achievements ——— */}
          <GlassCard animationDelay="820ms">
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
