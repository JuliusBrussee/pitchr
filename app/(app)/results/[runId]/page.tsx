'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  Timer,
  Lightbulb,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { getRun } from '@/models/run';
import type { Run } from '@/types/pitch';
import type { FixImpact, RubricCategory } from '@/types/analysis';

function getScoreBand(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Investor-Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' };
  if (score >= 60) return { label: 'Solid', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' };
  if (score >= 40) return { label: 'Getting There', color: '#ffaa33', bg: 'rgba(255,170,51,0.12)' };
  return { label: 'Needs Work', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
}

function getCategoryLabel(category: RubricCategory): string {
  switch (category) {
    case 'structure':
      return 'Structure';
    case 'clarity':
      return 'Clarity';
    case 'evidence':
      return 'Evidence';
    case 'market':
      return 'Market';
    case 'delivery':
      return 'Delivery';
    default:
      return category;
  }
}

function getImpactStyle(impact: FixImpact): { color: string; bg: string } {
  if (impact === 'high') return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
  if (impact === 'medium') return { color: '#ffaa33', bg: 'rgba(255,170,51,0.12)' };
  return { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
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

export default function ResultsPage() {
  const params = useParams<{ runId: string | string[] }>();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;

  const [run, setRun] = useState<Run | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!runId) {
      setRun(null);
      setCheckedStorage(true);
      return;
    }
    const nextRun = getRun(runId);
    setRun(nextRun);
    setCheckedStorage(true);
  }, [runId]);

  const analysis = run?.analysis;
  const scoreBand = useMemo(() => (analysis ? getScoreBand(analysis.overall_score) : null), [analysis]);

  if (!checkedStorage) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
        <p style={{ color: 'var(--text-muted)' }}>Loading result...</p>
      </main>
    );
  }

  if (!run || !analysis || !scoreBand) {
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
            Result Not Found
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            We could not find that run in local history. Start a new session to generate analysis.
          </p>
          <Link
            href="/session"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg no-underline font-medium"
            style={{
              color: 'white',
              backgroundColor: '#ff5941',
            }}
          >
            Run a Pitch
          </Link>
        </div>
      </main>
    );
  }

  const totalFillers = analysis.delivery_metrics.filler_words.reduce((sum, item) => sum + item.count, 0);

  function copyRewrite() {
    if (!analysis) return;
    void navigator.clipboard.writeText(analysis.rewrite_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-5 pr-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="p-2 rounded-xl border transition-all duration-200 no-underline flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Pitch Results
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDate(run.createdAt)} • {run.mode === 'elevator' ? 'Elevator' : 'VC Pitch'}
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
      </div>

      <section
        className="rounded-2xl border p-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-1">
            <div
              className="w-28 h-28 rounded-full border flex flex-col items-center justify-center"
              style={{ borderColor: scoreBand.color, backgroundColor: scoreBand.bg }}
            >
              <span className="text-3xl font-bold" style={{ color: scoreBand.color }}>
                {analysis.overall_score}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                /100
              </span>
            </div>
            <p
              className="inline-flex text-xs font-semibold px-2 py-1 rounded-full mt-3"
              style={{ color: scoreBand.color, backgroundColor: scoreBand.bg }}
            >
              {scoreBand.label}
            </p>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-sm uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Verdict
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {analysis.one_line_verdict}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <StatPill icon={<Timer size={12} />} label="WPM" value={String(analysis.delivery_metrics.wpm)} />
              <StatPill icon={<Clock size={12} />} label="Duration" value={formatDuration(analysis.delivery_metrics.duration_seconds)} />
              <StatPill icon={<MessageSquare size={12} />} label="Fillers" value={String(totalFillers)} />
              <StatPill icon={<BarChart3 size={12} />} label="Repeats" value={String(analysis.delivery_metrics.repeated_phrases.length)} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Rubric Breakdown">
          <div className="flex flex-col gap-3">
            {analysis.rubric_breakdown.map((item) => {
              const pct = Math.max(0, Math.min(100, (item.score / item.max_score) * 100));
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-primary)' }}>{getCategoryLabel(item.category)}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {item.score}/{item.max_score}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--border-color)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#ff5941' }} />
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
            {analysis.top_fixes.map((fix) => {
              const impactStyle = getImpactStyle(fix.impact);
              return (
                <div key={fix.rank} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      #{fix.rank} • {getCategoryLabel(fix.category)}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                      style={{ color: impactStyle.color, backgroundColor: impactStyle.bg }}
                    >
                      {fix.impact}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    <strong>Issue:</strong> {fix.issue}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <strong>Fix:</strong> {fix.fix}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card
          title="Rewrite"
          actions={
            <button
              onClick={copyRewrite}
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          }
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
            {analysis.rewrite_script}
          </p>
        </Card>

        <Card title="Delivery Metrics">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Within time limit</p>
              <p style={{ color: analysis.delivery_metrics.within_time_limit ? '#22c55e' : '#ef4444' }}>
                {analysis.delivery_metrics.within_time_limit ? 'Yes' : 'No'}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Filler words</p>
              {analysis.delivery_metrics.filler_words.length === 0 ? (
                <p style={{ color: 'var(--text-primary)' }}>None detected</p>
              ) : (
                <ul className="flex flex-wrap gap-2 mt-1">
                  {analysis.delivery_metrics.filler_words.map((item) => (
                    <li
                      key={item.word}
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ color: '#ffaa33', backgroundColor: 'rgba(255,170,51,0.12)' }}
                    >
                      {item.word}: {item.count}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)' }}>Repeated phrases</p>
              {analysis.delivery_metrics.repeated_phrases.length === 0 ? (
                <p style={{ color: 'var(--text-primary)' }}>None detected</p>
              ) : (
                <ul className="flex flex-wrap gap-2 mt-1">
                  {analysis.delivery_metrics.repeated_phrases.map((item) => (
                    <li
                      key={item.phrase}
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)' }}
                    >
                      {item.phrase}: {item.count}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </section>

      <Card title="Transcript" icon={<Lightbulb size={14} />}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
          {run.transcript}
        </p>
      </Card>
    </main>
  );
}

function Card({
  title,
  children,
  actions,
  icon,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-4"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          {icon}
          {title}
        </h3>
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
