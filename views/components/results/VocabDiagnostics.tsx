'use client';

import type { DeliveryMetrics, VocabularyMetrics } from '@/types/analysis-v2';

interface VocabDiagnosticsProps {
  delivery: DeliveryMetrics;
  vocabulary?: VocabularyMetrics;
}

function MiniBar({
  label,
  value,
  displayValue,
  max,
  color,
  delay,
}: {
  label: string;
  value: number;
  displayValue?: string;
  max: number;
  color: string;
  delay: number;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const formatted =
    displayValue ??
    (typeof value === 'number' && value % 1 !== 0
      ? value.toFixed(3)
      : String(value));

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatted}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}1a` }}>
        <div
          className="h-full rounded-full results-rubric-bar"
          style={{
            '--bar-width': `${pct}%`,
            '--bar-delay': `${delay}ms`,
            backgroundColor: color,
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

export function VocabDiagnostics({ delivery, vocabulary }: VocabDiagnosticsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <MiniBar
          label="Word count"
          value={delivery.word_count}
          max={1500}
          color="#3b82f6"
          delay={0}
        />
        <MiniBar
          label="Filler rate"
          value={delivery.filler_rate}
          max={0.1}
          color="#ffaa33"
          delay={60}
        />
        <MiniBar
          label="Stutter rate"
          value={delivery.stutter_rate}
          max={0.1}
          color="#ef4444"
          delay={120}
        />
        <MiniBar
          label="Repeat rate"
          value={delivery.repeat_rate}
          max={0.1}
          color="#f97316"
          delay={180}
        />
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
        style={{
          backgroundColor: delivery.within_time_limit
            ? 'rgba(34,197,94,0.08)'
            : 'rgba(239,68,68,0.08)',
          color: delivery.within_time_limit ? '#22c55e' : '#ef4444',
        }}
      >
        {delivery.within_time_limit ? '\u2713 Within time limit' : '\u2717 Over time limit'}
      </div>

      {vocabulary ? (
        <div
          className="space-y-3 pt-3 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <MiniBar
            label="Lexical diversity"
            value={vocabulary.lexical_diversity}
            max={1}
            color="#14b8a6"
            delay={240}
          />
          <MiniBar
            label="Hedge density"
            value={vocabulary.hedge_density}
            max={0.1}
            color="#eab308"
            delay={300}
          />
          <MiniBar
            label="Jargon density"
            value={vocabulary.jargon_density}
            max={0.1}
            color="#8b5cf6"
            delay={360}
          />
        </div>
      ) : null}
    </div>
  );
}
