'use client';

import { Check, Circle, Minus, Sparkles } from 'lucide-react';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { PitchMode } from '@/types/pitch';
import type { InsightEntry, MetricValues } from '@/hooks/useSessionState';

interface MetricsPanelProps {
  metrics: MetricValues;
  checklist: RealtimeChecklistItemState[];
  insights: InsightEntry[];
  isSessionActive: boolean;
  selectedMode: PitchMode;
  onModeChange: (mode: PitchMode) => void;
  checklistSource?: 'openrouter' | 'heuristic' | null;
  checklistNextHint?: string | null;
  checklistError?: string | null;
  sttError?: string | null;
  sttSaved?: boolean;
  isAnalyzing?: boolean;
  analysisError?: string | null;
}

export function MetricsPanel({
  metrics,
  checklist,
  insights,
  isSessionActive,
  selectedMode,
  onModeChange,
  checklistSource,
  checklistNextHint,
  checklistError,
  sttError,
  sttSaved,
  isAnalyzing,
  analysisError,
}: MetricsPanelProps) {
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
      <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Pitch Mode
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <ModeButton
            active={selectedMode === 'elevator'}
            label="Elevator"
            disabled={isSessionActive}
            onClick={() => onModeChange('elevator')}
          />
          <ModeButton
            active={selectedMode === 'vc_pitch'}
            label="VC Pitch"
            disabled={isSessionActive}
            onClick={() => onModeChange('vc_pitch')}
          />
        </div>
      </div>

      {(sttError || sttSaved || isAnalyzing || analysisError || checklistError) && (
        <div className="p-3 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          {analysisError && (
            <p className="text-xs" style={{ color: '#ef4444' }}>
              Analysis failed: {analysisError}
            </p>
          )}
          {checklistError && (
            <p className="text-xs" style={{ color: '#f59e0b' }}>
              Checklist update issue: {checklistError}
            </p>
          )}
          {isAnalyzing && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 border-2 rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#ff5941' }}
              />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Analyzing your pitch...
              </p>
            </div>
          )}
          {sttError && !isAnalyzing && (
            <p className="text-xs" style={{ color: '#ef4444' }}>
              {sttError}
            </p>
          )}
          {sttSaved && !sttError && !isAnalyzing && !analysisError && (
            <p className="text-xs" style={{ color: '#22c55e' }}>
              Transcript saved
            </p>
          )}
        </div>
      )}

      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Live Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="WPM" value={isSessionActive ? Math.round(metrics.wpm) : '-'} />
          <MetricCard
            label="Filler Words"
            value={isSessionActive ? metrics.fillerWords : '-'}
            accent={metrics.fillerWords > 5 ? 'red' : undefined}
          />
          <MetricGauge label="Conciseness" value={isSessionActive ? metrics.conciseness : 0} max={10} />
          <MetricGauge label="Clarity" value={isSessionActive ? metrics.clarity : 0} max={10} />
        </div>
      </div>

      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Pitch Checklist
          </h3>
          {checklistSource ? (
            <span className="text-[10px] px-2 py-0.5 rounded-md border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
              {checklistSource === 'openrouter' ? 'Semantic' : 'Heuristic'}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          {checklist.map((item) => (
            <ChecklistRow key={item.id} item={item} />
          ))}
        </div>
        {checklistNextHint ? (
          <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
            Next: {checklistNextHint}
          </p>
        ) : null}
      </div>

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
          {isSessionActive &&
            insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
        </div>
      </div>
    </aside>
  );
}

function ModeButton({
  active,
  label,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="text-xs font-medium rounded-lg border px-2.5 py-2 transition-colors"
      style={{
        borderColor: active ? '#ff5941' : 'var(--border-color)',
        color: active ? '#ff5941' : 'var(--text-secondary)',
        backgroundColor: active ? 'rgba(255, 89, 65, 0.12)' : 'var(--bg-surface)',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
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
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {value > 0 ? value.toFixed(1) : '-'}
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

function ChecklistRow({ item }: { item: RealtimeChecklistItemState }) {
  const iconMap = {
    completed: <Check size={14} className="text-green-500" />,
    partial: <Minus size={14} className="text-amber-500" />,
    uncovered: <Circle size={14} style={{ color: 'var(--text-muted)' }} />,
  };
  return (
    <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {iconMap[item.status]}
        </div>
        <span
          className="text-sm transition-colors duration-300"
          style={{
            color: item.status === 'completed' ? 'var(--text-primary)' : 'var(--text-secondary)',
            textDecoration: item.status === 'completed' ? 'line-through' : undefined,
            opacity: item.status === 'uncovered' ? 0.7 : 1,
          }}
        >
          {item.label}
        </span>
        <span
          className="ml-auto text-[10px] font-semibold rounded px-1.5 py-0.5"
          style={{
            color: 'var(--text-muted)',
            backgroundColor: 'var(--border-color)',
          }}
        >
          {Math.round(item.confidence * 100)}%
        </span>
      </div>
      {item.evidence ? (
        <p className="text-[11px] mt-1.5 ml-7" style={{ color: 'var(--text-muted)' }}>
          "{item.evidence}"
        </p>
      ) : null}
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
