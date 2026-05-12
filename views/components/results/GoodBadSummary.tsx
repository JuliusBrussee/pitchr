'use client';

import { CheckCircle, AlertCircle } from 'lucide-react';

interface GoodBadSummaryProps {
  good?: string;
  bad?: string;
}

export function GoodBadSummary({ good, bad }: GoodBadSummaryProps) {
  if (!good && !bad) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        className="rounded-2xl border p-5 results-card-enter"
        style={{
          borderColor: 'rgba(34,197,94,0.18)',
          backgroundColor: 'rgba(34,197,94,0.04)',
          '--card-delay': '0ms',
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={15} style={{ color: '#22c55e' }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: '#22c55e' }}
          >
            Strengths
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {good ?? 'No strong positive signal was captured.'}
        </p>
      </div>
      <div
        className="rounded-2xl border p-5 results-card-enter"
        style={{
          borderColor: 'rgba(239,68,68,0.18)',
          backgroundColor: 'rgba(239,68,68,0.04)',
          '--card-delay': '60ms',
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={15} style={{ color: '#ef4444' }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: '#ef4444' }}
          >
            Weaknesses
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {bad ?? 'No primary weakness was captured.'}
        </p>
      </div>
    </div>
  );
}
