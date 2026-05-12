'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { HistoricalLink } from '@/types/analysis-v2';

interface PreviousRunsLinksProps {
  links?: HistoricalLink[];
}

export function PreviousRunsLinks({ links }: PreviousRunsLinksProps) {
  const entries = links ?? [];
  if (entries.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-5 results-card-enter"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        '--card-delay': '0ms',
      } as React.CSSProperties}
    >
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        Previous Runs
      </h3>
      <div className="space-y-1">
        {entries.map((entry) => {
          const isPositive = entry.overall_delta >= 0;
          const color = isPositive ? '#22c55e' : '#ef4444';

          return (
            <Link
              key={entry.run_id}
              href={`/results/${entry.run_id}`}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 no-underline transition-colors duration-150 hover:bg-[var(--bg-surface-hover)]"
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="text-sm">
                {new Date(entry.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              <span
                className="flex items-center gap-1 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md"
                style={{ color, backgroundColor: `${color}14` }}
              >
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isPositive ? '+' : ''}
                {entry.overall_delta}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
