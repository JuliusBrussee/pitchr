'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Timer, Zap } from 'lucide-react';
import Link from 'next/link';
import type { OneMinuteQAPack } from '@/types/analysis-v2';

interface InvestorDrillProps {
  qaPack: OneMinuteQAPack;
  runId: string;
}

function formatBudget(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (rest === 0) return `${minutes}m`;
  return `${minutes}m ${rest}s`;
}

export function InvestorDrill({ qaPack, runId }: InvestorDrillProps) {
  const [budgetRemaining, setBudgetRemaining] = useState<number | null>(null);
  const [isExhausted, setIsExhausted] = useState(false);
  const [isLow, setIsLow] = useState(false);

  useEffect(() => {
    fetch('/api/billing/usage?resource=qa_seconds')
      .then((r) => r.json())
      .then((data) => {
        const remaining = data.remaining ?? null;
        setBudgetRemaining(remaining);
        setIsExhausted(remaining !== null && remaining <= 0);
        setIsLow(remaining !== null && remaining > 0 && remaining < 120);
      })
      .catch(() => {
        // Budget fetch is best-effort — Q&A drill still works without it
      });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,89,65,0.12)' }}
        >
          <Timer size={14} style={{ color: '#ff5941' }} />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {qaPack.total_target_seconds}s target
          <span className="mx-1.5 opacity-40">&middot;</span>
          {qaPack.timing_plan_seconds.join('s / ')}s per question
        </span>
      </div>

      {qaPack.suggested_answers.map((entry, index) => (
        <div
          key={`${entry.question}-${index}`}
          className="rounded-xl border p-4 results-card-enter"
          style={{
            borderColor: 'var(--border-color)',
            '--card-delay': `${index * 60}ms`,
          } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,89,65,0.12)', color: '#ff5941' }}
            >
              {index + 1}
            </span>
            <span
              className="text-[10px] uppercase tracking-wider tabular-nums"
              style={{ color: 'var(--text-muted)' }}
            >
              {entry.target_seconds}s
            </span>
          </div>
          <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {entry.question}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {entry.answer}
          </p>
        </div>
      ))}

      {isExhausted ? (
        <div className="flex flex-col gap-2">
          <div
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)' }}
          >
            <Clock size={14} />
            Q&A budget used up
          </div>
          <Link
            href="/settings?tab=billing"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg no-underline text-xs font-medium transition-transform hover:scale-[1.02]"
            style={{ color: '#ff5941', backgroundColor: 'rgba(255,89,65,0.08)' }}
          >
            <Zap size={12} />
            Upgrade for more time
            <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <Link
          href={`/qa/${runId}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg no-underline text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ color: 'white', backgroundColor: '#e63b26' }}
        >
          <Timer size={14} />
          Start Live Q&A
          {budgetRemaining !== null && (
            <span
              className="text-xs opacity-80 ml-1"
              style={{ color: isLow ? '#fbbf24' : 'rgba(255,255,255,0.7)' }}
            >
              &middot; {formatBudget(budgetRemaining)} left
            </span>
          )}
        </Link>
      )}
    </div>
  );
}
