'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  TrendingUp,
  Trophy,
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
  StatCard,
  ScoreBadge,
  TagPill,
  SectionHeader,
  CategoryBar,
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
  getRubricColor,
} from '@/views/components/ui';
import type { PitchMode } from '@/views/components/ui/colors';
import {
  computeRubricAverages,
  computeInsights,
  computeRecommendations,
} from '@/lib/analytics';
import type { RunEconomics } from '@/types/analysis-v2';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { useProject } from '@/views/components/ProjectProvider';

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

function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount < 1 ? 4 : 2,
    maximumFractionDigits: amount < 1 ? 6 : 2,
  });
}

/* ——— Page Component ——— */

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [allRuns, setAllRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { state: onboardingState } = useOnboarding();
  const { activeProjectId } = useProject();
  const [fetchError, setFetchError] = useState(false);
  const { showTooltip } = useSmartTooltip();
  const { registerPage } = useTutorial('dashboard');
  const statsRef = useRef<HTMLDivElement | null>(null);

  const showSkeleton = useDelayedLoading(loading);

  const loadRuns = useCallback(() => {
    setFetchError(false);
    if (!activeProjectId) {
      setAllRuns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchEdge('pitch-run', { params: { projectId: activeProjectId } })
      .then((r) => r.json())
      .then((payload: { runs?: RunRecord[] }) =>
        setAllRuns(Array.isArray(payload.runs) ? payload.runs : []),
      )
      .catch(() => {
        setAllRuns([]);
        setFetchError(true);
        if (statsRef.current) {
          showTooltip(statsRef.current, 'error', 'Failed to load your pitch runs. Check your connection and try again.');
        }
      })
      .finally(() => setLoading(false));
  }, [activeProjectId, showTooltip]);

  useEffect(() => {
    setGreeting(getGreeting());
    setFormattedDate(getFormattedDate());
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    registerPage('dashboard');
  }, [registerPage]);

  const totalRuns = allRuns.length;
  const averageScore = totalRuns > 0
    ? Math.round(allRuns.reduce((s, r) => s + r.overallScore, 0) / totalRuns)
    : 0;
  const bestScore = totalRuns > 0
    ? Math.max(...allRuns.map((r) => r.overallScore))
    : 0;
  const totalMoneySavedUsd = Math.round(
    allRuns.reduce((sum, run) => sum + (run.meta?.economics?.money_saved_vs_coach_usd ?? 0), 0) * 100,
  ) / 100;
  const totalAiSpendUsd = Math.round(
    allRuns.reduce((sum, run) => sum + (run.meta?.economics?.estimated_cost_usd ?? 0), 0) * 1_000_000,
  ) / 1_000_000;
  const netSavingsUsd = Math.round((totalMoneySavedUsd - totalAiSpendUsd) * 100) / 100;

  const rubricCategories = useMemo(() => computeRubricAverages(allRuns), [allRuns]);
  const insights = useMemo(() => computeInsights(rubricCategories), [rubricCategories]);
  const recommendations = useMemo(() => computeRecommendations(rubricCategories), [rubricCategories]);
  const recentRuns = allRuns.slice(0, 3);

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
          <Link href="/session" className="no-underline">
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

        {/* ——— Stat Cards Row ——— */}
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
              icon={<Mic size={32} style={{ color: 'var(--text-muted)' }} />}
              message={fetchError ? 'Failed to load pitch runs.' : 'No pitch runs yet. Run your first pitch to see your breakdown here.'}
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
        <div ref={statsRef} data-tour="tour-dashboard-stats" className="grid grid-cols-3 gap-4">
          <StatCard
            label="Total Runs"
            value={String(totalRuns)}
            icon={<Target size={16} />}
            animationDelay="0.08s"
          />
          <StatCard
            label="Average Score"
            value={`${averageScore}/100`}
            icon={<TrendingUp size={16} />}
            animationDelay="0.14s"
          />
          <StatCard
            label="Best Score"
            value={`${bestScore}/100`}
            icon={<Trophy size={16} />}
            animationDelay="0.20s"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Total Money Saved"
            value={formatUsd(totalMoneySavedUsd)}
            icon={<Zap size={16} />}
            animationDelay="0.24s"

          />
          <StatCard
            label="Total AI Spend"
            value={formatUsd(totalAiSpendUsd)}
            icon={<Timer size={16} />}
            animationDelay="0.28s"

          />
          <StatCard
            label="Net Savings (Est.)"
            value={formatUsd(netSavingsUsd)}
            icon={<TrendingUp size={16} />}
            animationDelay="0.32s"

          />
        </div>

            {/* ——— Rubric Breakdown ——— */}
            <div data-tour="tour-dashboard-rubric">
            <GlassCard animationDelay="0.26s">
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
            </div>

            {/* ——— Top Insights + Practice Recommendations ——— */}
            <div className="grid grid-cols-2 gap-4">
              <GlassCard animationDelay="0.32s">
                <SectionHeader className="mb-4">Top Insights</SectionHeader>
                <div className="flex flex-col gap-3">
                  {insights.map((insight, i) => (
                    <InsightCard key={i} {...insight} delay={i} />
                  ))}
                </div>
              </GlassCard>

              <div data-tour="tour-dashboard-recommendations">
              <GlassCard animationDelay="0.38s">
                <SectionHeader className="mb-4">Practice Recommendations</SectionHeader>
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
                      className="group rounded-xl border p-4 transition-all duration-200 cursor-pointer animate-fade-in-up"
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
