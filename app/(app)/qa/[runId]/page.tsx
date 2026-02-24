'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Radio,
  RefreshCw,
  Signal,
  Square,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useLiveQaAgent } from '@/hooks/useLiveQaAgent';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import type { CreateQASessionResponse } from '@/types/qna';
import type { QATurn } from '@/types/qna';

interface SessionBootstrap {
  qaSessionId: string;
  signedUrl: string;
  conversationId?: string;
  durationLimitSeconds: number;
  starterContext: string;
}

function formatSeconds(seconds: number): string {
  const abs = Math.abs(Math.round(seconds));
  const minutes = Math.floor(abs / 60);
  const rest = abs % 60;
  const sign = seconds < 0 ? '+' : '';
  return `${sign}${minutes}:${rest.toString().padStart(2, '0')}`;
}

function transcriptFromTurns(turns: QATurn[]): string {
  return turns.map((turn) => `${turn.speaker.toUpperCase()}: ${turn.text}`).join('\n');
}

/* ——— Countdown Ring ——— */
function CountdownRing({
  elapsed,
  total,
  isActive,
  status,
}: {
  elapsed: number;
  total: number;
  isActive: boolean;
  status: string;
}) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const remaining = total - elapsed;
  const isOvertime = remaining < 0 && isActive;
  const progress = Math.min(elapsed / total, 1);
  const offset = circumference * (1 - progress);
  const isUrgent = remaining <= 10 && remaining > 0 && isActive;

  // In overtime, pulse the ring fully filled
  const overtimeOffset = 0;

  const ringClass = [
    'qa-ring-wrap',
    isActive ? 'qa-ring-active' : '',
    isUrgent ? 'qa-ring-urgent' : '',
    isOvertime ? 'qa-ring-overtime' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={ringClass}>
      {/* Ambient glow */}
      <div className="qa-ring-glow" />

      {/* Overtime badge */}
      {isOvertime ? (
        <div className="qa-overtime-badge">OVERTIME</div>
      ) : null}

      <svg
        viewBox="0 0 200 200"
        className="qa-ring-svg"
      >
        {/* Track */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="4"
          opacity="0.3"
        />
        {/* Progress arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={isOvertime ? 'url(#qa-ring-overtime-gradient)' : 'url(#qa-ring-gradient)'}
          strokeWidth={isOvertime ? 6 : 5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isOvertime ? overtimeOffset : offset}
          transform="rotate(-90 100 100)"
          className={`qa-ring-progress ${isOvertime ? 'qa-ring-progress-overtime' : ''}`}
          style={{ '--ring-offset': `${isOvertime ? overtimeOffset : offset}` } as React.CSSProperties}
        />
        {/* Tick marks */}
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const isMajor = i % 5 === 0;
          const innerR = isMajor ? 78 : 82;
          const outerR = 86;
          return (
            <line
              key={i}
              x1={100 + innerR * Math.cos(angle)}
              y1={100 + innerR * Math.sin(angle)}
              x2={100 + outerR * Math.cos(angle)}
              y2={100 + outerR * Math.sin(angle)}
              stroke={isOvertime ? '#ef4444' : 'var(--text-muted)'}
              strokeWidth={isMajor ? 1.5 : 0.5}
              opacity={isOvertime ? (isMajor ? 0.6 : 0.25) : (isMajor ? 0.4 : 0.15)}
            />
          );
        })}
        <defs>
          <linearGradient id="qa-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5941" />
            <stop offset="50%" stopColor="#ffaa33" />
            <stop offset="100%" stopColor="#e63b26" />
          </linearGradient>
          <linearGradient id="qa-ring-overtime-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="qa-ring-center">
        <span className={`qa-ring-time ${isOvertime ? 'qa-ring-time-overtime' : ''}`}>
          {isOvertime ? formatSeconds(remaining) : formatSeconds(Math.max(0, remaining))}
        </span>
        <span className={`qa-ring-label ${isOvertime ? 'qa-ring-label-overtime' : ''}`}>
          {isOvertime ? 'OVERTIME' : status === 'idle' ? 'READY' : status === 'connecting' ? 'CONNECTING' : status === 'active' ? 'REMAINING' : status === 'completed' ? 'COMPLETE' : status === 'expired' ? 'EXPIRED' : 'ERROR'}
        </span>
      </div>
    </div>
  );
}

/* ——— Audio Waveform Visualizer ——— */
function WaveformVisualizer({ isActive }: { isActive: boolean }) {
  return (
    <div className="qa-waveform">
      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={i}
          className={`qa-waveform-bar ${isActive ? 'qa-waveform-bar-active' : ''}`}
          style={{
            '--bar-index': i,
            '--bar-delay': `${i * 60}ms`,
            '--bar-height': `${20 + Math.sin(i * 0.8) * 60}%`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ——— Latency Badge ——— */
function LatencyBadge({ label, value }: { label: string; value: number }) {
  const rounded = Math.round(value);
  const quality = rounded < 300 ? 'good' : rounded < 600 ? 'fair' : 'poor';

  return (
    <div className={`qa-latency-badge qa-latency-${quality}`}>
      <span className="qa-latency-dot" />
      <span className="qa-latency-label">{label}</span>
      <span className="qa-latency-value">{rounded}ms</span>
    </div>
  );
}

/* ——— Status Pill ——— */
function StatusPill({ status, isOvertime }: { status: string; isOvertime: boolean }) {
  const isLive = status === 'active';
  const label = isOvertime ? 'OVERTIME' : status === 'idle' ? 'Standby' : status === 'connecting' ? 'Connecting...' : status === 'active' ? 'LIVE' : status === 'completed' ? 'Session Complete' : status === 'expired' ? 'Time Expired' : 'Error';

  return (
    <div className={`qa-status-pill ${isLive ? 'qa-status-live' : ''} ${isOvertime ? 'qa-status-overtime' : ''}`}>
      {isLive ? <span className={`qa-live-dot ${isOvertime ? 'qa-live-dot-overtime' : ''}`} /> : null}
      {status === 'connecting' ? <RefreshCw size={10} className="qa-spin" /> : null}
      <span>{label}</span>
    </div>
  );
}

/* ——— Chat Bubble ——— */
function ChatBubble({
  turn,
  index,
}: {
  turn: QATurn;
  index: number;
}) {
  const isInvestor = turn.speaker === 'investor';

  return (
    <div
      className={`qa-bubble-wrap ${isInvestor ? 'qa-bubble-left' : 'qa-bubble-right'}`}
      style={{ '--bubble-delay': `${Math.min(index * 50, 300)}ms` } as React.CSSProperties}
    >
      <div className="qa-bubble-avatar">
        {isInvestor ? (
          <div className="qa-avatar-investor">VC</div>
        ) : (
          <div className="qa-avatar-founder">You</div>
        )}
      </div>
      <div className={`qa-bubble ${isInvestor ? 'qa-bubble-investor' : 'qa-bubble-founder'}`}>
        <div className="qa-bubble-speaker">
          {isInvestor ? 'Investor' : 'You'}
        </div>
        <div className="qa-bubble-text">{turn.text}</div>
      </div>
    </div>
  );
}

/* ——— Connection Quality Indicator ——— */
function ConnectionQuality({ diagnostics }: { diagnostics: { wsOpened: boolean; wsErrorCount: number } }) {
  const quality = !diagnostics.wsOpened ? 'disconnected' : diagnostics.wsErrorCount > 0 ? 'degraded' : 'excellent';

  return (
    <div className={`qa-connection qa-connection-${quality}`}>
      {quality === 'disconnected' ? <WifiOff size={12} /> : quality === 'degraded' ? <Wifi size={12} /> : <Signal size={12} />}
      <span>{quality === 'disconnected' ? 'Offline' : quality === 'degraded' ? 'Unstable' : 'Connected'}</span>
    </div>
  );
}

/* ——— Main Page ——— */
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
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const liveQa = useLiveQaAgent({
    signedUrl: bootstrap?.signedUrl ?? null,
    starterContext: bootstrap?.starterContext ?? '',
    durationLimitSeconds: bootstrap?.durationLimitSeconds ?? 60,
  });

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveQa.turns]);

  const requestFreshSession = useCallback(() => {
    bootstrapAbortRef.current?.abort();
    bootstrapAbortRef.current = null;
    bootstrapInFlightRef.current = null;
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
        const response = await fetchEdge('qna-session', {
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
  }, [bootstrapNonce, liveQaEnabled, runId]);

  useEffect(() => {
    if (!bootstrap || persistInFlightRef.current || persistedStatus) return;
    if (liveQa.status !== 'completed' && liveQa.status !== 'expired' && liveQa.status !== 'error') return;
    const finalStatus: 'completed' | 'expired' | 'failed' =
      liveQa.status === 'error' ? 'failed' : liveQa.status === 'expired' ? 'expired' : 'completed';
    persistInFlightRef.current = true;

    void (async () => {
      try {
        setPersistError(null);
        const response = await fetchEdge('qna-session-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          params: { qaSessionId: bootstrap.qaSessionId },
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

  const isSessionDone = liveQa.status === 'completed' || liveQa.status === 'expired';
  const canStart = !!bootstrap && !isLoading && liveQa.status !== 'connecting' && liveQa.status !== 'active' && liveQa.status !== 'error';
  const canStop = liveQa.status === 'active';
  const canReset = !isLoading && liveQa.status !== 'active' && liveQa.status !== 'connecting';

  /* ——— Disabled State ——— */
  if (!liveQaEnabled) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
        <div className="qa-disabled-card">
          <div className="qa-disabled-icon">
            <MicOff size={32} />
          </div>
          <h1 className="qa-disabled-title">Live VC Q&A Disabled</h1>
          <p className="qa-disabled-desc">
            Enable this feature with <code>NEXT_PUBLIC_ENABLE_LIVE_QA=true</code>.
          </p>
          <Link href={`/results/${runId}`} className="qa-btn qa-btn-primary no-underline">
            Back to Results
          </Link>
        </div>
      </main>
    );
  }

  /* ——— Main UI ——— */
  return (
    <main className="qa-page">
      {/* Background ambient effects */}
      <div className="qa-ambient" />
      <div className="qa-grid-overlay" />

      {/* Top Navigation Bar */}
      <header className="qa-topbar">
        <div className="qa-topbar-left">
          <Link
            href={`/results/${runId}`}
            className="qa-back-btn no-underline"
          >
            <ArrowLeft size={14} />
            <span>Results</span>
          </Link>
          <div className="qa-topbar-divider" />
          <StatusPill status={liveQa.status} isOvertime={liveQa.remainingSeconds < 0 && liveQa.isActive} />
        </div>

        <div className="qa-topbar-right">
          <ConnectionQuality diagnostics={liveQa.diagnostics} />
          <div className="qa-topbar-divider" />
          <div className="qa-latency-group">
            <LatencyBadge label="p50" value={liveQa.latency.p50Ms} />
            <LatencyBadge label="p95" value={liveQa.latency.p95Ms} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="qa-content">
        {/* Left Panel: Controls + Timer */}
        <aside className="qa-sidebar">
          <div className="qa-sidebar-inner">
            {/* Title */}
            <div className="qa-sidebar-header">
              <Radio size={14} style={{ color: '#ff5941' }} />
              <h1 className="qa-sidebar-title">Investor Q&A</h1>
            </div>

            {/* Countdown Ring */}
            <CountdownRing
              elapsed={liveQa.elapsedSeconds}
              total={bootstrap?.durationLimitSeconds ?? 60}
              isActive={liveQa.isActive}
              status={liveQa.status}
            />

            {/* Waveform */}
            <WaveformVisualizer isActive={liveQa.isActive} />

            {/* Session time readout */}
            <div className={`qa-time-readout ${liveQa.remainingSeconds < 0 && liveQa.isActive ? 'qa-time-readout-overtime' : ''}`}>
              <div className="qa-time-col">
                <span className="qa-time-value">{formatSeconds(liveQa.elapsedSeconds)}</span>
                <span className="qa-time-label">Elapsed</span>
              </div>
              <div className="qa-time-divider" />
              <div className="qa-time-col">
                <span className={`qa-time-value ${liveQa.remainingSeconds < 0 ? 'qa-time-value-overtime' : ''}`}>
                  {formatSeconds(liveQa.remainingSeconds)}
                </span>
                <span className="qa-time-label">
                  {liveQa.remainingSeconds < 0 ? 'Overtime' : 'Remaining'}
                </span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="qa-controls">
              {!canStop ? (
                <button
                  type="button"
                  onClick={() => { void liveQa.startSession(); }}
                  disabled={!canStart}
                  className="qa-mic-btn"
                >
                  <span className="qa-mic-btn-glow" />
                  <Mic size={20} />
                  <span>{liveQa.status === 'connecting' ? 'Connecting...' : isSessionDone ? 'Session Ended' : 'Start Session'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => liveQa.stopSession('completed')}
                  className="qa-stop-btn"
                >
                  <span className="qa-stop-pulse" />
                  <Square size={16} />
                  <span>End Session</span>
                </button>
              )}

              {(liveQa.status === 'connecting' || liveQa.status === 'active') && liveQa.turns.length === 0 ? (
                <div className="qa-say-ready">
                  <Mic size={14} className="qa-say-ready-icon" />
                  <span>Say <strong>&quot;I&apos;m ready for the Q&A&quot;</strong> to begin</span>
                </div>
              ) : null}

              {canReset ? (
                <button
                  type="button"
                  onClick={requestFreshSession}
                  className="qa-reset-btn"
                >
                  <RefreshCw size={13} />
                  <span>New Session</span>
                </button>
              ) : null}
            </div>

            {/* Error/Status Messages */}
            <div className="qa-messages">
              {isLoading ? (
                <div className="qa-msg qa-msg-info">
                  <RefreshCw size={12} className="qa-spin" />
                  <span>Preparing session...</span>
                </div>
              ) : null}
              {error ? (
                <div className="qa-msg qa-msg-error">{error}</div>
              ) : null}
              {liveQa.error ? (
                <div className="qa-msg qa-msg-error">{liveQa.error}</div>
              ) : null}
              {persistError ? (
                <div className="qa-msg qa-msg-error">{persistError}</div>
              ) : null}
              {persistedStatus === 'completed' || persistedStatus === 'expired' ? (
                <div className="qa-msg qa-msg-success">
                  <Zap size={12} />
                  <span>Session saved successfully</span>
                </div>
              ) : null}
              {persistedStatus === 'failed' ? (
                <div className="qa-msg qa-msg-warn">Failed session logged for diagnostics</div>
              ) : null}
            </div>

            {/* Debug info */}
            {liveQa.diagnostics.wsCloseCode !== null ? (
              <div className="qa-debug">
                WS {liveQa.diagnostics.wsCloseCode}{liveQa.diagnostics.wsCloseReason ? ` — ${liveQa.diagnostics.wsCloseReason}` : ''}
              </div>
            ) : null}
          </div>
        </aside>

        {/* Right Panel: Transcript */}
        <section className="qa-transcript-panel">
          <div className="qa-transcript-header">
            <h2 className="qa-transcript-title">Live Transcript</h2>
            <span className="qa-turn-count">
              {liveQa.turns.length} {liveQa.turns.length === 1 ? 'turn' : 'turns'}
            </span>
          </div>

          <div className="qa-transcript-body">
            {liveQa.turns.length === 0 ? (
              <div className="qa-empty-state">
                <div className="qa-empty-icon">
                  <Mic size={28} />
                </div>
                <p className="qa-empty-title">Ready for Q&A</p>
                <p className="qa-empty-desc">
                  Start the session and speak naturally. The AI investor will grill you on your pitch weaknesses.
                </p>
              </div>
            ) : (
              <div className="qa-bubbles">
                {liveQa.turns.map((turn, i) => (
                  <ChatBubble key={turn.id} turn={turn} index={i} />
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>

          {/* Active session indicator at bottom */}
          {liveQa.isActive ? (
            <div className="qa-listening-bar">
              <span className="qa-listening-dot" />
              <span className="qa-listening-dot" />
              <span className="qa-listening-dot" />
              <span className="qa-listening-text">Listening...</span>
            </div>
          ) : null}

          {/* Session complete summary */}
          {isSessionDone && liveQa.turns.length > 0 ? (
            <div className="qa-session-summary">
              <div className="qa-summary-stats">
                <div className="qa-summary-stat">
                  <span className="qa-summary-value">{liveQa.turns.filter((t) => t.speaker === 'investor').length}</span>
                  <span className="qa-summary-label">Questions</span>
                </div>
                <div className="qa-summary-stat">
                  <span className="qa-summary-value">{liveQa.turns.filter((t) => t.speaker === 'founder').length}</span>
                  <span className="qa-summary-label">Responses</span>
                </div>
                <div className="qa-summary-stat">
                  <span className="qa-summary-value">{formatSeconds(liveQa.elapsedSeconds)}</span>
                  <span className="qa-summary-label">Duration</span>
                </div>
                <div className="qa-summary-stat">
                  <span className="qa-summary-value">{Math.round(liveQa.latency.p50Ms)}ms</span>
                  <span className="qa-summary-label">Avg Latency</span>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
