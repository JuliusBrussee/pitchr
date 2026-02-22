'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Mic, RefreshCw, StopCircle } from 'lucide-react';
import { useLiveQaAgent } from '@/hooks/useLiveQaAgent';
import type { CreateQASessionResponse } from '@/types/qna';
import type { RunStatus } from '@/types/pitch';
import type { QATurn } from '@/types/qna';

interface SessionBootstrap {
  qaSessionId: string;
  signedUrl: string;
  conversationId?: string;
  durationLimitSeconds: number;
  starterContext: string;
}

function formatSeconds(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

function transcriptFromTurns(turns: QATurn[]): string {
  return turns.map((turn) => `${turn.speaker.toUpperCase()}: ${turn.text}`).join('\n');
}

export default function LiveQaPage() {
  const params = useParams<{ runId: string | string[] }>();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const liveQaEnabled = process.env.NEXT_PUBLIC_ENABLE_LIVE_QA === 'true';

  const [bootstrap, setBootstrap] = useState<SessionBootstrap | null>(null);
  const [bootstrapNonce, setBootstrapNonce] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [persistedStatus, setPersistedStatus] = useState<'completed' | 'expired' | 'failed' | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const bootstrapRequestKeyRef = useRef<string | null>(null);
  const bootstrapInFlightRef = useRef<string | null>(null);
  const bootstrapAbortRef = useRef<AbortController | null>(null);
  const persistInFlightRef = useRef(false);

  const liveQa = useLiveQaAgent({
    signedUrl: bootstrap?.signedUrl ?? null,
    starterContext: bootstrap?.starterContext ?? '',
    durationLimitSeconds: bootstrap?.durationLimitSeconds ?? 60,
  });

  const requestFreshSession = useCallback(() => {
    setBootstrap(null);
    setError(null);
    setPersistError(null);
    setPersistedStatus(null);
    bootstrapRequestKeyRef.current = null;
    setBootstrapNonce((previous) => previous + 1);
  }, []);

  useEffect(() => {
    if (!runId || !liveQaEnabled) {
      setIsLoading(false);
      return;
    }
    const requestKey = `${runId}:${bootstrapNonce}`;
    if (bootstrapRequestKeyRef.current === requestKey || bootstrapInFlightRef.current === requestKey) {
      return;
    }

    const controller = new AbortController();
    bootstrapAbortRef.current?.abort();
    bootstrapAbortRef.current = controller;
    bootstrapInFlightRef.current = requestKey;

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/qna/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ runId }),
        });
        const payload = (await response.json()) as CreateQASessionResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to initialize live QA.');
        }
        if (bootstrapInFlightRef.current !== requestKey) return;
        setBootstrap({
          qaSessionId: payload.qaSessionId,
          signedUrl: payload.signedUrl,
          conversationId: payload.conversationId,
          durationLimitSeconds: payload.durationLimitSeconds,
          starterContext: payload.starterContext,
        });
        setPersistedStatus(null);
        setPersistError(null);
        bootstrapRequestKeyRef.current = requestKey;
      } catch (caughtError) {
        if (controller.signal.aborted) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to initialize live QA.');
      } finally {
        if (bootstrapAbortRef.current === controller && bootstrapInFlightRef.current === requestKey) {
          bootstrapInFlightRef.current = null;
          bootstrapAbortRef.current = null;
          setIsLoading(false);
        }
      }
    })();

    return () => {
      if (bootstrapAbortRef.current === controller) {
        bootstrapAbortRef.current = null;
      }
      if (bootstrapInFlightRef.current === requestKey) {
        bootstrapInFlightRef.current = null;
      }
      controller.abort();
    };
  }, [bootstrapNonce, liveQaEnabled, runId]);

  useEffect(() => {
    return () => {
      bootstrapAbortRef.current?.abort();
    };
  }, []);

  const qaSessionStatus: RunStatus | null = useMemo(() => {
    if (liveQa.status === 'active') return 'running';
    if (liveQa.status === 'connecting') return 'queued';
    if (liveQa.status === 'completed' || liveQa.status === 'expired') return 'complete';
    if (liveQa.status === 'error') return 'failed';
    return null;
  }, [liveQa.status]);

  useEffect(() => {
    if (!bootstrap || persistInFlightRef.current || persistedStatus) return;
    if (liveQa.status !== 'completed' && liveQa.status !== 'expired' && liveQa.status !== 'error') return;
    const finalStatus: 'completed' | 'expired' | 'failed' =
      liveQa.status === 'error' ? 'failed' : liveQa.status === 'expired' ? 'expired' : 'completed';
    persistInFlightRef.current = true;

    void (async () => {
      try {
        setPersistError(null);
        const response = await fetch(`/api/qna/session/${bootstrap.qaSessionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: finalStatus,
            conversationId: bootstrap.conversationId,
            durationSeconds: liveQa.elapsedSeconds,
            turns: liveQa.turns,
            transcript: transcriptFromTurns(liveQa.turns),
            meta: {
              latency_ms_p50: liveQa.latency.p50Ms,
              latency_ms_p95: liveQa.latency.p95Ms,
              qa_cap_compliant: finalStatus !== 'expired',
              ws_opened: liveQa.diagnostics.wsOpened,
              ws_close_code: liveQa.diagnostics.wsCloseCode,
              ws_close_reason: liveQa.diagnostics.wsCloseReason,
              ws_error_count: liveQa.diagnostics.wsErrorCount,
            },
          }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to persist QA session.');
        }
        setPersistedStatus(finalStatus);
      } catch (caughtError) {
        setPersistError(
          caughtError instanceof Error ? caughtError.message : 'Failed to persist QA session.',
        );
      } finally {
        persistInFlightRef.current = false;
      }
    })();
  }, [
    bootstrap,
    liveQa.diagnostics.wsCloseCode,
    liveQa.diagnostics.wsCloseReason,
    liveQa.diagnostics.wsErrorCount,
    liveQa.diagnostics.wsOpened,
    liveQa.elapsedSeconds,
    liveQa.latency.p50Ms,
    liveQa.latency.p95Ms,
    liveQa.status,
    liveQa.turns,
    persistedStatus,
  ]);

  if (!liveQaEnabled) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
        <div
          className="rounded-2xl border p-6 max-w-lg"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Live VC Q&A Disabled
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Enable this feature with <code>NEXT_PUBLIC_ENABLE_LIVE_QA=true</code>.
          </p>
          <Link
            href={`/results/${runId}`}
            className="px-4 py-2 rounded-lg no-underline"
            style={{ color: 'white', backgroundColor: '#ff5941' }}
          >
            Back to Results
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto min-h-0 min-w-0 flex flex-col gap-4 pr-1">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Live VC Q&A (60s)
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Status: {qaSessionStatus ?? 'idle'} | Session ID: {bootstrap?.qaSessionId ?? 'pending'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/results/${runId}`}
            className="px-3 py-1.5 rounded-lg border no-underline text-sm"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Back to Results
          </Link>
          <Link
            href="/history"
            className="px-3 py-1.5 rounded-lg no-underline text-sm"
            style={{ backgroundColor: '#ff5941', color: 'white' }}
          >
            View History
          </Link>
        </div>
      </header>

      <section
        className="rounded-2xl border p-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
              Elapsed / Remaining
            </p>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {formatSeconds(liveQa.elapsedSeconds)} / {formatSeconds(liveQa.remainingSeconds)}
            </p>
          </div>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
              Latency
            </p>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              latest {Math.round(liveQa.latency.latestMs)}ms | p50 {Math.round(liveQa.latency.p50Ms)}ms | p95{' '}
              {Math.round(liveQa.latency.p95Ms)}ms
            </p>
          </div>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
              Controls
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void liveQa.startSession();
                }}
                disabled={
                  !bootstrap ||
                  isLoading ||
                  liveQa.status === 'connecting' ||
                  liveQa.status === 'active' ||
                  liveQa.status === 'error'
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
                style={{
                  backgroundColor: '#e63b26',
                  color: 'white',
                  opacity:
                    !bootstrap ||
                    isLoading ||
                    liveQa.status === 'connecting' ||
                    liveQa.status === 'active' ||
                    liveQa.status === 'error'
                      ? 0.6
                      : 1,
                }}
              >
                <Mic size={14} />
                Start
              </button>
              <button
                type="button"
                onClick={() => liveQa.stopSession('completed')}
                disabled={liveQa.status !== 'active'}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
                style={{
                  backgroundColor: '#334155',
                  color: 'white',
                  opacity: liveQa.status === 'active' ? 1 : 0.6,
                }}
              >
                <StopCircle size={14} />
                Stop
              </button>
              <button
                type="button"
                onClick={requestFreshSession}
                disabled={isLoading || liveQa.status === 'active' || liveQa.status === 'connecting'}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                  opacity:
                    isLoading || liveQa.status === 'active' || liveQa.status === 'connecting' ? 0.6 : 1,
                }}
              >
                <RefreshCw size={14} />
                New Session
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              WS close code: {liveQa.diagnostics.wsCloseCode ?? 'n/a'} | reason:{' '}
              {liveQa.diagnostics.wsCloseReason ?? 'n/a'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
            Preparing live QA session...
          </p>
        ) : null}
        {error ? (
          <p className="text-sm mt-3" style={{ color: '#ef4444' }}>
            {error}
          </p>
        ) : null}
        {liveQa.error ? (
          <p className="text-sm mt-3" style={{ color: '#ef4444' }}>
            {liveQa.error}
          </p>
        ) : null}
        {persistError ? (
          <p className="text-sm mt-3" style={{ color: '#ef4444' }}>
            {persistError}
          </p>
        ) : null}
        {persistedStatus === 'completed' || persistedStatus === 'expired' ? (
          <p className="text-sm mt-3" style={{ color: '#22c55e' }}>
            Session persisted.
          </p>
        ) : null}
        {persistedStatus === 'failed' ? (
          <p className="text-sm mt-3" style={{ color: '#f97316' }}>
            Failed session persisted for diagnostics.
          </p>
        ) : null}
      </section>

      <section
        className="rounded-2xl border p-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Live Transcript Timeline
          </h2>
        </div>
        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
          {liveQa.turns.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No turns captured yet. Start the session to begin streaming.
            </p>
          ) : (
            liveQa.turns.map((turn) => (
              <div
                key={turn.id}
                className="rounded-xl border p-3"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                  {turn.speaker}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {turn.text}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
