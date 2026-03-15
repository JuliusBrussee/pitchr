'use client';

import { Check, Circle } from 'lucide-react';
import type { MetricValues } from '@/hooks/useSessionState';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { LiveRubricCategoryScore } from '@/lib/liveFeedback';

interface MobileMetricsTabProps {
  metrics: MetricValues;
  checklist: RealtimeChecklistItemState[];
  liveRubric?: LiveRubricCategoryScore[];
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RUBRIC_LABELS: Record<string, string> = {
  structure: 'Structure',
  clarity: 'Clarity',
  evidence: 'Evidence',
  market: 'Market',
  delivery: 'Delivery',
};

function scoreColor(score20: number): string {
  if (score20 >= 14) return '#22c55e';
  if (score20 >= 10) return '#f59e0b';
  return '#ef4444';
}

export function MobileMetricsTab({ metrics, checklist, liveRubric }: MobileMetricsTabProps) {
  const stats = [
    { label: 'Words / min', value: String(metrics.wpm), color: '#22c55e' },
    { label: 'Fillers', value: String(metrics.fillerWords), color: '#f59e0b' },
    { label: 'Duration', value: formatDuration(metrics.durationSecs), color: '#60a5fa' },
    { label: 'Energy', value: metrics.fillerRate < 3 ? 'High' : metrics.fillerRate < 6 ? 'Mid' : 'Low', color: '#a78bfa' },
  ];

  return (
    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 p-3">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border p-3 text-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              backdropFilter: 'blur(var(--blur-strength))',
              WebkitBackdropFilter: 'blur(var(--blur-strength))',
              borderColor: 'var(--border-color)',
            }}
          >
            <div
              className="text-xl font-bold tabular-nums"
              style={{ color, letterSpacing: '-0.02em' }}
            >
              {value}
            </div>
            <div
              className="text-[10px] font-semibold uppercase tracking-wide mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Pitch Checklist */}
      {checklist.length > 0 && (
        <>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider px-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Pitch Checklist
          </div>
          <div className="flex flex-col gap-1">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  color: item.status === 'completed'
                    ? 'var(--text-secondary)'
                    : 'var(--text-muted)',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 18,
                    height: 18,
                    backgroundColor: item.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'transparent',
                    border: item.status === 'completed' ? 'none' : '1.5px solid var(--text-muted)',
                  }}
                >
                  {item.status === 'completed' && <Check size={11} color="#22c55e" />}
                </div>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Live Rubric */}
      {liveRubric && liveRubric.length > 0 && (
        <>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider px-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Live Rubric
          </div>
          <div className="flex flex-col gap-2 px-1">
            {liveRubric.map((cat) => (
              <div key={cat.category} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">
                    {RUBRIC_LABELS[cat.category] || cat.category}
                  </span>
                  <span
                    className="font-semibold tabular-nums"
                    style={{ color: cat.score20 > 0 ? scoreColor(cat.score20) : 'var(--text-muted)' }}
                  >
                    {cat.score20 > 0 ? cat.score20.toFixed(1) : '--'}
                  </span>
                </div>
                <div
                  className="rounded-full overflow-hidden"
                  style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, cat.score20 * 5))}%`,
                      backgroundColor: cat.score20 > 0 ? scoreColor(cat.score20) : 'transparent',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
