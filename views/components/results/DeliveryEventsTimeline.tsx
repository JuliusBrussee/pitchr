'use client';

import type { DeliveryEvent } from '@/types/analysis-v2';

interface DeliveryEventsTimelineProps {
  events?: DeliveryEvent[];
  onSeek: (seconds: number) => void;
}

function formatTime(value: number): string {
  const total = Math.max(0, Math.round(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const EVENT_STYLES: Record<string, { color: string; label: string }> = {
  filler: { color: '#ffaa33', label: 'Filler' },
  stutter: { color: '#ef4444', label: 'Stutter' },
  hesitation: { color: '#3b82f6', label: 'Hesitation' },
  repetition: { color: '#f97316', label: 'Repetition' },
  vocab: { color: '#14b8a6', label: 'Vocab' },
};

export function DeliveryEventsTimeline({ events, onSeek }: DeliveryEventsTimelineProps) {
  const timeline = (events ?? []).slice(0, 30);
  if (timeline.length === 0) return null;

  const typeCounts = timeline.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section
      className="rounded-2xl border p-5 results-card-enter"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        '--card-delay': '0ms',
      } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Delivery Events
        </h3>
        <div className="flex items-center gap-3">
          {Object.entries(typeCounts).map(([type, count]) => {
            const s = EVENT_STYLES[type] ?? { color: 'var(--text-secondary)', label: type };
            return (
              <span key={type} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span
                  className="text-[10px] tabular-nums"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {count}
                </span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {timeline.map((event) => {
          const s = EVENT_STYLES[event.type] ?? { color: 'var(--text-secondary)', label: event.type };
          return (
            <button
              type="button"
              key={event.id}
              onClick={() => onSeek(event.start_sec)}
              className="text-[11px] px-2 py-1 rounded-md border transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                color: s.color,
                borderColor: `${s.color}33`,
                backgroundColor: `${s.color}0d`,
              }}
              title={event.evidence}
            >
              <span className="tabular-nums">{formatTime(event.start_sec)}</span>
              <span className="mx-1 opacity-40">&middot;</span>
              {event.label}
            </button>
          );
        })}
      </div>
      <p
        className="text-[10px] mt-3 uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        Click to seek recording
      </p>
    </section>
  );
}
