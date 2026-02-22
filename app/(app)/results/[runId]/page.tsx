'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  MessageSquare,
  Timer,
} from 'lucide-react';
import type { FeedbackOutput, OneMinuteQAPack } from '@/types/analysis-v2';
import type { Run } from '@/types/pitch';
import { RecordingPlayer } from '@/views/components/RecordingPlayer';
import type {
  MiroFixBoardResponse,
  MiroFixPatchResponse,
  MiroFixStatus,
  MiroGetFixBoardResponse,
  MiroTopFixInput,
} from '@/services/miro/miroTypes';
import { useMiroSync } from '@/hooks/useMiroSync';
import { MiroSyncPanel } from '@/views/components/MiroSyncPanel';
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';

type ResultTab = 'feedback' | 'qa';

function scoreBand(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Investor-Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  if (score >= 60) return { label: 'Solid', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' };
  if (score >= 40) return { label: 'Getting There', color: '#ffaa33', bg: 'rgba(255,170,51,0.12)' };
  return { label: 'Needs Work', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}

function synthesizeQaFromFeedback(feedback: FeedbackOutput): OneMinuteQAPack {
  const weakest = [...feedback.rubric_breakdown]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => item.category);
  const questions = weakest.map((category) => `How are you de-risking your ${category.replace(/_/g, ' ')} concerns?`);
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
        answer: feedback.top_fixes[0]?.fix ?? 'Anchor claims with evidence and milestone clarity.',
        target_seconds: 20,
      },
      {
        question: q2,
        answer: feedback.top_fixes[1]?.fix ?? 'Clarify differentiation and execution plan.',
        target_seconds: 20,
      },
      {
        question: q3,
        answer: feedback.top_fixes[2]?.fix ?? 'Close with a direct ask and use-of-funds milestones.',
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

function getMiroPollIntervalMs(): number {
  const value = process.env.NEXT_PUBLIC_MIRO_POLL_INTERVAL_MS;
  if (!value) return 8_000;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 8_000;
  return parsed;
}

interface MiroCreateFixBoardPayload {
  runId: string;
  mode: string;
  oneLineVerdict: string;
  topFixes: MiroTopFixInput[];
  rewriteScript: string;
  recreate?: boolean;
}

interface MiroBoardState {
  boardId: string;
  boardUrl: string;
  createdAt: string;
  fallback?: boolean;
}

export default function ResultsPage() {
  const params = useParams<{ runId: string | string[] }>();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [runError, setRunError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<ResultTab>('feedback');

  const [miroBoard, setMiroBoard] = useState<MiroBoardState | null>(null);
  const [miroLocalSnapshot, setMiroLocalSnapshot] = useState<MiroFixBoardResponse['snapshot'] | null>(null);
  const [isCreatingMiroBoard, setIsCreatingMiroBoard] = useState(false);
  const [isLoadingMiroBoard, setIsLoadingMiroBoard] = useState(false);
  const [miroCreateError, setMiroCreateError] = useState<string | null>(null);
  const [miroCreateMessage, setMiroCreateMessage] = useState<string | null>(null);
  const miroPollIntervalMs = useMemo(() => getMiroPollIntervalMs(), []);

  const {
    snapshot: miroSnapshot,
    isSyncing: isMiroSyncing,
    error: miroSyncError,
    syncNow: syncMiroNow,
  } = useMiroSync({
    runId: runId ?? '',
    enabled: Boolean(runId && miroBoard?.boardId),
    pollIntervalMs: miroPollIntervalMs,
  });

  useEffect(() => {
    if (!runId) {
      setMiroBoard(null);
      setMiroLocalSnapshot(null);
      return;
    }

    let cancelled = false;
    setIsLoadingMiroBoard(true);
    setMiroCreateError(null);
    setMiroCreateMessage(null);

    const loadMiroBoard = async () => {
      try {
        const params = new URLSearchParams({ runId });
        const response = await fetch(`/api/miro/fix-board?${params.toString()}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (cancelled) return;
        if (response.status === 404) {
          setMiroBoard(null);
          setMiroLocalSnapshot(null);
          return;
        }

        const data = (await response.json()) as Partial<MiroGetFixBoardResponse> & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load Miro board.');
        }

        if (!data.boardId || !data.boardUrl || !data.createdAt || !data.snapshot) {
          throw new Error('Miro board response missing required fields.');
        }

        setMiroBoard({
          boardId: data.boardId,
          boardUrl: data.boardUrl,
          createdAt: data.createdAt,
          fallback: data.fallback,
        });
        setMiroLocalSnapshot(data.snapshot);
      } catch (error) {
        if (cancelled) return;
        setMiroCreateError(error instanceof Error ? error.message : 'Failed to load Miro board.');
        setMiroBoard(null);
        setMiroLocalSnapshot(null);
      } finally {
        if (!cancelled) {
          setIsLoadingMiroBoard(false);
        }
      }
    };

    void loadMiroBoard();
    return () => {
      cancelled = true;
    };
  }, [runId]);

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
    () => (run?.outputs?.feedback ?? run?.analysis ?? null),
    [run],
  );
  const qaPack = useMemo<OneMinuteQAPack | null>(
    () => (run?.outputs?.qa_1min ? run.outputs.qa_1min : feedback ? synthesizeQaFromFeedback(feedback) : null),
    [feedback, run],
  );
  const band = feedback ? scoreBand(feedback.overall_score) : null;

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

  const totalFillers = feedback.delivery_metrics.filler_words.reduce(
    (sum: number, item: FeedbackOutput['delivery_metrics']['filler_words'][number]) =>
      sum + item.count,
    0,
  );

  const onCopy = () => {
    void navigator.clipboard.writeText(feedback.rewrite_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  async function createFixBoardInMiro(recreate = false) {
    if (!runId || !run || !feedback) return;

    setIsCreatingMiroBoard(true);
    setMiroCreateError(null);
    setMiroCreateMessage(null);

    const payload: MiroCreateFixBoardPayload = {
      runId,
      mode: run.mode,
      oneLineVerdict: feedback.one_line_verdict,
      topFixes: feedback.top_fixes.map((fix) => ({
        rank: fix.rank,
        category: fix.category,
        impact: fix.impact,
        issue: fix.issue,
        fix: fix.fix,
      })),
      rewriteScript: feedback.rewrite_script,
      recreate,
    };

    try {
      const response = await fetch('/api/miro/fix-board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as Partial<MiroFixBoardResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Miro fix board.');
      }

      if (!data.boardId || !data.boardUrl || !data.snapshot) {
        throw new Error('Miro API returned an incomplete board response.');
      }

      const nextBoard: MiroBoardState = {
        boardId: data.boardId,
        boardUrl: data.boardUrl,
        createdAt: data.createdAt || new Date().toISOString(),
        fallback: data.fallback,
      };

      setMiroBoard(nextBoard);
      setMiroLocalSnapshot(data.snapshot);
      setMiroCreateMessage(
        data.message ||
          (nextBoard.fallback
            ? 'Miro fallback mode active. Stub board created locally.'
            : data.reused
              ? 'Existing Miro board reused for this run.'
              : 'Fix board created successfully.'),
      );
    } catch (error) {
      setMiroCreateError(
        error instanceof Error ? error.message : 'Failed to create Miro fix board.',
      );
    } finally {
      setIsCreatingMiroBoard(false);
    }
  }

  async function saveFixPatch(input: {
    rank: number;
    patch: {
      status: MiroFixStatus;
      owner: string;
      notes: string;
    };
  }) {
    if (!runId) return;

    const response = await fetch('/api/miro/fix-board', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        runId,
        rank: input.rank,
        patch: input.patch,
        clientUpdatedAt: new Date().toISOString(),
      }),
    });
    const data = (await response.json()) as Partial<MiroFixPatchResponse> & {
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save Miro fix patch.');
    }
    if (data.snapshot) {
      setMiroLocalSnapshot(data.snapshot);
    }
    if (data.queued) {
      setMiroCreateMessage('Patch queued for retry while Miro API recovers.');
    }
  }

  const effectiveMiroSnapshot = useMemo(() => {
    if (!miroSnapshot) return miroLocalSnapshot;
    if (!miroLocalSnapshot) return miroSnapshot;
    const hookTs = Date.parse(miroSnapshot.syncedAt || '');
    const localTs = Date.parse(miroLocalSnapshot.syncedAt || '');
    return hookTs >= localTs ? miroSnapshot : miroLocalSnapshot;
  }, [miroSnapshot, miroLocalSnapshot]);
  const miroFixes = effectiveMiroSnapshot?.fixes ?? [];
  const miroWarnings = effectiveMiroSnapshot?.warnings ?? [];
  const combinedMiroError = miroCreateError || miroSyncError;

  return (
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-5 pr-1">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="p-2 rounded-xl border no-underline flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Pitch Results
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDate(run.createdAt)} | {run.mode === 'elevator' ? 'Elevator' : 'VC Pitch'} | {run.coverage ?? run.status}
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
        </div>
      </header>

      <RecordingPlayer recordingUrl={run.audioUrl} />

      <section
        className="rounded-2xl border p-5"
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
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</span>
            </div>
            <p className="inline-flex text-xs font-semibold px-2 py-1 rounded-full mt-3" style={{ color: band.color, backgroundColor: band.bg }}>
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
              <StatPill icon={<Clock size={12} />} label="Duration" value={formatDuration(feedback.delivery_metrics.duration_seconds)} />
              <StatPill icon={<MessageSquare size={12} />} label="Fillers" value={String(totalFillers)} />
              <StatPill icon={<MessageSquare size={12} />} label="Penalty" value={String(feedback.penalty)} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-2" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab('feedback')}
            className="px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'feedback' ? 'rgba(255,89,65,0.16)' : 'transparent',
              color: tab === 'feedback' ? '#ff5941' : 'var(--text-secondary)',
            }}
          >
            Analytics & Feedback
          </button>
          <button
            type="button"
            onClick={() => setTab('qa')}
            className="px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === 'qa' ? 'rgba(255,89,65,0.16)' : 'transparent',
              color: tab === 'qa' ? '#ff5941' : 'var(--text-secondary)',
            }}
          >
            1-Minute Q&A
          </button>
        </div>
      </section>

      {tab === 'feedback' ? (
        <>
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card title="Score Breakdown">
              <div className="flex flex-col gap-3">
                {feedback.rubric_breakdown.map((item: FeedbackOutput['rubric_breakdown'][number]) => {
                  const pct = Math.max(0, Math.min(100, (item.score / item.max_score) * 100));
                  return (
                    <div key={item.category}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span style={{ color: 'var(--text-primary)' }}>{item.category}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{item.score}/{item.max_score}</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#ff5941' }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.rationale}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card
              title="Top Fixes"
              actions={
                <button
                  type="button"
                  onClick={() => {
                    void createFixBoardInMiro(Boolean(miroBoard));
                  }}
                  disabled={isCreatingMiroBoard || isLoadingMiroBoard}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border"
                  style={{
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border-color)',
                    opacity: isCreatingMiroBoard || isLoadingMiroBoard ? 0.7 : 1,
                  }}
                >
                  {isCreatingMiroBoard
                    ? 'Creating...'
                    : isLoadingMiroBoard
                      ? 'Loading...'
                    : miroBoard
                      ? 'Recreate Fix Board'
                      : 'Create Fix Board'}
                </button>
              }
            >
              <div className="flex flex-col gap-3">
                {feedback.top_fixes.map((fix: FeedbackOutput['top_fixes'][number]) => (
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
                {miroCreateMessage ? (
                  <div className="text-xs px-2 py-1 rounded-lg" style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.10)' }}>
                    {miroCreateMessage}
                  </div>
                ) : null}
                {combinedMiroError ? (
                  <div className="text-xs px-2 py-1 rounded-lg" style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)' }}>
                    {combinedMiroError}
                  </div>
                ) : null}
                {miroWarnings.length > 0 ? (
                  <div className="text-xs px-2 py-1 rounded-lg" style={{ color: '#ffaa33', backgroundColor: 'rgba(255,170,51,0.10)' }}>
                    {miroWarnings[0]}
                  </div>
                ) : null}
              </div>
            </Card>
          </section>

          {miroBoard ? (
            <section>
              <MiroSyncPanel
                fixes={miroFixes}
                isSyncing={isMiroSyncing}
                lastSyncedAt={effectiveMiroSnapshot?.syncedAt}
                error={combinedMiroError}
                boardUrl={miroBoard.fallback ? undefined : miroBoard.boardUrl}
                queuedOps={effectiveMiroSnapshot?.queuedOps ?? 0}
                degraded={effectiveMiroSnapshot?.degraded ?? false}
                conflicts={effectiveMiroSnapshot?.conflicts ?? 0}
                version={effectiveMiroSnapshot?.version ?? 1}
                onSyncNow={() => {
                  void syncMiroNow();
                }}
                onSaveFix={saveFixPatch}
              />
            </section>
          ) : null}

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
            <Card title="Delivery Diagnostics">
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>Word count: {feedback.delivery_metrics.word_count}</li>
                <li>Filler count: {feedback.delivery_metrics.filler_count}</li>
                <li>Stutter rate: {feedback.delivery_metrics.stutter_rate}</li>
                <li>Repeat rate: {feedback.delivery_metrics.repeat_rate}</li>
                <li>Within time limit: {feedback.delivery_metrics.within_time_limit ? 'Yes' : 'No'}</li>
              </ul>
            </Card>
          </section>

          <Card title="Transcript">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {run.transcript}
            </p>
          </Card>
        </>
      ) : (
        <Card title="1-Minute Investor Drill">
          {qaPack ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Target: {qaPack.total_target_seconds}s | Timing: {qaPack.timing_plan_seconds.join(' / ')}
              </p>
              {qaPack.suggested_answers.map((entry, index) => (
                <div key={`${entry.question}-${index}`} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
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
              <div>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                  Red flags to avoid
                </p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  {qaPack.red_flags_to_avoid.map((flag) => (
                    <li key={flag}>- {flag}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No Q&A pack available.</p>
          )}
        </Card>
      )}
    </main>
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
    <section className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
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
