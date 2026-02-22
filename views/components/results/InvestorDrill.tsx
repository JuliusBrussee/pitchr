'use client';

import { Timer } from 'lucide-react';
import Link from 'next/link';
import type { OneMinuteQAPack } from '@/types/analysis-v2';

interface InvestorDrillProps {
  qaPack: OneMinuteQAPack;
  runId: string;
  liveQaEnabled: boolean;
}

export function InvestorDrill({ qaPack, runId, liveQaEnabled }: InvestorDrillProps) {
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

      {liveQaEnabled ? (
        <Link
          href={`/qa/${runId}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg no-underline text-sm font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ color: 'white', backgroundColor: '#e63b26' }}
        >
          <Timer size={14} />
          Start Live VC Q&amp;A (60s)
        </Link>
      ) : null}
    </div>
  );
}
