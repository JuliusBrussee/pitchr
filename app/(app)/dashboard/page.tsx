'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Calendar,
  Timer,
  ArrowRight,
  Mic,
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTutorial } from '@/hooks/useTutorial';
import { useSmartTooltip } from '@/hooks/useSmartTooltip';
import {
  GlassCard,
  ScoreBadge,
  TagPill,
  SectionHeader,
  InsightCard,
  RecommendationCard,
  EmptyState,
  Skeleton,
  SkeletonStatRow,
  SkeletonCard,
  SkeletonListRow,
  useDelayedLoading,
  getModeColor,
  getModeBgColor,
  getModeLabel,
} from '@/views/components/ui';
import { MicWaveIllustration } from '@/views/components/ui/empty-state-illustrations';
import type { PitchMode } from '@/views/components/ui/colors';
import {
  computeRubricAverages,
  computeInsights,
  computeRecommendations,
  computeCoachSummary,
  computeScoreTrend,
  computeStreak,
} from '@/lib/analytics';
import type { RunEconomics } from '@/types/analysis-v2';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { useProject } from '@/views/components/ProjectProvider';
import { ScoreRing } from '@/views/components/dashboard/ScoreRing';
import { CoachSummary } from '@/views/components/dashboard/CoachSummary';
import { Sparkline } from '@/views/components/dashboard/Sparkline';
import { RadarChart } from '@/views/components/dashboard/RadarChart';
import { StreakBadge } from '@/views/components/dashboard/StreakBadge';
import { EarlyAdopterBanner } from '@/views/components/billing/EarlyAdopterBanner';

/* ——— Types ——— */

interface RunRecord {
  id: string;
  mode: string;
  overallScore: number;
  createdAt: string;
  meta?: {
    economics?: RunEconomics;
  };
  analysis: {
    one_line_verdict: string;
    rubric_breakdown: { category: string; score: number; max_score: number }[];
    delivery_metrics: { duration_seconds: number };
  };
}

/* ——— Helpers ——— */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatRunDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ——— Page Component ——— */

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [allRuns, setAllRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { state: onboardingState, loaded: onboardingLoaded } = useOnboarding();
  const { activeProjectId } = useProject();
  const [fetchError, setFetchError] = useState(false);
  const { showTooltip } = useSmartTooltip();
  const { registerPage } = useTutorial('dashboard');
  const statsRef = useRef<HTMLDivElement | null>(null);
  const showTooltipRef = useRef(showTooltip);
  showTooltipRef.current = showTooltip;

  const showSkeleton = useDelayedLoading(loading);

  const loadRuns = useCallback(() => {
    setFetchError(false);
    if (!activeProjectId) {
      setAllRuns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchEdge('pitch-run', { params: { projectId: activeProjectId, summary: 'true' } })
      .then((r) => r.json())
      .then((payload: { runs?: RunRecord[] }) =>
        setAllRuns(Array.isArray(payload.runs) ? payload.runs : []),
      )
      .catch(() => {
        setAllRuns([]);
        setFetchError(true);
        if (statsRef.current) {
          showTooltipRef.current(statsRef.current, 'error', 'Failed to load your pitch runs. Check your connection and try again.');
        }
      })
      .finally(() => setLoading(false));
  }, [activeProjectId]);

  useEffect(() => {
    setGreeting(getGreeting());
    setFormattedDate(getFormattedDate());
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    registerPage('dashboard');
  }, [registerPage]);

  // Redirect to onboarding if not completed (catches Google OAuth users who skip /setup)
  useEffect(() => {
    if (onboardingLoaded && !onboardingState.isComplete) {
      router.replace('/setup');
    }
  }, [onboardingLoaded, onboardingState.isComplete, router]);

  /* ——— Computed Metrics ——— */
  const totalRuns = allRuns.length;
  const averageScore = totalRuns > 0
    ? Math.round(allRuns.reduce((s, r) => s + r.overallScore, 0) / totalRuns)
    : 0;
  const bestScore = totalRuns > 0
    ? Math.max(...allRuns.map((r) => r.overallScore))
    : 0;

  const rubricCategories = useMemo(() => computeRubricAverages(allRuns), [allRuns]);
  const insights = useMemo(() => computeInsights(rubricCategories), [rubricCategories]);
  const recommendations = useMemo(() => computeRecommendations(rubricCategories), [rubricCategories]);
  const coachSummary = useMemo(
    () => computeCoachSummary(rubricCategories, averageScore, totalRuns),
    [rubricCategories, averageScore, totalRuns],
  );
  const scoreTrend = useMemo(() => computeScoreTrend(allRuns), [allRuns]);
  const streak = useMemo(() => computeStreak(allRuns), [allRuns]);
  const recentRuns = allRuns.slice(0, 3);

  // Delta from last two runs
  const sortedByDate = useMemo(
    () => [...allRuns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allRuns],
  );
  const scoreDelta = sortedByDate.length >= 2
    ? sortedByDate[0].overallScore - sortedByDate[1].overallScore
    : 0;

  return (
    <main
      className="flex-1 overflow-y-auto rounded-2xl border p-8"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* ——— Early Adopter Banner ——— */}
        <EarlyAdopterBanner />

        {/* ——— Header: Greeting + CTA ——— */}
        <div
          className="flex items-center justify-between animate-fade-in-up"
          style={{ animationDelay: '0s', animationFillMode: 'both' }}
        >
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {greeting}{onboardingState.displayName ? `, ${onboardingState.displayName}` : ', Founder'}
            </h1>
            <p
              className="text-sm flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <Calendar size={14} />
              {formattedDate}
            </p>
          </div>
          <Link href="/session" className="no-underline dash-start-session">
            <div className="session-start-wrap" style={{ borderRadius: 12, padding: 2 }}>
              <div className="session-start-glow" />
              <button
                className="session-start-btn border-0 px-6 cursor-pointer
                           flex items-center gap-2
                           font-semibold text-sm"
                style={{ borderRadius: 10, padding: '10px 20px' }}
              >
                <Zap size={16} />
                Start Session
              </button>
            </div>
          </Link>
        </div>

        {/* ——— Loading / Empty / Data States ——— */}
        {loading ? (
          showSkeleton ? (
            <>
              <SkeletonStatRow />
              <SkeletonStatRow />
              <div className="grid grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-28 mb-2" />
                <SkeletonListRow />
                <SkeletonListRow />
                <SkeletonListRow />
              </div>
            </>
          ) : null
        ) : totalRuns === 0 ? (
          <GlassCard animationDelay="0.26s">
            <EmptyState
              illustration={fetchError ? undefined : <MicWaveIllustration />}
              icon={fetchError ? <Mic size={32} style={{ color: 'var(--text-muted)' }} /> : undefined}
              title={fetchError ? 'Failed to load pitch runs' : 'Your pitch journey starts here'}
              description={fetchError ? 'Check your connection and try again.' : 'Run your first pitch session to see your score, insights, and coaching.'}
              cta={fetchError ? undefined : { label: 'Start First Session', href: '/session', icon: <Zap size={15} /> }}
              secondaryAction={fetchError ? { label: 'Try Again', onClick: loadRuns } : undefined}
              variant={fetchError ? 'error' : 'default'}
              showGlow={!fetchError}
            />
          </GlassCard>
        ) : (
          <>
            {/* ——— AI Coach Summary ——— */}
            <CoachSummary summary={coachSummary} hasRuns={totalRuns > 0} />

            {/* ——— Hero: Score Ring + Trend + Streak ——— */}
            <div
              ref={statsRef}
              data-tour="tour-dashboard-stats"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Score Ring Hero */}
              <div
                className="rounded-2xl border p-6 flex flex-col items-center justify-center animate-fade-in-up dash-hover-depth"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  backdropFilter: 'blur(var(--blur-strength))',
                  WebkitBackdropFilter: 'blur(var(--blur-strength))',
                  borderColor: 'var(--border-color)',
                  animationDelay: '0.08s',
                  animationFillMode: 'both',
                }}
              >
                <ScoreRing
                  score={averageScore}
                  delta={scoreDelta}
                  totalRuns={totalRuns}
                />
                <div className="mt-4">
                  <StreakBadge
                    streak={streak}
                    totalRuns={totalRuns}
                    bestScore={bestScore}
                  />
                </div>
              </div>

              {/* Right column: Sparkline + Quick Stats */}
              <div className="flex flex-col gap-4">
                <Sparkline trend={scoreTrend} />

                {/* Mini stat pills */}
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className="rounded-xl border p-3 text-center animate-fade-in-up dash-hover-depth"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      animationDelay: '0.24s',
                      animationFillMode: 'both',
                    }}
                  >
                    <span
                      className="text-xs font-semibold uppercase tracking-wider block mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Best
                    </span>
                    <span
                      className="text-xl font-bold tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {bestScore}
                    </span>
                  </div>
                  <div
                    className="rounded-xl border p-3 text-center animate-fade-in-up dash-hover-depth"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      animationDelay: '0.28s',
                      animationFillMode: 'both',
                    }}
                  >
                    <span
                      className="text-xs font-semibold uppercase tracking-wider block mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Average
                    </span>
                    <span
                      className="text-xl font-bold tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {averageScore}
                    </span>
                  </div>
                  <div
                    className="rounded-xl border p-3 text-center animate-fade-in-up dash-hover-depth"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      animationDelay: '0.32s',
                      animationFillMode: 'both',
                    }}
                  >
                    <span
                      className="text-xs font-semibold uppercase tracking-wider block mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Sessions
                    </span>
                    <span
                      className="text-xl font-bold tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {totalRuns}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ——— Radar Chart Rubric ——— */}
            <div data-tour="tour-dashboard-rubric">
              <RadarChart categories={rubricCategories} />
            </div>

            {/* ——— Top Insights + Practice Recommendations ——— */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard animationDelay="0.32s" className="dash-hover-depth">
                <SectionHeader className="mb-4">Top Insights</SectionHeader>
                <div className="flex flex-col gap-3">
                  {insights.map((insight, i) => (
                    <InsightCard key={i} {...insight} delay={i} />
                  ))}
                </div>
              </GlassCard>

              <div data-tour="tour-dashboard-recommendations">
                <GlassCard animationDelay="0.38s" className="dash-hover-depth">
                  <SectionHeader className="mb-4">Recommended Focus</SectionHeader>
                  <div className="flex flex-col gap-3">
                    {recommendations.map((rec, i) => (
                      <RecommendationCard key={i} {...rec} delay={i} />
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* ——— Recent Runs ——— */}
            <div
              data-tour="tour-dashboard-recent"
              className="animate-fade-in-up"
              style={{ animationDelay: '0.44s', animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between mb-4">
                <SectionHeader>Recent Runs</SectionHeader>
                <Link
                  href="/history"
                  className="text-xs font-medium no-underline flex items-center gap-1 transition-opacity hover:opacity-80"
                  style={{ color: 'var(--text-muted)' }}
                >
                  View All
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {recentRuns.map((run, i) => (
                  <Link
                    key={run.id}
                    href={`/results/${run.id}`}
                    className="no-underline block"
                  >
                    <div
                      className="group rounded-xl border p-4 transition-all duration-200 cursor-pointer animate-fade-in-up dash-hover-depth"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-color)',
                        animationDelay: `${0.48 + i * 0.06}s`,
                        animationFillMode: 'both',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                        e.currentTarget.style.borderColor = 'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <TagPill
                              label={getModeLabel(run.mode as PitchMode)}
                              color={getModeColor(run.mode as PitchMode)}
                              bgColor={getModeBgColor(run.mode as PitchMode)}
                            />
                            <span
                              className="flex items-center gap-1 text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Calendar size={11} />
                              {formatRunDate(run.createdAt)}
                            </span>
                            <span
                              className="flex items-center gap-1 text-xs"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <Timer size={11} />
                              {formatDuration(run.analysis.delivery_metrics?.duration_seconds ?? 0)}
                            </span>
                          </div>
                          <p
                            className="text-sm truncate leading-snug"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {run.analysis?.one_line_verdict ?? 'Pitch analysis'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <ScoreBadge score={run.overallScore} />
                          <ArrowRight
                            size={14}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
