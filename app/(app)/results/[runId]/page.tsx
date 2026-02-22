'use client';

import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  MessageSquare,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FeedbackOutput, OneMinuteQAPack, PaidSyncMeta, RunEconomics } from '@/types/analysis-v2';
import type { Run } from '@/types/pitch';
import {
  DeliveryEventsTimeline,
  GoodBadSummary,
  PreviousRunsLinks,
  ReasoningPanel,
  RewriteDiffPanel,
  SectionAccordion,
} from '@/views/components/results';
import {
  RecordingPlayer,
  type RecordingPlayerHandle,
} from '@/views/components/RecordingPlayer';
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';

function scoreBand(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Investor-Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  if (score >= 60) return { label: 'Solid', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' };
  if (score >= 40) return { label: 'Getting There', color: '#ffaa33', bg: 'rgba(255,170,51,0.12)' };
  return { label: 'Needs Work', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
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

function paidSyncBadge(sync?: PaidSyncMeta): { label: string; color: string; bg: string } {
  if (!sync || sync.status === 'skipped') {
    return { label: 'Dry Run', color: '#ffaa33', bg: 'rgba(255,170,51,0.14)' };
  }
  if (sync.status === 'sent') {
    return { label: 'Synced', color: '#22c55e', bg: 'rgba(34,197,94,0.14)' };
  }
  return { label: 'Sync Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.14)' };
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border px-2 py-1.5" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

function Card({
  title,
  children,
  actions,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-4 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

export default function ResultsPage() {
  const params = useParams<{ runId: string | string[] }>();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [runError, setRunError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [seekToSec, setSeekToSec] = useState<number | null>(null);
  const recordingRef = useRef<RecordingPlayerHandle | null>(null);
  const liveQaEnabled = process.env.NEXT_PUBLIC_ENABLE_LIVE_QA === 'true';

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
  const band = feedback ? scoreBand(feedback.overall_score) : null;

  const totalFillers = feedback?.delivery_metrics.filler_words.reduce(
    (sum, item) => sum + item.count,
    0,
  ) ?? 0;

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

  if (loading) {
    return <AnalyzingOverlay isVisible />;
  }

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

  if (!run || !feedback || !band) {
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

  return (
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-5 pr-1">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="p-2 rounded-xl border no-underline flex items-center justify-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Post Analysis
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDate(run.createdAt)} | {run.mode === 'elevator' ? 'Elevator' : 'VC Pitch'} |{' '}
              {run.coverage ?? run.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/session"
            className="px-3 py-1.5 rounded-lg border text-sm no-underline"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
          >
            Run Again
          </Link>
          <Link
            href="/history"
            className="px-3 py-1.5 rounded-lg text-sm no-underline"
            style={{ color: 'white', backgroundColor: '#ff5941' }}
          >
            View History
          </Link>
          {liveQaEnabled ? (
            <Link
              href={`/qa/${run.id}`}
              className="px-3 py-1.5 rounded-lg text-sm no-underline"
              style={{ color: 'white', backgroundColor: '#e63b26' }}
            >
              Start Live VC Q&A (60s)
            </Link>
          ) : null}
        </div>
      </header>

      <RecordingPlayer ref={recordingRef} recordingUrl={run.audioUrl} seekToSec={seekToSec} />

      <section
        className="rounded-2xl border p-5 animate-fade-in-up"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <div
              className="w-28 h-28 rounded-full border flex flex-col items-center justify-center"
              style={{ borderColor: band.color, backgroundColor: band.bg }}
            >
              <span className="text-3xl font-bold" style={{ color: band.color }}>
                {feedback.overall_score}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                /100
              </span>
            </div>
            <p
              className="inline-flex text-xs font-semibold px-2 py-1 rounded-full mt-3"
              style={{ color: band.color, backgroundColor: band.bg }}
            >
              {band.label}
            </p>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-sm uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
              Verdict
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {feedback.one_line_verdict}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <StatPill icon={<Timer size={12} />} label="WPM" value={String(feedback.delivery_metrics.wpm)} />
              <StatPill
                icon={<Clock size={12} />}
                label="Duration"
                value={formatDuration(feedback.delivery_metrics.duration_seconds)}
              />
              <StatPill icon={<MessageSquare size={12} />} label="Fillers" value={String(totalFillers)} />
              <StatPill icon={<MessageSquare size={12} />} label="Penalty" value={String(feedback.penalty)} />
            </div>
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border p-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Value Proof
          </h2>
          {economics ? (
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{
                color: paidSyncBadge(economics.paid_sync).color,
                backgroundColor: paidSyncBadge(economics.paid_sync).bg,
              }}
            >
              {paidSyncBadge(economics.paid_sync).label}
            </span>
          ) : null}
        </div>

        {economics ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatPill
                icon={<Timer size={12} />}
                label="Estimated Cost"
                value={formatCurrency(economics.estimated_cost_usd)}
              />
              <StatPill
                icon={<MessageSquare size={12} />}
                label="Money Saved vs Coach"
                value={formatCurrency(economics.money_saved_vs_coach_usd)}
              />
              <StatPill
                icon={<Clock size={12} />}
                label="Net Savings (Est.)"
                value={formatCurrency(economics.gross_margin_usd)}
              />
              <StatPill
                icon={<Timer size={12} />}
                label="Time Saved"
                value={formatMinutes(economics.time_saved_minutes)}
              />
            </div>

            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Based on an equivalent pitch-coach rate of {formatCurrency(economics.coach_hourly_rate_usd)}/hour.
            </p>
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Value proof is unavailable for this run.
          </p>
        )}
      </section>

      <GoodBadSummary good={feedback.summary_good} bad={feedback.summary_bad} />

      <DeliveryEventsTimeline events={feedback.delivery_metrics.events} onSeek={onSeek} />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Score Breakdown">
          <div className="flex flex-col gap-3">
            {feedback.rubric_breakdown.map((item) => {
              const pct = Math.max(0, Math.min(100, (item.score / item.max_score) * 100));
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-primary)' }}>{item.category}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.score}/{item.max_score}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: '#ff5941' }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {item.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Top Fixes">
          <div className="flex flex-col gap-3">
            {feedback.top_fixes.map((fix) => (
              <div key={fix.rank} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  #{fix.rank} | {fix.category} | {fix.impact}
                </p>
                <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                  <strong>Issue:</strong> {fix.issue}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <strong>Fix:</strong> {fix.fix}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <SectionAccordion sections={feedback.section_feedback} />

      <RewriteDiffPanel diff={feedback.rewrite_diff} />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card
          title="Rewrite Script"
          actions={
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          }
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
            {feedback.rewrite_script}
          </p>
        </Card>

        <Card title="Vocabulary + Delivery Diagnostics">
          <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <li>Word count: {feedback.delivery_metrics.word_count}</li>
            <li>Filler count: {feedback.delivery_metrics.filler_count}</li>
            <li>Stutter rate: {feedback.delivery_metrics.stutter_rate}</li>
            <li>Repeat rate: {feedback.delivery_metrics.repeat_rate}</li>
            <li>Within time limit: {feedback.delivery_metrics.within_time_limit ? 'Yes' : 'No'}</li>
            {feedback.vocabulary_metrics ? (
              <>
                <li>Lexical diversity: {feedback.vocabulary_metrics.lexical_diversity}</li>
                <li>Hedge density: {feedback.vocabulary_metrics.hedge_density}</li>
                <li>Jargon density: {feedback.vocabulary_metrics.jargon_density}</li>
              </>
            ) : null}
          </ul>
        </Card>
      </section>

      <ReasoningPanel
        reasoning={feedback.advanced_reasoning}
        citations={feedback.citations}
      />

      <PreviousRunsLinks links={feedback.historical_links} />

      <Card title="1-Minute Investor Drill">
        {qaPack ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Target: {qaPack.total_target_seconds}s | Timing: {qaPack.timing_plan_seconds.join(' / ')}
            </p>
            {qaPack.suggested_answers.map((entry, index) => (
              <div
                key={`${entry.question}-${index}`}
                className="rounded-xl border p-3"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Q{index + 1}: {entry.question}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {entry.answer}
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Target {entry.target_seconds}s
                </p>
              </div>
            ))}
            {liveQaEnabled ? (
              <Link
                href={`/qa/${run.id}`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg no-underline text-sm font-medium"
                style={{ color: 'white', backgroundColor: '#e63b26' }}
              >
                Start Live VC Q&A (60s)
              </Link>
            ) : null}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No Q&A pack available.</p>
        )}
      </Card>

      <details
        className="rounded-2xl border p-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <summary className="cursor-pointer text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Expand Context Pane
        </summary>
        <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
              Transcript
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {run.transcript}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
              QA Sessions
            </p>
            {(run.qaSessionsSummary ?? []).length > 0 ? (
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                {(run.qaSessionsSummary ?? []).map((item) => (
                  <li key={item.qaSessionId}>
                    {item.status} | {item.durationSeconds ?? 0}s | {new Date(item.startedAt).toLocaleString()}
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
