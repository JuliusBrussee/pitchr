'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X,
  Timer,
  Clock,
  MessageSquare,
  Copy,
  Check,
  Mic,
  FileText,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { RecordingPlayer } from '@/views/components/RecordingPlayer';
import { TagPill } from '@/views/components/ui/TagPill';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import {
  getScoreColor,
  getScoreBgColor,
  getScoreBandLabel,
  getModeColor,
  getModeBgColor,
  getModeLabel,
  getRubricColor,
} from '@/views/components/ui/colors';
import type { FeedbackOutput } from '@/types/analysis-v2';
import type { Run } from '@/types/pitch';

/* ——— Score Ring SVG ——— */

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({ score, color }: { score: number; color: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const offset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="rdm-score-ring"
          style={{ '--ring-offset': offset } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          / 100
        </span>
      </div>
    </div>
  );
}

/* ——— Helpers ——— */

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
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ——— Component ——— */

interface RunDetailModalProps {
  runId: string | null;
  onClose: () => void;
}

export function RunDetailModal({ runId, onClose }: RunDetailModalProps) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Fetch run data
  useEffect(() => {
    if (!runId) {
      setRun(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetchEdge('pitch-run-detail', { params: { runId } });
        if (!res.ok) throw new Error('Failed to load run');
        const payload = (await res.json()) as { run?: Run };
        if (cancelled) return;
        setRun(payload.run ?? null);
      } catch {
        if (cancelled) return;
        setError('Could not load session details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [runId]);

  // Escape key
  useEffect(() => {
    if (!runId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!runId) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [runId]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  const feedback = useMemo<FeedbackOutput | null>(
    () => (run?.outputs?.feedback ?? run?.analysis ?? null) as FeedbackOutput | null,
    [run],
  );

  const scoreColor = feedback ? getScoreColor(feedback.overall_score) : '#6b7280';
  const bandLabel = feedback ? getScoreBandLabel(feedback.overall_score) : '';

  if (!runId) return null;

  const isOpen = !!runId && !isClosing;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 ${isOpen ? 'rdm-backdrop-enter' : 'rdm-backdrop-exit'}`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border pointer-events-auto ${
            isOpen ? 'rdm-panel-enter' : 'rdm-panel-exit'
          }`}
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Accent stripe at top based on score */}
          {feedback && (
            <div
              className="h-1 rounded-t-2xl"
              style={{
                background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}88 60%, transparent)`,
              }}
            />
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X size={16} />
          </button>

          <div className="p-6 flex flex-col gap-5">
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div
                  className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--border-color)', borderTopColor: '#ff5941' }}
                />
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertTriangle size={28} style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
              </div>
            )}

            {/* Content */}
            {run && feedback && !loading && (
              <>
                {/* Header: mode, date, input type */}
                <div className="flex items-center gap-2 flex-wrap pr-10">
                  <TagPill
                    label={getModeLabel(run.mode)}
                    color={getModeColor(run.mode)}
                    bgColor={getModeBgColor(run.mode)}
                  />
                  {run.inputType === 'audio' ? (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Mic size={11} /> Audio
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <FileText size={11} /> Text
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(run.createdAt)}
                  </span>
                </div>

                {/* Score overview */}
                <div
                  className="flex items-center gap-6 p-5 rounded-xl border"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                >
                  <ScoreRing score={feedback.overall_score} color={scoreColor} />
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
                      style={{ color: scoreColor, backgroundColor: getScoreBgColor(feedback.overall_score) }}
                    >
                      {bandLabel}
                    </span>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {feedback.one_line_verdict}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <MiniStat icon={<Timer size={11} />} label="WPM" value={String(feedback.delivery_metrics.wpm)} />
                      <MiniStat icon={<Clock size={11} />} label="Duration" value={formatDuration(feedback.delivery_metrics.duration_seconds)} />
                      <MiniStat icon={<MessageSquare size={11} />} label="Fillers" value={String(feedback.delivery_metrics.filler_count)} />
                    </div>
                  </div>
                </div>

                {/* Recording */}
                {run.audioUrl && (
                  <RecordingPlayer recordingUrl={run.audioUrl} />
                )}

                {/* Rubric breakdown */}
                <Section title="Score Breakdown">
                  <div className="flex flex-col gap-3">
                    {feedback.rubric_breakdown.map((item, i) => {
                      const pct = Math.max(0, Math.min(100, (item.score / item.max_score) * 100));
                      const rubricColor = getRubricColor(item.category);
                      return (
                        <div
                          key={item.category}
                          className="rdm-rubric-row"
                          style={{ '--rdm-stagger': `${i * 80}ms` } as React.CSSProperties}
                        >
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {formatCategory(item.category)}
                            </span>
                            <span className="tabular-nums text-xs font-semibold" style={{ color: rubricColor }}>
                              {item.score}/{item.max_score}
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
                            <div
                              className="h-full rounded-full rdm-bar-fill"
                              style={{
                                '--bar-width': `${pct}%`,
                                '--bar-color': rubricColor,
                                '--rdm-stagger': `${i * 80 + 200}ms`,
                              } as React.CSSProperties}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {item.rationale}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Section>

                {/* Top fixes */}
                <Section title="Top Fixes">
                  <div className="flex flex-col gap-2.5">
                    {feedback.top_fixes.map((fix) => (
                      <div
                        key={fix.rank}
                        className="rounded-xl border p-3"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(255, 89, 65, 0.12)', color: '#ff5941' }}
                          >
                            {fix.rank}
                          </span>
                          <span className="text-xs font-medium" style={{ color: getRubricColor(fix.category) }}>
                            {formatCategory(fix.category)}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
                            style={{
                              color: fix.impact === 'high' ? '#ef4444' : fix.impact === 'medium' ? '#eab308' : 'var(--text-muted)',
                              backgroundColor: fix.impact === 'high' ? 'rgba(239,68,68,0.1)' : fix.impact === 'medium' ? 'rgba(234,179,8,0.1)' : 'var(--bg-surface)',
                            }}
                          >
                            {fix.impact}
                          </span>
                        </div>
                        <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                          {fix.issue}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {fix.fix}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* Rewrite script */}
                <Section
                  title="Rewrite Script"
                  actions={
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(feedback.rewrite_script);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1200);
                      }}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors"
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

                {/* Footer link */}
                <div className="flex justify-center pt-1 pb-1">
                  <a
                    href={`/results/${run.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border no-underline transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-color)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ff5941';
                      e.currentTarget.style.borderColor = 'rgba(255, 89, 65, 0.3)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 89, 65, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Open Full Results
                    <ExternalLink size={11} />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ——— Sub-components ——— */

function Section({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}
