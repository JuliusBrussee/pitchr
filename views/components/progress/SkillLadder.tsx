'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown, Minus, ChevronRight, Lightbulb } from 'lucide-react';
import type { CategoryProgress, SkillStatus } from '@/lib/progress';
import { getRubricColor } from '@/views/components/ui/colors';
import type { ScoreBand } from '@/views/components/ui/colors';

/* ——— Coaching Tips ——— */

const COACHING_TIPS: Record<string, Record<ScoreBand, string>> = {
  structure: {
    'needs-work': 'Start with a one-sentence problem statement that hooks the listener instantly.',
    'getting-there': 'Tighten your narrative arc: problem \u2192 solution \u2192 why now \u2192 ask.',
    'solid': 'Add a compelling "why now" trigger to create urgency in your opening.',
    'investor-ready': 'Your structure is tight. Maintain this precision across iterations.',
  },
  clarity: {
    'needs-work': 'Cut your pitch to under 2 minutes. Remove every sentence that doesn\'t earn its place.',
    'getting-there': 'Replace jargon with concrete language a smart 12-year-old could understand.',
    'solid': 'Sharpen your one-liner. Can someone repeat your value prop after hearing it once?',
    'investor-ready': 'Crystal clear. Keep iterating to maintain this edge.',
  },
  evidence: {
    'needs-work': 'Add at least one quantified metric: users, revenue, or growth rate.',
    'getting-there': 'Show trajectory, not just a snapshot. "Growing 20% MoM" beats "$50K ARR."',
    'solid': 'Add social proof: notable customers, advisors, or key partnerships.',
    'investor-ready': 'Compelling evidence. Update your metrics before each pitch.',
  },
  market: {
    'needs-work': 'Define your TAM with a bottom-up calculation, not a top-down guess.',
    'getting-there': 'Articulate why existing solutions fail and what your unfair advantage is.',
    'solid': 'Address the "why not" \u2014 what makes this defensible against fast-followers?',
    'investor-ready': 'Strong market positioning. Keep your competitive analysis fresh.',
  },
  delivery: {
    'needs-work': 'Practice pacing: aim for 140\u2013160 WPM with natural pauses for emphasis.',
    'getting-there': 'Reduce filler words. Record yourself and count every "um" and "uh."',
    'solid': 'Add vocal variety: emphasize key numbers and land your ask with conviction.',
    'investor-ready': 'Polished delivery. Stay conversational, never rehearsed.',
  },
};

/* ——— Band Config ——— */

const BANDS: { id: ScoreBand; label: string; min: number; max: number; color: string }[] = [
  { id: 'needs-work', label: 'Needs Work', min: 0, max: 7.99, color: '#ef4444' },
  { id: 'getting-there', label: 'Getting There', min: 8, max: 11.99, color: '#eab308' },
  { id: 'solid', label: 'Solid', min: 12, max: 15.99, color: '#3b82f6' },
  { id: 'investor-ready', label: 'Investor-Ready', min: 16, max: 20, color: '#22c55e' },
];

const STATUS_CONFIG: Record<SkillStatus, { color: string; label: string; icon: typeof ArrowUp }> = {
  improving: { color: '#22c55e', label: 'Improving', icon: ArrowUp },
  regressing: { color: '#ef4444', label: 'Regressing', icon: ArrowDown },
  stagnant: { color: '#6b7280', label: 'Stagnant', icon: Minus },
};

/* ——— Mini Sparkline ——— */

function MiniSparkline({ history, color }: { history: { score: number }[]; color: string }) {
  if (history.length < 2) return null;

  const recent = history.slice(-6);
  const width = 48;
  const height = 16;
  const padding = 1;
  const maxVal = 20;

  const points = recent.map((h, i) => {
    const x = padding + (i / (recent.length - 1)) * (width - padding * 2);
    const y = height - padding - (h.score / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg width={width} height={height} className="flex-shrink-0 opacity-70">
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

/* ——— Single Skill Track ——— */

interface SkillTrackProps {
  category: CategoryProgress;
  index: number;
}

function SkillTrack({ category, index }: SkillTrackProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const catColor = getRubricColor(category.id);
  const statusCfg = STATUS_CONFIG[category.status];
  const StatusIcon = statusCfg.icon;
  const tip = COACHING_TIPS[category.id]?.[category.band] ?? '';

  // Position on the 0-20 scale
  const position = Math.min((category.currentAvg / 20) * 100, 100);

  // Find current and next band
  const currentBandIdx = BANDS.findIndex((b) => b.id === category.band);
  const nextBand = currentBandIdx < BANDS.length - 1 ? BANDS[currentBandIdx + 1] : null;
  const pointsToNext = nextBand ? Math.max(0, nextBand.min - category.currentAvg).toFixed(1) : null;

  const isImproving = category.status === 'improving';

  return (
    <div
      className="rounded-xl border p-4 animate-fade-in-up transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: isImproving ? `${catColor}30` : 'var(--border-color)',
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'both',
        '--glow-color': isImproving ? `${catColor}20` : 'transparent',
      } as React.CSSProperties}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: catColor,
              boxShadow: isImproving ? `0 0 8px ${catColor}60` : 'none',
            }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {category.label}
          </span>
          <MiniSparkline history={category.history} color={catColor} />
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className="flex items-center gap-1">
            <StatusIcon size={10} style={{ color: statusCfg.color }} />
            <span className="text-[10px] font-medium" style={{ color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          </div>

          {/* Score */}
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {category.currentAvg.toFixed(1)}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/20</span>
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div className="relative mb-2">
        {/* Band zones background */}
        <div className="flex h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-color)' }}>
          {BANDS.map((band) => {
            const bandWidth = ((band.max - band.min) / 20) * 100;
            return (
              <div
                key={band.id}
                className="h-full relative"
                style={{
                  width: `${bandWidth}%`,
                  backgroundColor: `${band.color}${band.id === category.band ? '25' : '08'}`,
                  borderRight: band.id !== 'investor-ready' ? '1px solid var(--bg-primary)' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Filled progress */}
        <div
          className="absolute top-0 left-0 h-3 rounded-full animate-bar-fill"
          style={{
            width: `${position}%`,
            background: `linear-gradient(90deg, ${catColor}60, ${catColor})`,
            boxShadow: isImproving ? `0 0 10px ${catColor}40` : 'none',
          }}
        />

        {/* Score marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 animate-marker-slide"
          style={{ left: `${position}%` }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 -ml-2"
            style={{
              backgroundColor: catColor,
              borderColor: 'var(--bg-surface)',
              boxShadow: `0 0 8px ${catColor}80, 0 1px 3px rgba(0,0,0,0.3)`,
            }}
          />
        </div>
      </div>

      {/* Band labels */}
      <div className="flex mb-3">
        {BANDS.map((band) => {
          const bandWidth = ((band.max - band.min) / 20) * 100;
          const isCurrentBand = band.id === category.band;
          return (
            <div
              key={band.id}
              className="text-center"
              style={{ width: `${bandWidth}%` }}
            >
              <span
                className="text-[9px] font-medium"
                style={{
                  color: isCurrentBand ? band.color : 'var(--text-muted)',
                  opacity: isCurrentBand ? 1 : 0.5,
                }}
              >
                {band.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Coaching tip + next band info */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 group cursor-pointer"
      >
        <Lightbulb size={11} style={{ color: catColor }} className="flex-shrink-0 opacity-60" />
        <span
          className="text-[11px] leading-snug text-left flex-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {tip}
        </span>
        <ChevronRight
          size={12}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--text-muted)',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div
          className="mt-3 pt-3 grid grid-cols-4 gap-3 animate-fade-in-up"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <div className="text-center">
            <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Best
            </div>
            <div
              className="text-xs font-bold tabular-nums"
              style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {category.bestScore.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Change
            </div>
            <div
              className="text-xs font-bold tabular-nums"
              style={{
                color: category.delta > 0 ? '#22c55e' : category.delta < 0 ? '#ef4444' : 'var(--text-primary)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {category.delta > 0 ? '+' : ''}{category.delta.toFixed(1)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Sessions
            </div>
            <div
              className="text-xs font-bold tabular-nums"
              style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {category.sessionCount}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Next Band
            </div>
            <div
              className="text-xs font-bold tabular-nums"
              style={{
                color: nextBand ? nextBand.color : 'var(--text-primary)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {pointsToNext ? `${pointsToNext} pts` : 'Max'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ——— Main Component ——— */

interface SkillLadderProps {
  categories: CategoryProgress[];
  animationDelay?: string;
}

export function SkillLadder({ categories, animationDelay }: SkillLadderProps) {
  // Sort: improving first, then by delta
  const sorted = [...categories].sort((a, b) => {
    if (a.status === 'improving' && b.status !== 'improving') return -1;
    if (a.status !== 'improving' && b.status === 'improving') return 1;
    return b.currentAvg - a.currentAvg;
  });

  return (
    <div
      className="animate-fade-in-up"
      style={{
        animationDelay: animationDelay ?? '0ms',
        animationFillMode: 'both',
      }}
    >
      <div className="flex flex-col gap-3">
        {sorted.map((cat, i) => (
          <SkillTrack key={cat.id} category={cat} index={i} />
        ))}
      </div>
    </div>
  );
}
