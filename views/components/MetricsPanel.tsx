'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { Check, Circle, Minus, X, ScanFace } from 'lucide-react';
import type { RealtimeChecklistItemState } from '@/types/checklist';
import type { MetricValues } from '@/hooks/useSessionState';
import type { HeadTrackingEngagementBand } from '@/lib/headTracking/engagementBand';
import type {
  LiveBeatProgress,
  LiveRubricCategory,
  LiveRubricCategoryScore,
} from '@/lib/liveFeedback';

interface MetricsPanelProps {
  metrics: MetricValues;
  targetDurationSeconds?: number;
  checklist: RealtimeChecklistItemState[];
  liveRubric?: LiveRubricCategoryScore[];
  beatProgress?: LiveBeatProgress;
  isSessionActive: boolean;
  hasStarted?: boolean;
  engagementBand?: HeadTrackingEngagementBand;
  isCameraOn?: boolean;
  checklistSource?: 'llm' | 'heuristic' | null;
  checklistNextHint?: string | null;
  checklistError?: string | null;
  sttError?: string | null;
  sttSaved?: boolean;
  isAnalyzing?: boolean;
  analysisError?: string | null;
}

const ENGAGEMENT_LABELS: Record<HeadTrackingEngagementBand, string> = {
  good: 'Good',
  could_improve: 'Needs Work',
  bad: 'Poor',
  no_face: '--',
};

const ENGAGEMENT_COLORS: Record<HeadTrackingEngagementBand, string> = {
  good: '#22c55e',
  could_improve: '#f59e0b',
  bad: '#ef4444',
  no_face: 'var(--text-muted)',
};

const LIVE_RUBRIC_LABELS: Record<LiveRubricCategory, string> = {
  structure: 'Structure',
  clarity: 'Clarity',
  evidence: 'Evidence',
  market: 'Market',
  delivery: 'Delivery',
};

function withAlpha(color: string, alpha: number): string {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const shortHexMatch = color.match(/^#([0-9a-f]{3})$/i);
  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1].split('').map((part) => parseInt(part + part, 16));
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  }

  const longHexMatch = color.match(/^#([0-9a-f]{6})$/i);
  if (longHexMatch) {
    const hex = longHexMatch[1];
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  }

  const rgbMatch = color.match(/^rgb\(\s*([^)]+)\s*\)$/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${clampedAlpha})`;
  }

  const rgbaMatch = color.match(
    /^rgba\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*[0-9.]+\s*\)$/i,
  );
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${clampedAlpha})`;
  }

  return color;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Rolling digit animation system                                     */
/* ------------------------------------------------------------------ */

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const DIGIT_HEIGHT = 1.25; // em

/**
 * Single rolling character. Digit characters animate vertically through
 * a strip of 0-9; non-digit chars render statically.
 */
const RollingChar = memo(function RollingChar({ char }: { char: string }) {
  const isDigit = /^\d$/.test(char);

  if (!isDigit) {
    return (
      <span
        className="inline-block"
        style={{
          lineHeight: `${DIGIT_HEIGHT}em`,
          opacity: char.trim() ? 0.85 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {char === ' ' ? '\u2007' : char}
      </span>
    );
  }

  const num = parseInt(char, 10);

  return (
    <span
      className="inline-block overflow-hidden relative"
      style={{ height: `${DIGIT_HEIGHT}em` }}
    >
      <span
        className="flex flex-col will-change-transform"
        style={{
          transform: `translateY(${-num * DIGIT_HEIGHT}em)`,
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="block text-center"
            style={{
              height: `${DIGIT_HEIGHT}em`,
              lineHeight: `${DIGIT_HEIGHT}em`,
            }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
});

/** Renders a string with per-digit rolling animation. */
function AnimatedValue({ value }: { value: string }) {
  return (
    <span
      className="inline-flex whitespace-nowrap"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {value.split('').map((char, i) => (
        <RollingChar key={i} char={char} />
      ))}
    </span>
  );
}

/** Returns true briefly after a value change (for pulse effects). */
function useChangePulse(value: number | string, duration = 800): boolean {
  const prevRef = useRef(value);
  const [pulsing, setPulsing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (prevRef.current !== value && value !== 0 && value !== '-') {
      setPulsing(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setPulsing(false), duration);
    }
    prevRef.current = value;
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, duration]);

  return pulsing;
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */

export function MetricsPanel({
  metrics,
  targetDurationSeconds,
  checklist,
  liveRubric,
  beatProgress,
  isSessionActive,
  hasStarted = false,
  engagementBand = 'no_face',
  isCameraOn = false,
  checklistSource,
  checklistNextHint,
  checklistError,
  sttError,
  sttSaved,
  isAnalyzing,
  analysisError,
}: MetricsPanelProps) {
  const showEngagement = isSessionActive && isCameraOn;
  const hasTarget = typeof targetDurationSeconds === 'number' && targetDurationSeconds > 0;
  const isOverrun = hasTarget && metrics.durationSecs > targetDurationSeconds;
  const timerLabel = hasTarget
    ? `${formatDuration(metrics.durationSecs)} / ${formatDuration(targetDurationSeconds)}`
    : formatDuration(metrics.durationSecs);
  const nextBeatLabel =
    beatProgress?.nextBeatId
      ? beatProgress.beats.find((beat) => beat.id === beatProgress.nextBeatId)?.label ?? null
      : null;

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
          <MetricCard
            label="WPM"
            value={hasStarted ? metrics.wpm : '-'}
            accent={metrics.wpm > 160 ? '#f59e0b' : metrics.wpm > 0 && metrics.wpm < 100 ? '#f59e0b' : undefined}
          />
          <MetricCard
            label="Words"
            value={hasStarted ? metrics.wordCount : '-'}
          />
          <MetricCard
            label="Filler Words"
            value={hasStarted ? metrics.fillerWords : '-'}
            accent={metrics.fillerWords > 5 ? '#ef4444' : undefined}
          />
          <MetricCard
            label="Filler Rate"
            value={hasStarted && metrics.wordCount > 0 ? `${metrics.fillerRate}%` : '-'}
            accent={metrics.fillerRate > 5 ? '#ef4444' : metrics.fillerRate > 3 ? '#f59e0b' : undefined}
          />
          <MetricCard
            label="Duration"
            value={hasStarted ? timerLabel : '-'}
            accent={isOverrun ? '#ef4444' : undefined}
          />
          <EngagementCard
            band={engagementBand}
            active={showEngagement}
          />
        </div>
      </div>

      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Pitch Checklist
          </h3>
          {checklistSource ? (
            <span className="text-[10px] px-2 py-0.5 rounded-md border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
              {checklistSource === 'llm' ? 'Semantic' : 'Heuristic'}
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

      {liveRubric && liveRubric.length > 0 ? (
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Live Rubric Preview
            </h3>
            {beatProgress ? (
              <span
                className="text-[10px] px-2 py-0.5 rounded-md border"
                style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
              >
                Beats {beatProgress.completed}/{beatProgress.total}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-2.5">
            {liveRubric.map((item) => {
              const pct = Math.max(0, Math.min(100, (item.score20 / 20) * 100));
              return (
                <div key={item.category} className="flex items-center gap-2">
                  <span className="text-[11px] w-16" style={{ color: 'var(--text-secondary)' }}>
                    {LIVE_RUBRIC_LABELS[item.category]}
                  </span>
                  <div
                    className="h-2 rounded-full overflow-hidden flex-1"
                    style={{ backgroundColor: 'var(--bg-surface-hover)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: '#ff5941',
                      }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-semibold tabular-nums w-10 text-right"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.score20}/20
                  </span>
                </div>
              );
            })}
          </div>
          {nextBeatLabel ? (
            <p className="text-[11px] mt-3" style={{ color: 'var(--text-muted)' }}>
              Session Beats: Next: {nextBeatLabel}
            </p>
          ) : null}
        </div>
      ) : null}

    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  const displayStr = String(value);
  const isInactive = displayStr === '-';
  const pulseKey = typeof value === 'number' ? Math.round(value) : value;
  const pulsing = useChangePulse(pulseKey);
  const accentBase = accent ?? '#ff5941';
  const borderPulseColor = withAlpha(accentBase, 0.42);
  const glowColor = withAlpha(accentBase, 0.12);

  return (
    <div
      className="rounded-xl p-3 border relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: pulsing
          ? borderPulseColor
          : 'var(--border-color)',
        transition: 'border-color 0.4s ease',
      }}
    >
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className="text-xl font-bold"
        style={{
          color: accent ?? 'var(--text-primary)',
          transition: 'color 0.3s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {isInactive ? (
          <span style={{ opacity: 0.3 }}>-</span>
        ) : (
          <AnimatedValue value={displayStr} />
        )}
      </div>
      {/* Subtle radial glow on value change */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: `radial-gradient(ellipse at 30% 80%, ${glowColor} 0%, transparent 72%)`,
          opacity: pulsing ? 0.55 : 0.22,
          transition: 'opacity 0.6s ease-out, background 0.4s ease',
        }}
      />
    </div>
  );
}

function WireframeMeshBg({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 200 80"
      fill="none"
      style={{ opacity: 0.18, transition: 'opacity 0.4s ease' }}
    >
      {/* Horizontal grid lines */}
      <line x1="0" y1="16" x2="200" y2="16" stroke={color} strokeWidth="0.5" />
      <line x1="0" y1="40" x2="200" y2="40" stroke={color} strokeWidth="0.5" />
      <line x1="0" y1="64" x2="200" y2="64" stroke={color} strokeWidth="0.5" />
      {/* Vertical grid lines */}
      <line x1="40" y1="0" x2="40" y2="80" stroke={color} strokeWidth="0.5" />
      <line x1="80" y1="0" x2="80" y2="80" stroke={color} strokeWidth="0.5" />
      <line x1="120" y1="0" x2="120" y2="80" stroke={color} strokeWidth="0.5" />
      <line x1="160" y1="0" x2="160" y2="80" stroke={color} strokeWidth="0.5" />
      {/* Warped mesh — curves that suggest a 3D face surface */}
      <path d="M60 0 Q58 40 60 80" stroke={color} strokeWidth="0.6" />
      <path d="M100 0 Q102 40 100 80" stroke={color} strokeWidth="0.6" />
      <path d="M0 28 Q100 22 200 28" stroke={color} strokeWidth="0.6" />
      <path d="M0 52 Q100 58 200 52" stroke={color} strokeWidth="0.6" />
      {/* Diagonal mesh connectors */}
      <line x1="40" y1="16" x2="80" y2="40" stroke={color} strokeWidth="0.3" />
      <line x1="80" y1="16" x2="120" y2="40" stroke={color} strokeWidth="0.3" />
      <line x1="120" y1="16" x2="160" y2="40" stroke={color} strokeWidth="0.3" />
      <line x1="40" y1="40" x2="80" y2="64" stroke={color} strokeWidth="0.3" />
      <line x1="80" y1="40" x2="120" y2="64" stroke={color} strokeWidth="0.3" />
      <line x1="120" y1="40" x2="160" y2="64" stroke={color} strokeWidth="0.3" />
      <line x1="80" y1="16" x2="40" y2="40" stroke={color} strokeWidth="0.3" />
      <line x1="120" y1="16" x2="80" y2="40" stroke={color} strokeWidth="0.3" />
      <line x1="160" y1="16" x2="120" y2="40" stroke={color} strokeWidth="0.3" />
      <line x1="80" y1="40" x2="40" y2="64" stroke={color} strokeWidth="0.3" />
      <line x1="120" y1="40" x2="80" y2="64" stroke={color} strokeWidth="0.3" />
      <line x1="160" y1="40" x2="120" y2="64" stroke={color} strokeWidth="0.3" />
      {/* Vertex dots at intersections */}
      <circle cx="40" cy="16" r="1.2" fill={color} />
      <circle cx="80" cy="16" r="1.2" fill={color} />
      <circle cx="120" cy="16" r="1.2" fill={color} />
      <circle cx="160" cy="16" r="1.2" fill={color} />
      <circle cx="40" cy="40" r="1.2" fill={color} />
      <circle cx="80" cy="40" r="1.5" fill={color} />
      <circle cx="120" cy="40" r="1.5" fill={color} />
      <circle cx="160" cy="40" r="1.2" fill={color} />
      <circle cx="40" cy="64" r="1.2" fill={color} />
      <circle cx="80" cy="64" r="1.2" fill={color} />
      <circle cx="120" cy="64" r="1.2" fill={color} />
      <circle cx="160" cy="64" r="1.2" fill={color} />
    </svg>
  );
}

function EngagementCard({
  band,
  active,
}: {
  band: HeadTrackingEngagementBand;
  active: boolean;
}) {
  const pulsing = useChangePulse(active ? band : '-');
  const color = active ? ENGAGEMENT_COLORS[band] : 'var(--text-muted)';

  return (
    <div
      className="rounded-xl p-3 border relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: pulsing && band !== 'no_face'
          ? `${ENGAGEMENT_COLORS[band]}55`
          : 'var(--border-color)',
        transition: 'border-color 0.5s ease',
      }}
    >
      {/* Wireframe shader mesh background */}
      <WireframeMeshBg color={active && band !== 'no_face' ? ENGAGEMENT_COLORS[band] : 'var(--text-muted)'} />

      <div className="relative">
        <div className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          <ScanFace size={12} />
          Engagement
        </div>
        <div
          className="text-lg font-bold"
          style={{
            color,
            transition: 'color 0.5s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: pulsing ? 'scale(1.05)' : 'scale(1)',
            transformOrigin: 'left center',
          }}
        >
          {active ? ENGAGEMENT_LABELS[band] : '-'}
        </div>
      </div>

      {/* Color-matched glow on band change */}
      {active && band !== 'no_face' && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(ellipse at 50% 80%, ${ENGAGEMENT_COLORS[band]}15 0%, transparent 70%)`,
            opacity: pulsing ? 1 : 0.2,
            transition: 'opacity 0.6s ease, background 0.5s ease',
          }}
        />
      )}
    </div>
  );
}

function ChecklistRow({ item }: { item: RealtimeChecklistItemState }) {
  const iconMap = {
    completed: <Check size={14} className="text-green-500" />,
    partial: <Minus size={14} className="text-amber-500" />,
    failed: <X size={14} className="text-red-500" />,
    uncovered: <Circle size={14} style={{ color: 'var(--text-muted)' }} />,
  };
  const statusLabel =
    item.status === 'completed'
      ? 'completed'
      : item.status === 'partial'
        ? 'partial'
        : item.status === 'failed'
          ? 'failed'
          : 'pending';
  return (
    <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {iconMap[item.status]}
        </div>
        <span
          className="text-sm transition-colors duration-300"
          style={{
            color:
              item.status === 'failed'
                ? '#ef4444'
                : item.status === 'completed'
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
            textDecoration: item.status === 'completed' ? 'line-through' : undefined,
            opacity: item.status === 'uncovered' || item.status === 'failed' ? 0.85 : 1,
          }}
        >
          {item.label}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <span
            className="text-[10px] uppercase font-semibold rounded px-1.5 py-0.5"
            style={{
              color: item.status === 'failed' ? '#ef4444' : 'var(--text-muted)',
              backgroundColor: 'var(--border-color)',
            }}
          >
            {statusLabel}
          </span>
          <span
            className="text-[10px] font-semibold rounded px-1.5 py-0.5"
            style={{
              color: 'var(--text-muted)',
              backgroundColor: 'var(--border-color)',
            }}
          >
            {Math.round(item.confidence * 100)}%
          </span>
        </div>
      </div>
      {item.evidence ? (
        <p className="text-[11px] mt-1.5 ml-7" style={{ color: 'var(--text-muted)' }}>
          &ldquo;{item.evidence}&rdquo;
        </p>
      ) : null}
    </div>
  );
}
