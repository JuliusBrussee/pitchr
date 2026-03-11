'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Component, useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Coins,
  Info,
  Mic,
  Radio,
  RefreshCw,
  Signal,
  Square,
  Timer,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useLiveQaAgent } from '@/hooks/useLiveQaAgent';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import type { PitchMode } from '@/types/pitch';
import type { CreateQASessionResponse } from '@/types/qna';
import type { QATurn } from '@/types/qna';

function modeAwareLabel(mode: PitchMode | undefined): string {
  if (mode === 'hackathon') return 'Judge';
  if (mode === 'final_year') return 'Examiner';
  return 'Investor';
}

function modeAwareQaTitle(mode: PitchMode | undefined): string {
  if (mode === 'hackathon') return 'Judge Q&A';
  if (mode === 'final_year') return 'Panel Q&A';
  return 'Investor Q&A';
}

function modeAwareQaDescription(mode: PitchMode | undefined): string {
  if (mode === 'hackathon') return 'Start the session and speak naturally. The AI judge will grill you on your pitch weaknesses.';
  if (mode === 'final_year') return 'Start the session and speak naturally. The AI examiner will grill you on your project weaknesses.';
  return 'Start the session and speak naturally. The AI investor will grill you on your pitch weaknesses.';
}

interface SessionBootstrap {
  qaSessionId: string;
  signedUrl: string;
  conversationId?: string;
  durationLimitSeconds: number;
  starterContext: string;
  qaBudget: {
    budgetSeconds: number | null;
    usedSeconds: number;
    remainingSeconds: number | null;
    maxSessionSeconds: number;
    gracePeriodSeconds: number;
  };
}

interface QaBudgetState {
  budgetSeconds: number | null;
  usedSeconds: number;
  remainingSeconds: number | null;
  maxSessionSeconds: number;
  gracePeriodSeconds: number;
  durationOptions: number[];
  defaultDurationSeconds: number;
  planId: string;
}

function formatSeconds(seconds: number): string {
  const abs = Math.abs(Math.round(seconds));
  const minutes = Math.floor(abs / 60);
  const rest = abs % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

function formatBudget(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (rest === 0) return `${minutes}m`;
  return `${minutes}m ${rest}s`;
}

function transcriptFromTurns(turns: QATurn[]): string {
  return turns.map((turn) => `${turn.speaker.toUpperCase()}: ${turn.text}`).join('\n');
}

function planLabel(planId: string): string {
  if (planId === 'day_pass') return 'Day Pass';
  if (planId === 'pro') return 'Pro';
  return 'Free';
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
  const progress = Math.min(elapsed / total, 1);
  const offset = circumference * (1 - progress);
  const isUrgent = remaining <= 10 && remaining > 0 && isActive;

  const ringClass = [
    'qa-ring-wrap',
    isActive ? 'qa-ring-active' : '',
    isUrgent ? 'qa-ring-urgent' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={ringClass}>
      {/* Ambient glow */}
      <div className="qa-ring-glow" />

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
          stroke="url(#qa-ring-gradient)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          className="qa-ring-progress"
          style={{ '--ring-offset': `${offset}` } as React.CSSProperties}
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
              x1={Math.round((100 + innerR * Math.cos(angle)) * 1000) / 1000}
              y1={Math.round((100 + innerR * Math.sin(angle)) * 1000) / 1000}
              x2={Math.round((100 + outerR * Math.cos(angle)) * 1000) / 1000}
              y2={Math.round((100 + outerR * Math.sin(angle)) * 1000) / 1000}
              stroke="var(--text-muted)"
              strokeWidth={isMajor ? 1.5 : 0.5}
              opacity={isMajor ? 0.4 : 0.15}
            />
          );
        })}
        <defs>
          <linearGradient id="qa-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5941" />
            <stop offset="50%" stopColor="#ffaa33" />
            <stop offset="100%" stopColor="#e63b26" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="qa-ring-center">
        <span className="qa-ring-time">
          {formatSeconds(Math.max(0, remaining))}
        </span>
        <span className="qa-ring-label">
          {status === 'idle' ? 'READY' : status === 'connecting' ? 'CONNECTING' : status === 'active' ? 'REMAINING' : status === 'completed' ? 'COMPLETE' : 'ERROR'}
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
            '--bar-index': String(i),
            '--bar-delay': `${i * 60}ms`,
            '--bar-height': `${Math.round((20 + Math.sin(i * 0.8) * 60) * 1000) / 1000}%`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ——— Status Pill ——— */
function StatusPill({ status }: { status: string }) {
  const isLive = status === 'active';
  const label = status === 'idle' ? 'Standby' : status === 'connecting' ? 'Connecting...' : status === 'active' ? 'LIVE' : status === 'completed' ? 'Session Complete' : 'Error';

  return (
    <div className={`qa-status-pill ${isLive ? 'qa-status-live' : ''}`}>
      {isLive ? <span className="qa-live-dot" /> : null}
      {status === 'connecting' ? <RefreshCw size={10} className="qa-spin" /> : null}
      <span>{label}</span>
    </div>
  );
}

/* ——— Chat Bubble ——— */
function ChatBubble({
  turn,
  index,
  mode,
}: {
  turn: QATurn;
  index: number;
  mode?: PitchMode;
}) {
  const isInvestor = turn.speaker === 'investor';
  const avatarLabel = mode === 'hackathon' ? 'JDG' : mode === 'final_year' ? 'EXM' : 'VC';

  return (
    <div
      className={`qa-bubble-wrap ${isInvestor ? 'qa-bubble-left' : 'qa-bubble-right'}`}
      style={{ '--bubble-delay': `${Math.min(index * 50, 300)}ms` } as React.CSSProperties}
    >
      <div className="qa-bubble-avatar">
        {isInvestor ? (
          <div className="qa-avatar-investor">{avatarLabel}</div>
        ) : (
          <div className="qa-avatar-founder">You</div>
        )}
      </div>
      <div className={`qa-bubble ${isInvestor ? 'qa-bubble-investor' : 'qa-bubble-founder'}`}>
        <div className="qa-bubble-speaker">
          {isInvestor ? modeAwareLabel(mode) : 'You'}
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

/* ——— Budget Pill (shown in top bar during session) ——— */
function BudgetPill({ budget, elapsedSeconds }: { budget: SessionBootstrap['qaBudget'] | null; elapsedSeconds: number }) {
  if (!budget || budget.remainingSeconds === null) return null;
  const liveRemaining = Math.max(0, budget.remainingSeconds - Math.round(elapsedSeconds));
  const isLow = liveRemaining < 120;

  return (
    <div className={`qa-budget-pill ${isLow ? 'qa-budget-pill-low' : ''}`}>
      <Clock size={11} />
      <span>Budget: {formatBudget(liveRemaining)} left</span>
    </div>
  );
}

/* ——— Duration Selector ——— */
function DurationSelector({
  options,
  selected,
  onSelect,
  maxSession,
  remaining,
}: {
  options: number[];
  selected: number;
  onSelect: (d: number) => void;
  maxSession: number;
  remaining: number | null;
}) {
  return (
    <div className="qa-duration-selector">
      <span className="qa-duration-label">Session length</span>
      <div className="qa-duration-options">
        {options.map((d) => {
          const disabled = d > maxSession || (remaining !== null && d > remaining);
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d)}
              className={`qa-duration-btn ${selected === d ? 'qa-duration-btn-active' : ''} ${disabled ? 'qa-duration-btn-disabled' : ''}`}
            >
              {formatSeconds(d)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ——— Pre-Session Gate ——— */
function PreSessionGate({
  budget,
  selectedDuration,
  onDurationChange,
  onStart,
  isLoading,
  error,
  runId,
}: {
  budget: QaBudgetState;
  selectedDuration: number;
  onDurationChange: (d: number) => void;
  onStart: () => void;
  isLoading: boolean;
  error: string | null;
  runId: string;
  mode?: PitchMode;
}) {
  const budgetPercent = budget.budgetSeconds
    ? Math.round(((budget.budgetSeconds - budget.usedSeconds) / budget.budgetSeconds) * 100)
    : 100;
  const remaining = budget.remainingSeconds;
  const isLow = remaining !== null && remaining < 120;
  const isExhausted = remaining !== null && remaining <= 0;

  return (
    <div className="qa-gate">
      <div className="qa-gate-card">
        {/* Header */}
        <div className="qa-gate-header">
          <div className="qa-gate-icon">
            <Radio size={18} style={{ color: '#ff5941' }} />
          </div>
          <div>
            <h1 className="qa-gate-title">{modeAwareQaTitle(mode)}</h1>
            <span className="qa-gate-plan">{planLabel(budget.planId)}</span>
          </div>
        </div>

        {/* Budget bar */}
        <div className="qa-gate-budget">
          <div className="qa-gate-budget-header">
            <span className="qa-gate-budget-label">Budget remaining</span>
            <span className={`qa-gate-budget-value ${isLow ? 'qa-gate-budget-low' : ''}`}>
              {remaining !== null ? formatBudget(remaining) : '\u221e'}{' '}
              {budget.budgetSeconds ? `/ ${formatBudget(budget.budgetSeconds)}` : ''}
            </span>
          </div>
          <div className="qa-gate-budget-track">
            <div
              className={`qa-gate-budget-fill ${isLow ? 'qa-gate-budget-fill-low' : ''} ${isExhausted ? 'qa-gate-budget-fill-empty' : ''}`}
              style={{ width: `${Math.max(budgetPercent, 2)}%` }}
            />
          </div>
        </div>

        {/* Credit cost tip */}
        {!isExhausted && (
          <div className="qa-gate-credit-tip">
            <Coins size={12} />
            <span>1 credit per session, regardless of length</span>
          </div>
        )}

        {/* Duration selector */}
        {!isExhausted && (
          <DurationSelector
            options={budget.durationOptions}
            selected={selectedDuration}
            onSelect={onDurationChange}
            maxSession={budget.maxSessionSeconds}
            remaining={remaining}
          />
        )}

        {/* Cost preview */}
        {!isExhausted && (
          <div className="qa-gate-cost">
            <Timer size={12} />
            <span>Will use up to {formatBudget(selectedDuration)} of your budget</span>
          </div>
        )}

        {/* Grace period tip */}
        {!isExhausted && (
          <div className="qa-gate-grace-tip">
            <Info size={11} />
            <span>Sessions under {budget.gracePeriodSeconds}s are free — no credit charged</span>
          </div>
        )}

        {/* Error message */}
        {error ? (
          <div className="qa-msg qa-msg-error">{error}</div>
        ) : null}

        {/* CTA */}
        {isExhausted ? (
          <div className="qa-gate-exhausted">
            <p className="qa-gate-exhausted-text">Q&A budget used up for this period</p>
            <Link
              href="/settings?tab=billing"
              className="qa-gate-upgrade-btn no-underline"
            >
              <Zap size={14} />
              Upgrade for more time
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={isLoading}
            className="qa-gate-start-btn"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="qa-spin" />
                Preparing session...
              </>
            ) : (
              <>
                <Mic size={16} />
                Start Session
              </>
            )}
          </button>
        )}

        {/* Low budget warning */}
        {isLow && !isExhausted && (
          <div className="qa-gate-warning">
            <span>Running low on Q&A time</span>
            <Link href="/settings?tab=billing" className="qa-gate-warning-link no-underline">
              Upgrade
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Back link */}
        <Link
          href={`/results/${runId}`}
          className="qa-gate-back no-underline"
        >
          <ArrowLeft size={12} />
          Back to Results
        </Link>
      </div>
    </div>
  );
}

/* ——— Post-Session Summary ——— */
function PostSessionSummary({
  turns,
  elapsedSeconds,
  budget,
  gracePeriodSeconds,
  runId,
  onNewSession,
}: {
  turns: QATurn[];
  elapsedSeconds: number;
  budget: SessionBootstrap['qaBudget'] | null;
  gracePeriodSeconds: number;
  runId: string;
  onNewSession: () => void;
}) {
  const isGrace = elapsedSeconds <= gracePeriodSeconds;
  const billable = isGrace ? 0 : Math.round(elapsedSeconds);
  const budgetAfter = budget?.remainingSeconds !== null && budget
    ? Math.max(0, budget.remainingSeconds - billable)
    : null;

  return (
    <div className="qa-session-summary">
      <div className="qa-summary-stats">
        <div className="qa-summary-stat">
          <span className="qa-summary-value">{turns.filter((t) => t.speaker === 'investor').length}</span>
          <span className="qa-summary-label">Questions</span>
        </div>
        <div className="qa-summary-stat">
          <span className="qa-summary-value">{turns.filter((t) => t.speaker === 'founder').length}</span>
          <span className="qa-summary-label">Responses</span>
        </div>
        <div className="qa-summary-stat">
          <span className="qa-summary-value">{formatSeconds(elapsedSeconds)}</span>
          <span className="qa-summary-label">Duration</span>
        </div>
      </div>
      <div className="qa-summary-billing">
        <div className="qa-summary-billing-row">
          <span>Time used</span>
          <span className="qa-summary-billing-value">
            {isGrace ? 'Free (grace period)' : formatBudget(billable)}
          </span>
        </div>
        <div className="qa-summary-billing-row">
          <span>Credit cost</span>
          <span className="qa-summary-billing-value">
            {isGrace ? (
              <span style={{ color: 'var(--color-success, #22c55e)' }}>No credit charged</span>
            ) : (
              '1 credit'
            )}
          </span>
        </div>
        {budgetAfter !== null && (
          <div className="qa-summary-billing-row">
            <span>Budget remaining</span>
            <span className={`qa-summary-billing-value ${budgetAfter < 120 ? 'qa-summary-billing-low' : ''}`}>
              {formatBudget(budgetAfter)}
            </span>
          </div>
        )}
      </div>
      <div className="qa-summary-actions">
        <button type="button" onClick={onNewSession} className="qa-summary-new-btn">
          <RefreshCw size={13} />
          New Session
        </button>
        <Link href={`/results/${runId}`} className="qa-summary-back-btn no-underline">
          Back to Results
        </Link>
      </div>
    </div>
  );
}

/* ——— Error Boundary ——— */
interface ErrorBoundaryProps {
  children: ReactNode;
  runId?: string;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class QaErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[QA Error Boundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <main className="qa-page">
          <div className="qa-ambient" />
          <div className="qa-grid-overlay" />
          <div className="qa-gate">
            <div className="qa-gate-card">
              <div className="qa-gate-header">
                <h1 className="qa-gate-title">Something went wrong</h1>
              </div>
              <div className="qa-msg qa-msg-error">
                {this.state.error?.message ?? 'An unexpected error occurred during the Q&A session.'}
              </div>
              <div className="qa-summary-actions">
                <button
                  type="button"
                  className="qa-summary-new-btn"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  <RefreshCw size={13} />
                  Try Again
                </button>
                <Link href={this.props.runId ? `/results/${this.props.runId}` : '/'} className="qa-summary-back-btn no-underline">
                  Back to Results
                </Link>
              </div>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

/* ——— Main Page (with error boundary) ——— */
export default function LiveQaPage() {
  const params = useParams<{ runId: string | string[] }>();
  const runIdParam = params?.runId;
  const runId = Array.isArray(runIdParam) ? (runIdParam[0] ?? '') : (runIdParam ?? '');

  return (
    <QaErrorBoundary runId={runId}>
      <LiveQaPageInner runId={runId} />
    </QaErrorBoundary>
  );
}

function LiveQaPageInner({ runId }: { runId: string }) {
  const [bootstrap, setBootstrap] = useState<SessionBootstrap | null>(null);
  const [bootstrapNonce, setBootstrapNonce] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persistedStatus, setPersistedStatus] = useState<'completed' | 'expired' | 'failed' | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [qaBudget, setQaBudget] = useState<QaBudgetState | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [budgetRetryCount, setBudgetRetryCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [runMode, setRunMode] = useState<PitchMode | undefined>(undefined);
  const bootstrapRequestKeyRef = useRef<string | null>(null);
  const bootstrapInFlightRef = useRef<string | null>(null);
  const bootstrapAbortRef = useRef<AbortController | null>(null);
  const persistInFlightRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const liveQa = useLiveQaAgent({
    signedUrl: bootstrap?.signedUrl ?? null,
    starterContext: bootstrap?.starterContext ?? '',
    durationLimitSeconds: bootstrap?.durationLimitSeconds ?? selectedDuration,
  });

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveQa.turns]);

  // Fetch run mode on mount
  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchEdge('pitch-run-detail', { cache: 'no-store', params: { runId } });
        if (!res.ok) return;
        const payload = await res.json();
        const run = payload.run ?? payload;
        if (!cancelled && run?.mode) setRunMode(run.mode as PitchMode);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [runId]);

  // Fetch Q&A budget on mount (and on retry)
  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    setBudgetLoading(true);
    setBudgetError(null);

    (async () => {
      try {
        const usageRes = await fetch('/api/billing/usage?resource=qa_seconds');
        if (!usageRes.ok) throw new Error('Failed to load usage data');
        const data = await usageRes.json();

        const billingRes = await fetch('/api/billing/subscription');
        if (!billingRes.ok) throw new Error('Failed to load subscription data');
        const billingData = await billingRes.json();

        if (cancelled) return;

        const limits = billingData.limits;
        const maxSession = limits?.maxQaSessionSeconds ?? 60;
        const options: number[] = [];
        if (maxSession >= 30) options.push(30);
        if (maxSession >= 60) options.push(60);
        if (maxSession >= 90) options.push(90);
        if (maxSession >= 120) options.push(120);
        if (maxSession >= 180) options.push(180);

        const planId = data.planId ?? billingData.subscription?.planId ?? 'free';
        const defaultDuration = planId === 'pro' ? 120 : 60;

        setQaBudget({
          budgetSeconds: data.limit ?? limits?.qaSecondsPerPeriod ?? 120,
          usedSeconds: data.used ?? 0,
          remainingSeconds: data.remaining ?? null,
          maxSessionSeconds: maxSession,
          gracePeriodSeconds: limits?.qaGracePeriodSeconds ?? 10,
          durationOptions: options,
          defaultDurationSeconds: Math.min(defaultDuration, maxSession),
          planId,
        });
        setSelectedDuration(Math.min(defaultDuration, maxSession));
      } catch (err) {
        if (!cancelled) {
          setBudgetError(err instanceof Error ? err.message : 'Failed to load Q&A budget');
        }
      } finally {
        if (!cancelled) setBudgetLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [runId, budgetRetryCount]);

  const requestFreshSession = useCallback(() => {
    bootstrapAbortRef.current?.abort();
    bootstrapAbortRef.current = null;
    bootstrapInFlightRef.current = null;
    setBootstrap(null);
    setError(null);
    setPersistError(null);
    setPersistedStatus(null);
    setSessionStarted(false);
    bootstrapRequestKeyRef.current = null;
    setBootstrapNonce((previous) => previous + 1);
  }, []);

  const initializeAndStart = useCallback(() => {
    if (!runId) return;
    const requestKey = `${runId}:${bootstrapNonce}:${selectedDuration}`;
    if (bootstrapInFlightRef.current === requestKey) return;

    const controller = new AbortController();
    bootstrapAbortRef.current?.abort();
    bootstrapAbortRef.current = controller;
    bootstrapInFlightRef.current = requestKey;

    setIsLoading(true);
    setError(null);
    setSessionStarted(true);

    void (async () => {
      try {
        const response = await fetchEdge('qna-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ runId, selectedDurationSeconds: selectedDuration }),
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
          qaBudget: payload.qaBudget,
        });
        setPersistedStatus(null);
        setPersistError(null);
        bootstrapRequestKeyRef.current = requestKey;
      } catch (caughtError) {
        if (controller.signal.aborted) return;
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to initialize live QA.');
        setSessionStarted(false);
      } finally {
        if (bootstrapAbortRef.current === controller && bootstrapInFlightRef.current === requestKey) {
          bootstrapInFlightRef.current = null;
          bootstrapAbortRef.current = null;
          setIsLoading(false);
        }
      }
    })();
  }, [bootstrapNonce, runId, selectedDuration]);

  // Auto-start the live QA agent when bootstrap is ready
  useEffect(() => {
    if (bootstrap && sessionStarted && liveQa.status === 'idle') {
      void liveQa.startSession();
    }
  }, [bootstrap, sessionStarted, liveQa.status, liveQa.startSession]);

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
  const canStop = liveQa.status === 'active';

  // Show pre-session gate if no session started yet
  if (!sessionStarted || (!bootstrap && !isLoading)) {
    if (budgetLoading) {
      return (
        <main className="qa-page">
          <div className="qa-ambient" />
          <div className="qa-grid-overlay" />
          <div className="qa-gate">
            <div className="qa-gate-card">
              <div className="qa-gate-loading">
                <RefreshCw size={20} className="qa-spin" style={{ color: '#ff5941' }} />
                <span>Loading Q&A budget...</span>
              </div>
            </div>
          </div>
        </main>
      );
    }

    if (budgetError) {
      return (
        <main className="qa-page">
          <div className="qa-ambient" />
          <div className="qa-grid-overlay" />
          <div className="qa-gate">
            <div className="qa-gate-card">
              <div className="qa-gate-header">
                <h1 className="qa-gate-title">Failed to load Q&A</h1>
              </div>
              <div className="qa-msg qa-msg-error">{budgetError}</div>
              <button
                type="button"
                className="qa-gate-start-btn"
                onClick={() => setBudgetRetryCount((c) => c + 1)}
              >
                <RefreshCw size={16} />
                Retry
              </button>
              <Link href={`/results/${runId}`} className="qa-gate-back no-underline">
                <ArrowLeft size={12} />
                Back to Results
              </Link>
            </div>
          </div>
        </main>
      );
    }

    if (qaBudget) {
      return (
        <main className="qa-page">
          <div className="qa-ambient" />
          <div className="qa-grid-overlay" />
          <PreSessionGate
            budget={qaBudget}
            selectedDuration={selectedDuration}
            onDurationChange={setSelectedDuration}
            onStart={initializeAndStart}
            isLoading={isLoading}
            error={error}
            runId={runId}
            mode={runMode}
          />
        </main>
      );
    }
  }

  /* ——— Active/Completed Session UI ——— */
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
          <StatusPill status={liveQa.status} />
        </div>

        <div className="qa-topbar-right">
          <BudgetPill budget={bootstrap?.qaBudget ?? null} elapsedSeconds={liveQa.elapsedSeconds} />
          <ConnectionQuality diagnostics={liveQa.diagnostics} />
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
              <h1 className="qa-sidebar-title">{modeAwareQaTitle(runMode)}</h1>
            </div>

            {/* Countdown Ring */}
            <CountdownRing
              elapsed={liveQa.elapsedSeconds}
              total={bootstrap?.durationLimitSeconds ?? selectedDuration}
              isActive={liveQa.isActive}
              status={liveQa.status}
            />

            {/* Waveform */}
            <WaveformVisualizer isActive={liveQa.isActive} />

            {/* Session time readout */}
            <div className="qa-time-readout">
              <div className="qa-time-col">
                <span className="qa-time-value">{formatSeconds(liveQa.elapsedSeconds)}</span>
                <span className="qa-time-label">Elapsed</span>
              </div>
              <div className="qa-time-divider" />
              <div className="qa-time-col">
                <span className="qa-time-value">
                  {formatSeconds(liveQa.remainingSeconds)}
                </span>
                <span className="qa-time-label">Remaining</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="qa-controls">
              {canStop ? (
                <button
                  type="button"
                  onClick={() => liveQa.stopSession('completed')}
                  className="qa-stop-btn"
                >
                  <span className="qa-stop-pulse" />
                  <Square size={16} />
                  <span>End Session</span>
                </button>
              ) : null}

              {(liveQa.status === 'connecting' || liveQa.status === 'active') && liveQa.turns.length === 0 ? (
                <div className="qa-say-ready">
                  <Mic size={14} className="qa-say-ready-icon" />
                  <span>Say <strong>&quot;I&apos;m ready for the Q&A&quot;</strong> to begin</span>
                </div>
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
                WS {liveQa.diagnostics.wsCloseCode}{liveQa.diagnostics.wsCloseReason ? ` \u2014 ${liveQa.diagnostics.wsCloseReason}` : ''}
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
                  {modeAwareQaDescription(runMode)}
                </p>
              </div>
            ) : (
              <div className="qa-bubbles">
                {liveQa.turns.map((turn, i) => (
                  <ChatBubble key={turn.id} turn={turn} index={i} mode={runMode} />
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
            <PostSessionSummary
              turns={liveQa.turns}
              elapsedSeconds={liveQa.elapsedSeconds}
              budget={bootstrap?.qaBudget ?? null}
              gracePeriodSeconds={bootstrap?.qaBudget?.gracePeriodSeconds ?? 10}
              runId={runId}
              onNewSession={requestFreshSession}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
