'use client';

import { ArrowLeft, Check, Copy, MessageCircleQuestion } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FeedbackOutput, OneMinuteQAPack, PaidSyncMeta, RunEconomics } from '@/types/analysis-v2';
import type { Run } from '@/types/pitch';
import {
  DeliveryEventsTimeline,
  GoodBadSummary,
  InvestorDrill,
  PreviousRunsLinks,
  ReasoningPanel,
  RewriteDiffPanel,
  RubricBreakdown,
  ScoreHero,
  SectionAccordion,
  TopFixes,
  VocabDiagnostics,
} from '@/views/components/results';
import {
  RecordingPlayer,
  type RecordingPlayerHandle,
} from '@/views/components/RecordingPlayer';
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';

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

function paidSyncBadge(sync?: PaidSyncMeta): { label: string; color: string; bg: string } {
  if (!sync || sync.status === 'skipped') {
    return { label: 'Dry Run', color: '#ffaa33', bg: 'rgba(255,170,51,0.14)' };
  }
  if (sync.status === 'sent') {
    return { label: 'Synced', color: '#22c55e', bg: 'rgba(34,197,94,0.14)' };
  }
  return { label: 'Sync Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.14)' };
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
  const badge = paidSyncBadge(economics.paid_sync);

  return (
    <Section
      title="Value Proof"
      actions={
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: badge.color, backgroundColor: badge.bg }}
        >
          {badge.label}
        </span>
      }
    >
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
  const liveQaEnabled = process.env.NEXT_PUBLIC_ENABLE_LIVE_QA !== 'false';

  /* ── Data fetching + polling ─────────────────────────────── */

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      setRun(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const pollRun = async () => {
      try {
        const response = await fetch(`/api/pitch/run/${runId}`);
        if (!response.ok) {
          setRun(null);
          setRunError('Failed to load run.');
          setLoading(false);
          return;
        }

        const payload = (await response.json()) as { run?: Run } | Run;
        const nextRun = (payload as { run?: Run }).run ?? (payload as Run);
        if (!nextRun || !nextRun.id) {
          setRun(null);
          setRunError('Run not found.');
          setLoading(false);
          return;
        }

        if (cancelled) return;
        setRun(nextRun);

        if (nextRun.status === 'queued' || nextRun.status === 'running') {
          setLoading(true);
          timer = setTimeout(() => {
            void pollRun();
          }, 1500);
          return;
        }

        setLoading(false);
      } catch {
        if (cancelled) return;
        setRun(null);
        setRunError('Failed to load run.');
        setLoading(false);
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
  const economics = useMemo<RunEconomics | null>(
    () => run?.meta?.economics ?? null,
    [run],
  );

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
    return <AnalyzingOverlay isVisible />;
  }

  /* ── Failed state ────────────────────────────────────────── */

  if (run?.status === 'failed') {
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
            {run.error ?? runError ?? 'The analysis job failed before completion.'}
          </p>
          <Link
            href="/session"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg no-underline font-medium"
            style={{ color: 'white', backgroundColor: '#ff5941' }}
          >
            Run Again
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
            Run a Pitch
          </Link>
        </div>
      </main>
    );
  }

  /* ── Main results layout ─────────────────────────────────── */

  return (
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-4 pr-1">
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
            Run Again
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

      {/* ─── Recording ──────────────────────────────────────── */}
      <RecordingPlayer ref={recordingRef} recordingUrl={run.audioUrl} seekToSec={seekToSec} />

      {/* ━━━ TIER 1: The Verdict ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <ScoreHero feedback={feedback} />

      {/* ━━━ TIER 2: Actionable Insights ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="results-tier-divider my-1" />

      <GoodBadSummary good={feedback.summary_good} bad={feedback.summary_bad} />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="Score Breakdown">
          <RubricBreakdown breakdown={feedback.rubric_breakdown.filter((item) => !item.category.startsWith('deck_'))} />
        </Section>

        <Section title="Priority Fixes">
          <TopFixes fixes={feedback.top_fixes.filter((fix) => !fix.category.startsWith('deck_'))} />
        </Section>
      </section>

      {/* ━━━ TIER 3: Deep Dives ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="results-tier-divider my-1" />

      <DeliveryEventsTimeline events={feedback.delivery_metrics.events} onSeek={onSeek} />

      <SectionAccordion sections={feedback.section_feedback} />

      <RewriteDiffPanel diff={feedback.rewrite_diff} />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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

        <Section title="Delivery Diagnostics">
          <VocabDiagnostics
            delivery={feedback.delivery_metrics}
            vocabulary={feedback.vocabulary_metrics}
          />
        </Section>
      </section>

      {economics ? <ValueProof economics={economics} /> : null}

      <ReasoningPanel
        reasoning={feedback.advanced_reasoning}
        citations={feedback.citations}
      />

      <PreviousRunsLinks links={feedback.historical_links} />

      {qaPack ? (
        <Section title="1-Minute Investor Drill">
          <InvestorDrill
            qaPack={qaPack}
            runId={run.id}
            liveQaEnabled={liveQaEnabled}
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
