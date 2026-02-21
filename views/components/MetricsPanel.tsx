'use client';

import { Check, Circle, Minus, Sparkles } from 'lucide-react';
import { MetricValues, ChecklistItem, InsightEntry } from '@/hooks/useSessionState';

interface MetricsPanelProps {
  metrics: MetricValues;
  checklist: ChecklistItem[];
  insights: InsightEntry[];
  isSessionActive: boolean;
}

export function MetricsPanel({ metrics, checklist, insights, isSessionActive }: MetricsPanelProps) {
  return (
    <aside
      className="flex flex-col w-80 rounded-2xl border overflow-hidden min-h-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Live Summary */}
      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Live Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="WPM" value={isSessionActive ? Math.round(metrics.wpm) : '—'} />
          <MetricCard label="Filler Words" value={isSessionActive ? metrics.fillerWords : '—'} accent={metrics.fillerWords > 5 ? 'red' : undefined} />
          <MetricGauge label="Conciseness" value={isSessionActive ? metrics.conciseness : 0} max={10} />
          <MetricGauge label="Clarity" value={isSessionActive ? metrics.clarity : 0} max={10} />
        </div>
      </div>

      {/* Pitch Checklist */}
      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Pitch Checklist
        </h3>
        <div className="flex flex-col gap-1.5">
          {checklist.map(item => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Live Insights */}
      <div className="p-4 flex-1 overflow-y-auto min-h-0">
        <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Sparkles size={12} />
          Live Insights
        </h3>
        <div className="flex flex-col gap-2">
          {!isSessionActive && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Start a session to receive live feedback.
            </p>
          )}
          {isSessionActive && insights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </aside>
  );
}

/* --- Sub-components --- */

function MetricCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div
        className="text-xl font-bold tabular-nums transition-colors duration-300"
        style={{ color: accent === 'red' ? '#ef4444' : 'var(--text-primary)' }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricGauge({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="flex items-center gap-2">
        <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {value > 0 ? value.toFixed(1) : '—'}
        </div>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: pct > 70 ? '#22c55e' : pct > 40 ? '#eab308' : '#ef4444',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const iconMap = {
    completed: <Check size={14} className="text-green-500" />,
    partial: <Minus size={14} className="text-amber-500" />,
    uncovered: <Circle size={14} style={{ color: 'var(--text-muted)' }} />,
  };

  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {iconMap[item.status]}
      </div>
      <span
        className="text-sm transition-colors duration-300"
        style={{
          color: item.status === 'completed' ? 'var(--text-primary)' : 'var(--text-secondary)',
          textDecoration: item.status === 'completed' ? 'line-through' : undefined,
          opacity: item.status === 'uncovered' ? 0.6 : 1,
        }}
      >
        {item.label}
      </span>
    </div>
  );
}

function InsightCard({ insight }: { insight: InsightEntry }) {
  const colorMap = {
    positive: '#22c55e',
    suggestion: '#3b82f6',
    neutral: 'var(--text-secondary)',
  };

  return (
    <div
      className="rounded-lg p-2.5 border text-xs transition-all duration-300 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        borderLeftWidth: '3px',
        borderLeftColor: colorMap[insight.type],
      }}
    >
      <p style={{ color: 'var(--text-primary)' }}>{insight.text}</p>
    </div>
  );
}
