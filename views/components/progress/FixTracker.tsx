'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { TrackedFix } from '@/lib/progress';
import { CATEGORY_LABELS } from '@/lib/progress';
import { getRubricColor } from '@/views/components/ui/colors';

/* ——— Types ——— */

interface FixTrackerProps {
  fixes: TrackedFix[];
}

type FixFilter = 'all' | 'open' | 'resolved';

/* ——— Config ——— */

const IMPACT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.14)', label: 'HIGH' },
  medium: { color: '#ffaa33', bg: 'rgba(255,170,51,0.10)', label: 'MED' },
  low: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', label: 'LOW' },
};

const IMPACT_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/* ——— Resolution Progress ——— */

function ResolutionProgress({ resolved, total }: { resolved: number; total: number }) {
  const pct = total > 0 ? (resolved / total) * 100 : 0;
  const color = pct >= 75 ? '#22c55e' : pct >= 40 ? '#ffaa33' : '#ff5941';

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--border-color)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out animate-bar-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}90, ${color})`,
            boxShadow: pct > 0 ? `0 0 8px ${color}30` : 'none',
          }}
        />
      </div>
      <span
        className="text-[11px] font-bold tabular-nums shrink-0"
        style={{ color }}
      >
        {resolved}/{total}
      </span>
    </div>
  );
}

/* ——— Filter Tabs ——— */

function FilterTabs({
  filters,
  active,
  onChange,
}: {
  filters: { value: FixFilter; label: string; count: number }[];
  active: FixFilter;
  onChange: (v: FixFilter) => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg p-0.5 gap-0.5"
      style={{ backgroundColor: 'var(--bg-surface-hover)' }}
    >
      {filters.map((f) => {
        const isActive = active === f.value;
        return (
          <button
            key={f.value}
            onClick={() => onChange(f.value)}
            className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: isActive
                ? '0 1px 3px rgba(0,0,0,0.15), 0 0 0 1px var(--border-color)'
                : 'none',
            }}
          >
            {f.label}
            <span className="ml-1 tabular-nums" style={{ opacity: isActive ? 0.6 : 0.4 }}>
              {f.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ——— Fix Item ——— */

function FixItem({
  fix,
  isExpanded,
  onToggle,
  index,
}: {
  fix: TrackedFix;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const impact = IMPACT_CONFIG[fix.impact] ?? IMPACT_CONFIG.low;
  const catColor = getRubricColor(fix.category);
  const isHigh = !fix.resolved && fix.impact === 'high';
  const isRecurring = !fix.resolved && fix.occurrences > 2;

  return (
    <div
      className="group rounded-xl border transition-all duration-200 cursor-pointer animate-fade-in-up"
      style={{
        borderColor: isHigh ? `${catColor}22` : 'var(--border-color)',
        borderLeftWidth: 4,
        borderLeftColor: fix.resolved ? '#22c55e50' : catColor,
        backgroundColor: isHigh ? `${catColor}05` : undefined,
        animationDelay: `${index * 30}ms`,
        animationFillMode: 'both',
      }}
      onClick={onToggle}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-3.5 py-3">
        {/* Status icon */}
        <div className="shrink-0">
          {fix.resolved ? (
            <CheckCircle2 size={17} style={{ color: '#22c55e' }} />
          ) : (
            <Circle
              size={17}
              className="transition-opacity duration-150"
              style={{
                color: 'var(--text-muted)',
                opacity: 0.4,
              }}
            />
          )}
        </div>

        {/* Issue text */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[13px] leading-snug ${
              fix.resolved ? 'line-through opacity-40' : ''
            }`}
            style={{ color: 'var(--text-primary)' }}
          >
            {fix.issue}
          </p>
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Recurring indicator */}
          {isRecurring && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold tabular-nums"
              style={{ color: '#f97316' }}
              title={`Appeared in ${fix.occurrences} sessions`}
            >
              <AlertTriangle size={10} />
              {fix.occurrences}x
            </span>
          )}

          {/* Category badge */}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{
              color: catColor,
              backgroundColor: `${catColor}14`,
              border: `1px solid ${catColor}1a`,
            }}
          >
            {CATEGORY_LABELS[fix.category] ?? fix.category}
          </span>

          {/* Priority badge */}
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: impact.color,
              backgroundColor: impact.bg,
            }}
          >
            {impact.label}
          </span>

          {/* Expand indicator */}
          <ChevronRight
            size={13}
            className="shrink-0 transition-transform duration-200"
            style={{
              color: 'var(--text-muted)',
              opacity: 0.3,
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </div>

      {/* Expandable details — CSS grid height animation */}
      <div
        className="transition-[grid-template-rows] duration-200 ease-out"
        style={{
          display: 'grid',
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
        }}
      >
        <div className="overflow-hidden">
          <div
            className="px-3.5 pb-3.5"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            {/* Fix suggestion */}
            <div className="flex items-start gap-2 mt-3">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-px"
                style={{ backgroundColor: 'rgba(34,197,94,0.10)' }}
              >
                <ArrowRight size={11} style={{ color: '#22c55e' }} />
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {fix.fix}
              </p>
            </div>

            {/* Metadata */}
            <div
              className="flex items-center gap-1.5 mt-3 flex-wrap"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="text-[10px]">
                First seen {formatDate(fix.firstSeen)}
              </span>
              <span className="text-[10px] opacity-30">{'·'}</span>
              <span className="text-[10px]">
                Last seen {formatDate(fix.lastSeen)}
              </span>
              {fix.occurrences > 1 && (
                <>
                  <span className="text-[10px] opacity-30">{'·'}</span>
                  <span className="text-[10px]">
                    {fix.occurrences} session{fix.occurrences !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ——— Main Component ——— */

export function FixTracker({ fixes }: FixTrackerProps) {
  const [filter, setFilter] = useState<FixFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openCount = fixes.filter((f) => !f.resolved).length;
  const resolvedCount = fixes.filter((f) => f.resolved).length;

  // Smart sort: unresolved first, then HIGH → MED → LOW, then by occurrence count
  const filtered = useMemo(() => {
    const list = fixes.filter((f) => {
      if (filter === 'open') return !f.resolved;
      if (filter === 'resolved') return f.resolved;
      return true;
    });

    list.sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      const ai = IMPACT_ORDER[a.impact] ?? 2;
      const bi = IMPACT_ORDER[b.impact] ?? 2;
      if (ai !== bi) return ai - bi;
      return b.occurrences - a.occurrences;
    });

    return list;
  }, [fixes, filter]);

  const filterOptions: { value: FixFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: fixes.length },
    { value: 'open', label: 'Open', count: openCount },
    { value: 'resolved', label: 'Resolved', count: resolvedCount },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Fix Tracker
          </span>
          {openCount > 0 ? (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
              style={{
                backgroundColor: 'rgba(255,89,65,0.10)',
                color: '#ff5941',
              }}
            >
              {openCount} open
            </span>
          ) : resolvedCount > 0 ? (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                backgroundColor: 'rgba(34,197,94,0.10)',
                color: '#22c55e',
              }}
            >
              <Sparkles size={9} />
              All clear
            </span>
          ) : null}
        </div>

        <FilterTabs
          filters={filterOptions}
          active={filter}
          onChange={setFilter}
        />
      </div>

      {/* Resolution progress */}
      {fixes.length > 0 && (
        <div className="mb-4">
          <ResolutionProgress resolved={resolvedCount} total={fixes.length} />
        </div>
      )}

      {/* Fix list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          {filter === 'resolved' ? (
            <>
              <CheckCircle2
                size={20}
                style={{ color: 'var(--text-muted)', opacity: 0.3 }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No resolved fixes yet — keep practicing!
              </span>
            </>
          ) : filter === 'open' ? (
            <>
              <Sparkles
                size={20}
                style={{ color: '#22c55e', opacity: 0.5 }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                All fixes resolved. Nice work.
              </span>
            </>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No fixes tracked yet.
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((fix, index) => (
            <FixItem
              key={fix.id}
              fix={fix}
              isExpanded={expandedId === fix.id}
              onToggle={() =>
                setExpandedId(expandedId === fix.id ? null : fix.id)
              }
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
