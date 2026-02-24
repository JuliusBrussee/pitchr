'use client';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { CategoryProgress, SkillStatus } from '@/lib/progress';
import { getRubricColor } from '@/views/components/ui/colors';

interface ProgressKanbanProps {
  categories: CategoryProgress[];
}

const BAND_COLUMNS = [
  { id: 'needs-work', label: 'Needs Work', color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
  { id: 'getting-there', label: 'Getting There', color: '#eab308', bg: 'rgba(234,179,8,0.06)' },
  { id: 'solid', label: 'Solid', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)' },
  { id: 'investor-ready', label: 'Investor-Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.06)' },
];

const STATUS_CONFIG: Record<SkillStatus, { icon: typeof ArrowUp; color: string; label: string }> = {
  improving: { icon: ArrowUp, color: '#22c55e', label: 'Improving' },
  regressing: { icon: ArrowDown, color: '#ef4444', label: 'Regressing' },
  stagnant: { icon: Minus, color: '#6b7280', label: 'Stagnant' },
};

function MiniSparkline({ history }: { history: { score: number }[] }) {
  if (history.length < 2) return null;

  const recent = history.slice(-8);
  const max = 20;
  const min = 0;
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const padding = 2;

  const points = recent.map((h, i) => {
    const x = padding + (i / (recent.length - 1)) * (width - padding * 2);
    const y = height - padding - ((h.score - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const isUp = recent[recent.length - 1].score >= recent[0].score;
  const color = isUp ? '#22c55e' : '#ef4444';

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProgressKanban({ categories }: ProgressKanbanProps) {
  return (
    <div className="grid grid-cols-4 gap-3" style={{ minHeight: 200 }}>
      {BAND_COLUMNS.map((column) => {
        const cardsInColumn = categories.filter((c) => c.band === column.id);

        return (
          <div key={column.id} className="flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center gap-2 px-2 pb-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {column.label}
              </span>
              <span
                className="text-[10px] font-medium ml-auto"
                style={{ color: 'var(--text-muted)' }}
              >
                {cardsInColumn.length}
              </span>
            </div>

            {/* Column body */}
            <div
              className="flex-1 rounded-xl border p-2 flex flex-col gap-2 min-h-[120px] transition-colors duration-200"
              style={{
                backgroundColor: column.bg,
                borderColor: 'var(--border-color)',
              }}
            >
              {cardsInColumn.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <span
                    className="text-[10px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No skills here
                  </span>
                </div>
              ) : (
                cardsInColumn.map((cat) => {
                  const statusCfg = STATUS_CONFIG[cat.status];
                  const StatusIcon = statusCfg.icon;

                  return (
                    <div
                      key={cat.id}
                      className="rounded-lg border p-3 transition-all duration-200"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-color)',
                        borderLeftWidth: 3,
                        borderLeftColor: getRubricColor(cat.id),
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {cat.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <StatusIcon size={10} style={{ color: statusCfg.color }} />
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: statusCfg.color }}
                          >
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {cat.currentAvg.toFixed(1)}/{cat.maxScore}
                        </span>
                        <MiniSparkline history={cat.history} />
                      </div>

                      {cat.delta !== 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: cat.delta > 0 ? '#22c55e' : '#ef4444' }}
                          >
                            {cat.delta > 0 ? '+' : ''}{cat.delta.toFixed(1)} since first session
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
