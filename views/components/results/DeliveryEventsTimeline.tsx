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

function eventColor(type: DeliveryEvent['type']): string {
  switch (type) {
    case 'filler':
      return '#ffaa33';
    case 'stutter':
      return '#ef4444';
    case 'hesitation':
      return '#3b82f6';
    case 'repetition':
      return '#f97316';
    case 'vocab':
      return '#14b8a6';
    default:
      return 'var(--text-secondary)';
  }
}

export function DeliveryEventsTimeline({ events, onSeek }: DeliveryEventsTimelineProps) {
  const timeline = (events ?? []).slice(0, 30);
  if (timeline.length === 0) return null;

  return (
    <section
      className="rounded-2xl border p-4 animate-fade-in-up"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <h3 className="text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
        Delivery Events Timeline
      </h3>
      <div className="flex flex-wrap gap-2">
        {timeline.map((event) => (
          <button
            type="button"
            key={event.id}
            onClick={() => onSeek(event.start_sec)}
            className="text-xs px-2 py-1 rounded-full border transition-opacity hover:opacity-80"
            style={{
              color: eventColor(event.type),
              borderColor: `${eventColor(event.type)}55`,
              backgroundColor: `${eventColor(event.type)}1A`,
            }}
            title={event.evidence}
          >
            {formatTime(event.start_sec)} {event.type}: {event.label}
          </button>
        ))}
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        Click any timestamp to seek the recording.
      </p>
    </section>
  );
}
