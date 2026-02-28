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
  TopFixes,
  VocabDiagnostics,
} from '@/views/components/results';
import {
  RecordingPlayer,
  type RecordingPlayerHandle,
} from '@/views/components/RecordingPlayer';
import { buildRewriteDiff } from '@/services/rewriteDiffService';
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { useTutorial } from '@/hooks/useTutorial';
import type {
  MiroFixBoardResponse,
  MiroFixPatchResponse,
  MiroFixStatus,
  MiroGetFixBoardResponse,
  MiroTopFixInput,
} from '@/services/miro/miroTypes';
import { useMiroSync } from '@/hooks/useMiroSync';
import { MiroSyncPanel } from '@/views/components/MiroSyncPanel';

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

function getMiroPollIntervalMs(): number {
  const value = process.env.NEXT_PUBLIC_MIRO_POLL_INTERVAL_MS;
  if (!value) return 8_000;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 8_000;
  return parsed;
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

interface MiroCreateFixBoardPayload {
  runId: string;
  mode: string;
  oneLineVerdict: string;
  topFixes: MiroTopFixInput[];
  rewriteScript: string;
  transcript?: string;
  recreate?: boolean;
}

interface MiroBoardState {
  boardId: string;
  boardUrl: string;
  createdAt: string;
  fallback?: boolean;
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
  const [miroBoard, setMiroBoard] = useState<MiroBoardState | null>(null);
  const [miroLocalSnapshot, setMiroLocalSnapshot] = useState<MiroFixBoardResponse['snapshot'] | null>(
    null,
  );
  const [isCreatingMiroBoard, setIsCreatingMiroBoard] = useState(false);
  const [isLoadingMiroBoard, setIsLoadingMiroBoard] = useState(false);
  const [miroCreateError, setMiroCreateError] = useState<string | null>(null);
  const [miroCreateMessage, setMiroCreateMessage] = useState<string | null>(null);
  const miroPollIntervalMs = useMemo(() => getMiroPollIntervalMs(), []);
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
      })
      .catch(() => {});
  }, [run?.status, achievements.processRuns]);

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
      setIsLoadingMiroBoard(false);
      return;
    }

    // Wait until run completes before loading fix-board metadata.
    if (run?.status !== 'complete') {
      setMiroBoard(null);
      setMiroLocalSnapshot(null);
      setIsLoadingMiroBoard(false);
      return;
    }

    let cancelled = false;
    setIsLoadingMiroBoard(true);
    setMiroCreateError(null);
    setMiroCreateMessage(null);

    const loadMiroBoard = async () => {
      try {
        const response = await fetchEdge('miro-fix-board', {
          method: 'GET',
          cache: 'no-store',
          params: { runId },
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
  }, [runId, run?.status]);

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
      transcript: run.transcript,
      recreate,
    };

    try {
      const response = await fetchEdge('miro-fix-board', {
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

    const response = await fetchEdge('miro-fix-board', {
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

  const effectiveMiroSnapshot = (() => {
    if (!miroSnapshot) return miroLocalSnapshot;
    if (!miroLocalSnapshot) return miroSnapshot;
    const hookTs = Date.parse(miroSnapshot.syncedAt || '');
    const localTs = Date.parse(miroLocalSnapshot.syncedAt || '');
    return hookTs >= localTs ? miroSnapshot : miroLocalSnapshot;
  })();
  const miroFixes = effectiveMiroSnapshot?.fixes ?? [];
  const miroWarnings = effectiveMiroSnapshot?.warnings ?? [];
  const combinedMiroError = miroCreateError || miroSyncError;

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
            {run.error ??
              run.meta?.error_details?.message ??
              runError ??
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

      {/* ─── Recording ──────────────────────────────────────── */}
      <RecordingPlayer ref={recordingRef} recordingUrl={run.audioUrl} seekToSec={seekToSec} />

      {/* ━━━ TIER 1: The Verdict ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div data-tour="tour-results-score">
        <ScoreHero feedback={feedback} />
      </div>

      {/* ━━━ TIER 2: Actionable Insights ━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="results-tier-divider my-1" />

      <div data-tour="tour-results-fixes">
      <Section
        title="Priority Fixes"
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
        <TopFixes fixes={feedback.top_fixes.filter((fix) => !fix.category.startsWith('deck_'))} />
        {miroCreateMessage ? (
          <div
            className="text-xs px-2 py-1 rounded-lg mt-3"
            style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.10)' }}
          >
            {miroCreateMessage}
          </div>
        ) : null}
        {combinedMiroError ? (
          <div
            className="text-xs px-2 py-1 rounded-lg mt-3"
            style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.10)' }}
          >
            {combinedMiroError}
          </div>
        ) : null}
        {miroWarnings.length > 0 ? (
          <div
            className="text-xs px-2 py-1 rounded-lg mt-3"
            style={{ color: '#ffaa33', backgroundColor: 'rgba(255,170,51,0.10)' }}
          >
            {miroWarnings[0]}
          </div>
        ) : null}
      </Section>
      </div>

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

      {/* ━━━ TIER 3: Deep Dives ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="results-tier-divider my-1" />

      <SectionAccordion
        sections={feedback.section_feedback}
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
