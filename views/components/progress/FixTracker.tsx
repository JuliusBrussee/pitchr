'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, AlertTriangle, ArrowRight } from 'lucide-react';
import type { TrackedFix } from '@/lib/progress';
import { CATEGORY_LABELS } from '@/lib/progress';
import { getRubricColor } from '@/views/components/ui/colors';

interface FixTrackerProps {
  fixes: TrackedFix[];
}

type FixFilter = 'all' | 'open' | 'resolved';

const IMPACT_STYLES: Record<string, { color: string; bg: string; label: string; bold?: boolean }> = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'HIGH', bold: true },
  medium: { color: '#ffaa33', bg: 'rgba(255,170,51,0.10)', label: 'MED' },
  low: { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', label: 'Low' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function FixTracker({ fixes }: FixTrackerProps) {
  const [filter, setFilter] = useState<FixFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openCount = fixes.filter((f) => !f.resolved).length;
  const resolvedCount = fixes.filter((f) => f.resolved).length;

  const filtered = fixes.filter((f) => {
    if (filter === 'open') return !f.resolved;
    if (filter === 'resolved') return f.resolved;
    return true;
  });

  const filters: { value: FixFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: fixes.length },
    { value: 'open', label: 'Open', count: openCount },
    { value: 'resolved', label: 'Resolved', count: resolvedCount },
  ];

  return (
    <div>
      {/* Header with filter pills */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Fix Tracker
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: 'rgba(239,68,68,0.10)',
              color: '#ef4444',
            }}
          >
            {openCount} open
          </span>
        </div>

        <div
          className="flex rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {filters.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="px-2.5 py-1 text-[11px] font-medium transition-colors duration-150"
                style={{
                  backgroundColor: active ? 'var(--bg-surface-hover)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {f.label} ({f.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Fix list */}
      {filtered.length === 0 ? (
        <div
          className="flex items-center justify-center py-8"
          style={{ color: 'var(--text-muted)' }}
        >
          <span className="text-xs">
            {filter === 'resolved'
              ? 'No resolved fixes yet. Keep practicing!'
              : 'No fixes tracked yet.'}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((fix, index) => {
            const impact = IMPACT_STYLES[fix.impact] ?? IMPACT_STYLES.low;
            const isExpanded = expandedId === fix.id;
            const catColor = getRubricColor(fix.category);

            return (
              <div
                key={fix.id}
                className="rounded-lg border transition-all duration-200 cursor-pointer animate-fade-in-up"
                style={{
                  borderColor: !fix.resolved && fix.impact === 'high' ? `${catColor}20` : 'var(--border-color)',
                  borderLeftWidth: 3,
                  borderLeftColor: fix.resolved ? '#22c55e' : catColor,
                  backgroundColor: !fix.resolved && fix.impact === 'high' ? `${catColor}04` : undefined,
                  animationDelay: `${index * 40}ms`,
                  animationFillMode: 'both',
                }}
                onClick={() => setExpandedId(isExpanded ? null : fix.id)}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Status icon */}
                  {fix.resolved ? (
                    <CheckCircle2 size={16} style={{ color: '#22c55e' }} className="shrink-0" />
                  ) : (
                    <Circle size={16} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                  )}

                  {/* Issue text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs leading-snug ${fix.resolved ? 'line-through opacity-60' : ''}`}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fix.issue}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-[10px] font-medium capitalize px-1.5 py-0.5 rounded"
                      style={{ color: catColor, backgroundColor: `${catColor}1a` }}
                    >
                      {CATEGORY_LABELS[fix.category] ?? fix.category}
                    </span>
                    <span
                      className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${impact.bold ? 'font-bold' : 'font-semibold'}`}
                      style={{ color: impact.color, backgroundColor: impact.bg }}
                    >
                      {impact.label}
                    </span>
                    {fix.occurrences > 1 && (
                      <span
                        className="text-[10px] font-medium flex items-center gap-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <AlertTriangle size={9} />
                        {fix.occurrences}x
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div
                    className="px-3 pb-3 pt-0"
                    style={{ borderTop: '1px solid var(--border-color)' }}
                  >
                    <div className="flex items-start gap-1.5 mt-2.5">
                      <ArrowRight size={12} className="mt-0.5 shrink-0" style={{ color: '#22c55e' }} />
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {fix.fix}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        First seen: {formatDate(fix.firstSeen)}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Last seen: {formatDate(fix.lastSeen)}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Appeared in {fix.occurrences} session{fix.occurrences !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
