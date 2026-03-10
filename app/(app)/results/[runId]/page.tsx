'use client';

import { ArrowLeft, Check, Copy, MessageCircleQuestion } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementToastContainer } from '@/views/components/achievements';
import type { ProgressRunRecord } from '@/lib/progress';
import type { FeedbackOutput, OneMinuteQAPack, RewriteDiff, RunEconomics } from '@/types/analysis-v2';
import type { Run } from '@/types/pitch';
import {
  InvestorDrill,
  ReasoningPanel,
  RewriteDiffPanel,
  ScoreHero,
  SectionAccordion,
  ShareScoreCard,
  TopFixes,
  VocabDiagnostics,
} from '@/views/components/results';
import {
  RecordingPlayer,
  type RecordingPlayerHandle,
} from '@/views/components/RecordingPlayer';
import { buildRewriteDiff } from '@/services/rewriteDiffService';
import { resolveSectionFeedbackForDisplay } from '@/services/sectionFeedbackService';
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { useTutorial } from '@/hooks/useTutorial';

/* ── Helpers ─────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  });
}

function formatMinutes(value: number): string {
  return `${value.toFixed(1)} min`;
}

function synthesizeQaFromFeedback(feedback: FeedbackOutput): OneMinuteQAPack {
  const weakest = [...feedback.rubric_breakdown]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => item.category);
  const questions = weakest.map(
    (category) => `How are you de-risking your ${category.replace(/_/g, ' ')} concerns?`,
  );
  const q1 = questions[0] ?? 'What is your strongest proof point right now?';
  const q2 = questions[1] ?? 'Why does this market timing work now?';
  const q3 = questions[2] ?? 'What milestones does this raise unlock?';
  return {
    total_target_seconds: 60,
    timing_plan_seconds: [20, 20, 20],
    investor_questions: [q1, q2, q3],
    suggested_answers: [
      {
        question: q1,
        answer:
          feedback.top_fixes[0]?.fix ?? 'Anchor claims with evidence and milestone clarity.',
        target_seconds: 20,
      },
      {
        question: q2,
        answer:
          feedback.top_fixes[1]?.fix ?? 'Clarify differentiation and execution plan.',
        target_seconds: 20,
      },
      {
        question: q3,
        answer:
          feedback.top_fixes[2]?.fix ?? 'Close with a direct ask and use-of-funds milestones.',
        target_seconds: 20,
      },
    ],
    focus_tags: weakest,
    red_flags_to_avoid: [
      'Do not answer with vague TAM statements.',
      'Do not claim traction without concrete numbers.',
      'Do not avoid direct raise and milestone details.',
    ],
  };
}

function getRunPollMs(): { initial: number; max: number; step: number } {
  const initialRaw = process.env.NEXT_PUBLIC_RUN_POLL_INITIAL_MS;
  const maxRaw = process.env.NEXT_PUBLIC_RUN_POLL_MAX_MS;
  const stepRaw = process.env.NEXT_PUBLIC_RUN_POLL_STEP_MS;

  const initial = Number.parseInt(initialRaw ?? '', 10);
  const max = Number.parseInt(maxRaw ?? '', 10);
  const step = Number.parseInt(stepRaw ?? '', 10);

  return {
    initial: Number.isFinite(initial) && initial >= 1_000 ? initial : 2_000,
    max: Number.isFinite(max) && max >= 2_000 ? max : 8_000,
    step: Number.isFinite(step) && step >= 250 ? step : 500,
  };
}

/* ── Section wrapper ─────────────────────────────────────────── */

function Section({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-5 results-card-enter"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        '--card-delay': '0ms',
      } as React.CSSProperties}
    >
      {title ? (
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            {title}
          </h3>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/* ── Value Proof (compact) ───────────────────────────────────── */

function ValueProof({ economics }: { economics: RunEconomics }) {
  return (
    <Section title="Value Proof">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Est. Cost', value: formatCurrency(economics.estimated_cost_usd) },
          { label: 'Saved vs Coach', value: formatCurrency(economics.money_saved_vs_coach_usd) },
          { label: 'Net Savings', value: formatCurrency(economics.gross_margin_usd) },
          { label: 'Time Saved', value: formatMinutes(economics.time_saved_minutes) },
        ].map((stat) => (
          <div key={stat.label}>
            <p
              className="text-[10px] uppercase tracking-wider mb-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {stat.label}
            </p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
        Based on coach rate of {formatCurrency(economics.coach_hourly_rate_usd)}/hr
      </p>
    </Section>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function ResultsPage() {
  const params = useParams<{ runId: string | string[] }>();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [runError, setRunError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [seekToSec, setSeekToSec] = useState<number | null>(null);
  const recordingRef = useRef<RecordingPlayerHandle | null>(null);
  const [sessionDelta, setSessionDelta] = useState<{ points: number; sessions: number } | null>(null);
  const achievements = useAchievements();
  const achievementCheckDone = useRef(false);
  const { registerPage } = useTutorial('results');

  useEffect(() => {
    registerPage('results');
  }, [registerPage]);

  // When the run completes, fetch all runs and check achievements
  useEffect(() => {
    if (!run || run.status !== 'complete' || achievementCheckDone.current) return;
    achievementCheckDone.current = true;

    fetchEdge('pitch-run', { params: { allProjects: 'true' } })
      .then((r) => r.json())
      .then((payload: { runs?: Array<{ id: string; mode: string; overallScore: number; createdAt: string; analysis: ProgressRunRecord['analysis'] }> }) => {
        const data = Array.isArray(payload.runs) ? payload.runs : [];
        const normalized: ProgressRunRecord[] = data.map((raw) => ({
          id: raw.id,
          createdAt: raw.createdAt,
          overallScore: raw.overallScore,
          mode: raw.mode,
          analysis: {
            one_line_verdict: raw.analysis?.one_line_verdict ?? '',
            rubric_breakdown: raw.analysis?.rubric_breakdown ?? [],
            delivery_metrics: {
              duration_seconds: raw.analysis?.delivery_metrics?.duration_seconds ?? 0,
              wpm: raw.analysis?.delivery_metrics?.wpm ?? 0,
              filler_rate: raw.analysis?.delivery_metrics?.filler_rate ?? 0,
            },
            top_fixes: raw.analysis?.top_fixes ?? [],
          },
        }));
        achievements.processRuns(normalized);

        // Compute session delta for share card from the same data
        if (data.length >= 2) {
          const sorted = [...data].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          const firstScore = sorted[0].overallScore;
          const currentScore = run.outputs?.feedback?.overall_score ?? run.analysis?.overall_score ?? 0;
          const delta = currentScore - firstScore;
          if (delta !== 0) {
            setSessionDelta({ points: delta, sessions: data.length });
          }
        }
      })
      .catch(() => {});
  }, [run?.status, achievements.processRuns]);

  /* ── Data fetching + polling ─────────────────────────────── */

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      setRun(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const polling = getRunPollMs();
    let nextDelayMs = polling.initial;
    let isFetching = false;
    const pollStartedAt = Date.now();
    /** Stop polling after 90 seconds to avoid infinite wait on silent failures */
    const POLL_TIMEOUT_MS = 90_000;

    const pollRun = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const response = await fetchEdge('pitch-run-detail', { cache: 'no-store', params: { runId } });
        if (!response.ok) {
          if (cancelled) return;
          setRun(null);
          setRunError('Failed to load run.');
          setLoading(false);
          return;
        }

        const payload = (await response.json()) as { run?: Run } | Run;
        const nextRun = (payload as { run?: Run }).run ?? (payload as Run);
        if (!nextRun || !nextRun.id) {
          if (cancelled) return;
          setRun(null);
          setRunError('Run not found.');
          setLoading(false);
          return;
        }

        if (cancelled) return;
        setRun(nextRun);

        if (nextRun.status === 'queued' || nextRun.status === 'running') {
          // Give up if we've been polling too long — the background job likely died
          if (Date.now() - pollStartedAt > POLL_TIMEOUT_MS) {
            setRunError('Analysis is taking longer than expected. Please try again.');
            setLoading(false);
            return;
          }

          setLoading(true);
          const delay = document.visibilityState === 'hidden'
            ? Math.min(nextDelayMs * 2, polling.max)
            : nextDelayMs;
          timer = setTimeout(() => {
            nextDelayMs = Math.min(nextDelayMs + polling.step, polling.max);
            void pollRun();
          }, delay);
          return;
        }

        setLoading(false);
        nextDelayMs = polling.initial;
      } catch {
        if (cancelled) return;
        setRun(null);
        setRunError('Failed to load run.');
        setLoading(false);
      } finally {
        isFetching = false;
      }
    };

    void pollRun();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [runId]);

  /* ── Derived data ────────────────────────────────────────── */

  const feedback = useMemo<FeedbackOutput | null>(
    () => run?.outputs?.feedback ?? run?.analysis ?? null,
    [run],
  );
  const qaPack = useMemo<OneMinuteQAPack | null>(
    () =>
      run?.outputs?.qa_1min
        ? run.outputs.qa_1min
        : feedback
          ? synthesizeQaFromFeedback(feedback)
          : null,
    [feedback, run],
  );
  const rewriteDiff = useMemo<RewriteDiff | undefined>(() => {
    if (feedback?.rewrite_diff && feedback.rewrite_diff.hunks.length > 0) {
      return feedback.rewrite_diff;
    }
    if (run?.transcript && feedback?.rewrite_script) {
      return buildRewriteDiff(run.transcript, feedback.rewrite_script);
    }
    return undefined;
  }, [feedback, run]);
  const sectionFeedback = useMemo(
    () =>
      feedback && run
        ? resolveSectionFeedbackForDisplay({
            sections: feedback.section_feedback,
            transcript: run.transcript,
            mode: run.mode,
            feedback,
          })
        : [],
    [feedback, run],
  );
  const economics = useMemo<RunEconomics | null>(
    () => run?.meta?.economics ?? null,
    [run],
  );
  const fallbackWarning = useMemo(() => {
    if (!run?.fallback) return null;
    const reason =
      typeof run.meta?.error_details?.message === 'string'
        ? run.meta.error_details.message
        : null;
    const provider =
      typeof run.meta?.provider_used === 'string' &&
        run.meta.provider_used !== 'none'
        ? run.meta.provider_used
        : null;
    const providerNote = provider ? ` Last provider attempt: ${provider}.` : '';
    if (reason) {
      return `Live provider calls failed (${reason}). Displaying cached fallback analysis.${providerNote}`;
    }
    return `Live provider calls failed. Displaying cached fallback analysis.${providerNote}`;
  }, [run]);
  const rubricContextMeta = useMemo(() => run?.meta?.rubric_context ?? null, [run]);
  const rubricContextAppliedMessage = useMemo(() => {
    if (!rubricContextMeta?.applied) return null;
    const updatedAt = rubricContextMeta.project_updated_at
      ? formatDate(rubricContextMeta.project_updated_at)
      : 'unknown time';
    return [
      `Project rubric context was layered on top of the default rubric for this run.`,
      `Source: ${run?.projectName ?? 'Selected project'}`,
      `Updated: ${updatedAt}`,
      rubricContextMeta.hash ? `Reference: ${rubricContextMeta.hash}` : null,
    ].filter(Boolean).join(' ');
  }, [rubricContextMeta, run?.projectName]);
  const rubricContextFallbackMessage = useMemo(() => {
    if (!rubricContextMeta?.fallback_used) return null;
    const reason = rubricContextMeta.fallback_reason ?? 'Project rubric context was unavailable.';
    return `Default rubric fallback applied for this run. Reason: ${reason}`;
  }, [rubricContextMeta]);
  const rubricPolicyMeta = useMemo(() => run?.meta?.rubric_policy ?? null, [run]);
  const rubricPolicySummary = useMemo(() => {
    if (!rubricPolicyMeta?.applied) return null;
    const ruleCount = Number.isFinite(rubricPolicyMeta.rule_count) ? rubricPolicyMeta.rule_count : 0;
    const missingTerms = Array.isArray(rubricPolicyMeta.missing_terms)
      ? rubricPolicyMeta.missing_terms
      : [];
    const adjustmentCount = Array.isArray(rubricPolicyMeta.adjustments)
      ? rubricPolicyMeta.adjustments.length
      : 0;

    const parts = [`Custom rubric enforcement is active (${ruleCount} parsed rule${ruleCount === 1 ? '' : 's'}).`];
    if (missingTerms.length > 0) {
      parts.push(`Missing required mentions: ${missingTerms.join(', ')}.`);
    } else {
      parts.push('All required rubric mentions were detected in this run.');
    }
    if (adjustmentCount > 0) {
      parts.push(`${adjustmentCount} score cap adjustment${adjustmentCount === 1 ? '' : 's'} applied.`);
    }
    return parts.join(' ');
  }, [rubricPolicyMeta]);
  const rubricPolicyAdjustments = useMemo(() => {
    if (!rubricPolicyMeta?.applied || !Array.isArray(rubricPolicyMeta.adjustments)) return [];
    return rubricPolicyMeta.adjustments.slice(0, 3);
  }, [rubricPolicyMeta]);

  const onCopy = () => {
    if (!feedback) return;
    void navigator.clipboard.writeText(feedback.rewrite_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const onSeek = (seconds: number) => {
    setSeekToSec(seconds);
    recordingRef.current?.seekTo(seconds);
  };

  /* ── Loading state ───────────────────────────────────────── */

  if (loading) {
    // Only show the full analyzing overlay when we know the run is actively
    // queued/running (i.e. a fresh session still being processed). During the
    // initial fetch (run is null) — e.g. navigating from history — show a
    // lightweight loader instead to avoid a jarring flash.
    if (run && (run.status === 'queued' || run.status === 'running')) {
      return <AnalyzingOverlay isVisible />;
    }
    return (
      <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--text-muted)', opacity: 0.5 }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading results...</p>
        </div>
      </main>
    );
  }

  /* ── Failed / timed-out state ────────────────────────────── */

  if (run?.status === 'failed' || runError) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
        <div
          className="max-w-md rounded-2xl border p-6 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
            backdropFilter: 'blur(var(--blur-strength))',
            WebkitBackdropFilter: 'blur(var(--blur-strength))',
          }}
        >
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Analysis Failed
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {runError ??
              run?.error ??
              run?.meta?.error_details?.message ??
              'The analysis job failed before completion.'}
          </p>
          <Link
            href="/session"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg no-underline font-medium"
            style={{ color: 'white', backgroundColor: '#ff5941' }}
          >
            Start New Session
          </Link>
        </div>
      </main>
    );
  }

  /* ── Not found state ─────────────────────────────────────── */

  if (!run || !feedback) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex items-center justify-center">
        <div
          className="max-w-md rounded-2xl border p-6 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
            backdropFilter: 'blur(var(--blur-strength))',
            WebkitBackdropFilter: 'blur(var(--blur-strength))',
          }}
        >
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Result Not Found
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            No run was found for this ID.
          </p>
          <Link
            href="/session"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg no-underline font-medium"
            style={{ color: 'white', backgroundColor: '#ff5941' }}
          >
            Start New Session
          </Link>
        </div>
      </main>
    );
  }

  /* ── Main results layout ─────────────────────────────────── */

  return (
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-4 pr-1">
      {/* Achievement toast notifications */}
      <AchievementToastContainer
        unlocks={achievements.newUnlocks}
        onDismiss={achievements.dismissUnlock}
      />

      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="p-2 rounded-xl border no-underline flex items-center justify-center transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Pitch Analysis
            </h1>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {formatDate(run.createdAt)}
              <span className="mx-1.5 opacity-40">&middot;</span>
              {run.mode === 'elevator' ? 'Elevator' : 'VC Pitch'}
              <span className="mx-1.5 opacity-40">&middot;</span>
              {run.coverage ?? run.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/session"
            className="px-3 py-1.5 rounded-lg border text-sm no-underline transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
          >
            Start New Session
          </Link>
          <Link
            href="/history"
            className="px-3 py-1.5 rounded-lg border text-sm no-underline transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
          >
            History
          </Link>
          <Link
            href={`/qa/${run.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium no-underline transition-opacity duration-150 hover:opacity-90"
            style={{ color: 'white', backgroundColor: '#ff5941' }}
          >
            <MessageCircleQuestion size={14} />
            VC Q&amp;A
          </Link>
        </div>
      </header>
      {fallbackWarning ? (
        <div
          className="rounded-xl border px-3 py-2 text-xs"
          style={{
            color: '#ffaa33',
            backgroundColor: 'rgba(255,170,51,0.12)',
            borderColor: 'rgba(255,170,51,0.35)',
          }}
        >
          {fallbackWarning}
        </div>
      ) : null}
      {rubricContextAppliedMessage ? (
        <div
          className="rounded-xl border px-3 py-2 text-xs"
          style={{
            color: '#60a5fa',
            backgroundColor: 'rgba(96,165,250,0.10)',
            borderColor: 'rgba(96,165,250,0.35)',
          }}
        >
          {rubricContextAppliedMessage}
        </div>
      ) : null}
      {rubricContextFallbackMessage ? (
        <div
          className="rounded-xl border px-3 py-2 text-xs"
          style={{
            color: '#f59e0b',
            backgroundColor: 'rgba(245,158,11,0.12)',
            borderColor: 'rgba(245,158,11,0.35)',
          }}
        >
          {rubricContextFallbackMessage}
        </div>
      ) : null}
      {rubricPolicySummary ? (
        <div
          className="rounded-xl border px-3 py-2 text-xs"
          style={{
            color: '#fda4af',
            backgroundColor: 'rgba(244,63,94,0.10)',
            borderColor: 'rgba(244,63,94,0.35)',
          }}
        >
          <p>{rubricPolicySummary}</p>
          {rubricPolicyAdjustments.length > 0 ? (
            <div className="mt-2 space-y-1">
              {rubricPolicyAdjustments.map((adjustment) => (
                <p key={`${adjustment.rule_id}-${adjustment.category}`} style={{ color: '#fecdd3' }}>
                  {adjustment.category}: {adjustment.before_score}/20 {'->'} {adjustment.after_score}/20 ({adjustment.reason})
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ─── Recording ──────────────────────────────────────── */}
      <RecordingPlayer ref={recordingRef} recordingUrl={run.audioUrl} seekToSec={seekToSec} />

      {/* ━━━ TIER 1: The Verdict ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div data-tour="tour-results-score">
        <ScoreHero feedback={feedback} />
      </div>

      {/* ━━━ Share Score Card ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ShareScoreCard feedback={feedback} run={run} sessionDelta={sessionDelta} />

      {/* ━━━ TIER 2: Actionable Insights ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="results-tier-divider my-1" />

      <div data-tour="tour-results-fixes">
      <Section title="Priority Fixes">
        <TopFixes fixes={feedback.top_fixes.filter((fix) => !fix.category.startsWith('deck_'))} />
      </Section>
      </div>

      {/* ━━━ TIER 3: Deep Dives ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="results-tier-divider my-1" />

      <SectionAccordion
        sections={sectionFeedback}
        onSeek={onSeek}
        canSeek={Boolean(run.audioUrl)}
        totalDurationSec={feedback.delivery_metrics.duration_seconds}
        mode={run.mode}
      />

      <RewriteDiffPanel diff={rewriteDiff} />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div data-tour="tour-results-rewrite">
        <Section
          title="Rewrite Script"
          actions={
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border cursor-pointer transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          }
        >
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--text-primary)' }}
          >
            {feedback.rewrite_script}
          </p>
        </Section>
        </div>

        <div data-tour="tour-results-delivery">
        <Section title="Delivery Diagnostics">
          <VocabDiagnostics
            delivery={feedback.delivery_metrics}
            vocabulary={feedback.vocabulary_metrics}
          />
        </Section>
        </div>
      </section>

      {economics ? <ValueProof economics={economics} /> : null}

      <ReasoningPanel
        reasoning={feedback.advanced_reasoning}
        citations={feedback.citations}
      />

      {qaPack ? (
        <Section title="1-Minute Investor Drill">
          <InvestorDrill
            qaPack={qaPack}
            runId={run.id}
          />
        </Section>
      ) : null}

      {/* ─── Context Pane (expandable) ──────────────────────── */}
      <details
        className="rounded-2xl border p-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <summary
          className="cursor-pointer text-xs font-semibold uppercase tracking-wider select-none"
          style={{ color: 'var(--text-muted)' }}
        >
          Expand Context Pane
        </summary>
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Transcript
            </p>
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--text-secondary)' }}
            >
              {run.transcript}
            </p>
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              QA Sessions
            </p>
            {(run.qaSessionsSummary ?? []).length > 0 ? (
              <ul className="space-y-1.5">
                {(run.qaSessionsSummary ?? []).map((item) => (
                  <li
                    key={item.qaSessionId}
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.status}
                    <span className="mx-1.5 opacity-40">&middot;</span>
                    {item.durationSeconds ?? 0}s
                    <span className="mx-1.5 opacity-40">&middot;</span>
                    {new Date(item.startedAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No persisted live QA sessions for this run yet.
              </p>
            )}
          </div>
        </div>
      </details>
    </main>
  );
}
