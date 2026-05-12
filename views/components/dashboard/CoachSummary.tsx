'use client';

import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import type { CoachSummary as CoachSummaryData } from '@/lib/analytics';

interface CoachSummaryProps {
  summary: CoachSummaryData;
  hasRuns: boolean;
}

export function CoachSummary({ summary, hasRuns }: CoachSummaryProps) {
  return (
    <div
      className="rounded-2xl border p-5 animate-fade-in-up dash-coach-card"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
        animationDelay: '0.1s',
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 dash-coach-icon"
          style={{
            background: 'linear-gradient(135deg, #ff5941, #ffaa33)',
          }}
        >
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-snug mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {summary.headline}
          </p>
          {hasRuns && (
            <>
              <p
                className="text-xs leading-relaxed mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {summary.detail}
              </p>
              <div
                className="flex items-center gap-3 text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {summary.recommendation}
                </span>
                <span className="flex items-center gap-1 cursor-pointer transition-colors hover:opacity-80" style={{ color: '#ff5941' }}>
                  Start drill
                  <ArrowRight size={12} />
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
