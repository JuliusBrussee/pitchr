'use client';

import { useMemo, useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { FeedbackOutput, OneMinuteQAPack } from '@/types/analysis-v2';
import type { Run } from '@/types/pitch';

type ReviewTab = 'feedback' | 'qa';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fallbackQa(feedback: FeedbackOutput): OneMinuteQAPack {
  const questions = feedback.top_fixes.slice(0, 3).map((fix) => `How will you address ${fix.category}?`);
  const q1 = questions[0] ?? 'What is your strongest proof point right now?';
  const q2 = questions[1] ?? 'Why are you differentiated in this market?';
  const q3 = questions[2] ?? 'What milestones does this raise fund?';
  return {
    total_target_seconds: 60,
    timing_plan_seconds: [20, 20, 20],
    investor_questions: [q1, q2, q3],
    suggested_answers: [
      { question: q1, answer: feedback.top_fixes[0]?.fix ?? '', target_seconds: 20 },
      { question: q2, answer: feedback.top_fixes[1]?.fix ?? '', target_seconds: 20 },
      { question: q3, answer: feedback.top_fixes[2]?.fix ?? '', target_seconds: 20 },
    ],
    focus_tags: feedback.top_fixes.slice(0, 3).map((fix) => fix.category),
    red_flags_to_avoid: [
      'Avoid generic claims without proof.',
      'Avoid vague fundraising ask language.',
      'Avoid overly long answers.',
    ],
  };
}

export default function ReviewPage() {
  const params = useParams<{ runId: string | string[] }>();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReviewTab>('feedback');

  useEffect(() => {
    if (!runId) {
      setRun(null);
      setLoading(false);
      return;
    }
    fetch(`/api/pitch/run/${runId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload?.run) {
          setRun(payload.run as Run);
        } else if (payload?.id) {
          setRun(payload as Run);
        } else {
          setRun(null);
        }
      })
      .catch(() => setRun(null))
      .finally(() => setLoading(false));
  }, [runId]);

  const feedback = useMemo<FeedbackOutput | null>(
    () => run?.outputs?.feedback ?? run?.analysis ?? null,
    [run],
  );
  const qaPack = useMemo<OneMinuteQAPack | null>(
    () => (run?.outputs?.qa_1min ? run.outputs.qa_1min : feedback ? fallbackQa(feedback) : null),
    [feedback, run],
  );

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
        <p style={{ color: 'var(--text-muted)' }}>Loading review...</p>
      </main>
    );
  }

  if (run && run.status !== 'complete') {
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
            Analysis In Progress
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {run.status === 'failed'
              ? run.error ?? 'Analysis failed for this run.'
              : 'This run has not completed analysis yet.'}
          </p>
          <Link
            href={`/results/${run.id}`}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg no-underline font-medium"
            style={{ color: 'white', backgroundColor: '#ff5941' }}
          >
            Open Results
          </Link>
        </section>
      </main>
    );
  }

  if (!run || !feedback) {
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
            This run is not available in history.
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
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Pitch Review
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {formatDate(run.createdAt)} | {run.mode === 'elevator' ? 'Elevator Pitch' : 'VC Pitch'}
            </p>
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

      <section className="rounded-2xl border p-2" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab('feedback')}
            className="px-3 py-2 rounded-xl text-sm font-medium"
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
            className="px-3 py-2 rounded-xl text-sm font-medium"
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
          <SectionCard title="Top 5 Improvements" subtitle="Prioritized actions to increase investor confidence.">
            <ol className="flex flex-col gap-3">
              {feedback.top_fixes.map((fix: FeedbackOutput['top_fixes'][number]) => (
                <li key={`${fix.rank}-${fix.category}`} className="rounded-xl border p-3 text-sm leading-relaxed" style={{ borderColor: 'var(--border-color)' }}>
                  <p style={{ color: 'var(--text-primary)' }}>
                    <strong>#{fix.rank}</strong> [{fix.category}] {fix.issue}
                  </p>
                  <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {fix.fix}
                  </p>
                </li>
              ))}
            </ol>
          </SectionCard>

          <SectionCard title="Transcript Context" subtitle="Reference the exact wording while applying fixes.">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {run.transcript}
            </p>
          </SectionCard>
        </>
      ) : (
        <SectionCard title="1-Minute Drill" subtitle="Three investor questions with timed answers.">
          {qaPack ? (
            <div className="flex flex-col gap-3">
              {qaPack.suggested_answers.map((entry, index) => (
                <div key={`${entry.question}-${index}`} className="rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Q{index + 1}: {entry.question}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {entry.answer}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No Q&A data available.</p>
          )}
        </SectionCard>
      )}
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
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
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
