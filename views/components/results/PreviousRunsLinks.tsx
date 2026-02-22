'use client';

import Link from 'next/link';
import type { HistoricalLink } from '@/types/analysis-v2';

interface PreviousRunsLinksProps {
  links?: HistoricalLink[];
}

function deltaColor(delta: number): string {
  if (delta >= 0) return '#22c55e';
  return '#ef4444';
}

export function PreviousRunsLinks({ links }: PreviousRunsLinksProps) {
  const entries = links ?? [];
  if (entries.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-4 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <h3 className="text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
        Previous Runs
      </h3>
      <div className="space-y-2">
        {entries.map((entry) => (
          <Link
            key={entry.run_id}
            href={`/results/${entry.run_id}`}
            className="flex items-center justify-between rounded-xl border px-3 py-2 no-underline"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {new Date(entry.created_at).toLocaleString()}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{
                color: deltaColor(entry.overall_delta),
                borderColor: `${deltaColor(entry.overall_delta)}66`,
                backgroundColor: `${deltaColor(entry.overall_delta)}14`,
              }}
            >
              {entry.overall_delta >= 0 ? '+' : ''}
              {entry.overall_delta}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
