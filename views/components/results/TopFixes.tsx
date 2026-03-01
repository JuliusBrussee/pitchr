'use client';

import { ArrowRight } from 'lucide-react';
import type { Fix, FixImpact } from '@/types/analysis-v2';
import { SourceRefChips } from '@/views/components/results/SourceRefChips';

interface TopFixesProps {
  fixes: Fix[];
}

const IMPACT_STYLES: Record<FixImpact, { color: string; bg: string; label: string }> = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', label: 'High' },
  medium: { color: '#ffaa33', bg: 'rgba(255,170,51,0.10)', label: 'Med' },
  low: { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', label: 'Low' },
};

export function TopFixes({ fixes }: TopFixesProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      {fixes.map((fix, index) => {
        const impact = IMPACT_STYLES[fix.impact] ?? IMPACT_STYLES.low;

        return (
          <div
            key={fix.rank}
            className="rounded-xl border p-4 results-fix-card results-card-enter"
            style={{
              borderColor: 'var(--border-color)',
              borderLeftWidth: '3px',
              borderLeftColor: impact.color,
              '--card-delay': `${index * 80}ms`,
            } as React.CSSProperties}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: impact.bg, color: impact.color }}
              >
                {fix.rank}
              </span>
              <span
                className="text-xs font-medium capitalize"
                style={{ color: 'var(--text-muted)' }}
              >
                {fix.category.replace(/_/g, ' ')}
              </span>
              <span
                className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                style={{ color: impact.color, backgroundColor: impact.bg }}
              >
                {impact.label}
              </span>
            </div>
            <p className="text-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>
              {fix.issue}
            </p>
            <div className="flex items-start gap-1.5">
              <ArrowRight size={12} className="mt-1 shrink-0" style={{ color: '#22c55e' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {fix.fix}
              </p>
            </div>
            <SourceRefChips refs={fix.evidence_refs} />
          </div>
        );
      })}
    </div>
  );
}
