'use client';

import { useMemo, useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import {
  formatReviewBulletLine,
  formatReviewBullets,
  getTranscriptPreview,
} from '@/lib/review/formatters';
import type { Run } from '@/types/pitch';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ReviewPage() {
  const params = useParams<{ runId: string | string[] }>();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;

  const [run, setRun] = useState<Run | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [expandedTranscript, setExpandedTranscript] = useState(false);

  useEffect(() => {
    if (!runId) {
      setRun(null);
      setCheckedStorage(true);
      return;
    }
    fetch(`/api/pitch/run/${runId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setRun({
            id: data.id,
            createdAt: data.created_at,
            mode: data.mode,
            inputType: data.input_type,
            transcript: data.transcript,
            audioUrl: data.audio_url ?? undefined,
            analysis: data.analysis,
            overallScore: data.overall_score,
          });
        } else {
          setRun(null);
        }
        setCheckedStorage(true);
      })
      .catch(() => {
        setRun(null);
        setCheckedStorage(true);
      });
  }, [runId]);

  const bullets = useMemo(
    () => (run ? formatReviewBullets(run.analysis.top_fixes, 5) : []),
    [run],
  );

  const transcriptPreview = useMemo(() => {
    if (!run) return { preview: '', isTruncated: false };
    return getTranscriptPreview(run.transcript, 760);
  }, [run]);

  if (!checkedStorage) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
        <p style={{ color: 'var(--text-muted)' }}>Loading review...</p>
      </main>
    );
  }

  if (!run) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
        <section
          className="max-w-md rounded-2xl border p-6 text-center"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)',
            backdropFilter: 'blur(var(--blur-strength))',
            WebkitBackdropFilter: 'blur(var(--blur-strength))',
          }}
        >
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Review Not Found
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            This run is missing from local history. Start another pitch to generate review feedback.
          </p>
          <Link
            href="/session"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg no-underline font-medium"
            style={{ color: 'white', backgroundColor: '#ff5941' }}
          >
            Run a Pitch
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-5 pr-1">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/session"
            className="p-2 rounded-xl border transition-all duration-200 no-underline flex items-center justify-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Pitch Review
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {formatDate(run.createdAt)} | {run.mode === 'elevator' ? 'Elevator Pitch' : 'VC Pitch'}
            </p>
            {run.fallback && (
              <span
                className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: 'rgba(255,170,51,0.16)', color: '#ffaa33' }}
              >
                <Flag size={12} />
                Fallback feedback
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/session"
            className="px-3 py-2 rounded-lg border text-sm no-underline"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
          >
            Run Again
          </Link>
          <Link
            href={`/results/${run.id}`}
            className="px-3 py-2 rounded-lg text-sm no-underline font-semibold"
            style={{ color: 'white', backgroundColor: '#ff5941' }}
          >
            See Full Results
          </Link>
        </div>
      </header>

      <SectionCard
        title="Top 5 Improvements"
        subtitle="Focused, actionable changes to improve investor clarity and confidence."
      >
        <ol className="flex flex-col gap-3">
          {bullets.map((bullet) => (
            <li
              key={`${bullet.rank}-${bullet.category}`}
              className="rounded-xl border p-3 text-sm leading-relaxed"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <p style={{ color: 'var(--text-primary)' }}>
                <span
                  className="inline-flex items-center justify-center w-6 h-6 mr-2 rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'rgba(255,89,65,0.16)', color: '#ff5941' }}
                >
                  {bullet.rank}
                </span>
                {formatReviewBulletLine(bullet)}
              </p>
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        title="Transcript Context"
        subtitle="Use this as reference while applying the bullet-point improvements."
      >
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--text-secondary)' }}
        >
          {expandedTranscript ? run.transcript : transcriptPreview.preview}
        </p>
        {transcriptPreview.isTruncated && (
          <button
            type="button"
            onClick={() => setExpandedTranscript((prev) => !prev)}
            className="mt-3 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            {expandedTranscript ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expandedTranscript ? 'Show less' : 'Show full transcript'}
          </button>
        )}
      </SectionCard>
    </main>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-4 md:p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <header className="mb-3">
        <h2 className="text-sm uppercase tracking-wide font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      </header>
      {children}
    </section>
  );
}

