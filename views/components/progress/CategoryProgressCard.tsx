'use client';

import { ArrowUp, ArrowDown, Minus, TrendingUp, Lightbulb } from 'lucide-react';
import type { CategoryProgress, SkillStatus } from '@/lib/progress';
import { getRubricColor } from '@/views/components/ui/colors';
import type { ScoreBand } from '@/views/components/ui/colors';

interface CategoryProgressCardProps {
  category: CategoryProgress;
  animationDelay?: string;
}

const STATUS_CONFIG: Record<SkillStatus, { color: string; label: string; icon: typeof ArrowUp }> = {
  improving: { color: '#22c55e', label: 'Improving', icon: ArrowUp },
  regressing: { color: '#ef4444', label: 'Regressing', icon: ArrowDown },
  stagnant: { color: '#6b7280', label: 'Stagnant', icon: Minus },
};

const COACHING_TIPS: Record<string, Record<ScoreBand, string>> = {
  structure: {
    'needs-work': 'Start with a one-sentence problem statement that hooks the listener.',
    'getting-there': 'Tighten your narrative arc: problem \u2192 solution \u2192 why now \u2192 ask.',
    'solid': 'Add a compelling "why now" trigger to create urgency.',
    'investor-ready': 'Your structure is tight. Maintain this precision.',
  },
  clarity: {
    'needs-work': 'Cut your pitch to under 2 minutes. Every sentence must earn its place.',
    'getting-there': 'Replace jargon with concrete language anyone can understand.',
    'solid': 'Sharpen your one-liner so people repeat your value prop instantly.',
    'investor-ready': 'Crystal clear. Keep iterating to maintain this edge.',
  },
  evidence: {
    'needs-work': 'Add at least one quantified metric: users, revenue, or growth rate.',
    'getting-there': 'Show trajectory. "Growing 20% MoM" beats "$50K ARR."',
    'solid': 'Add social proof: notable customers, advisors, or partnerships.',
    'investor-ready': 'Compelling evidence. Update metrics before each pitch.',
  },
  market: {
    'needs-work': 'Define TAM with a bottom-up calculation, not a top-down guess.',
    'getting-there': 'Show why existing solutions fail and what your advantage is.',
    'solid': 'Address "why not" \u2014 what makes this defensible against copycats?',
    'investor-ready': 'Strong positioning. Keep competitive analysis fresh.',
  },
  delivery: {
    'needs-work': 'Practice pacing: aim for 140\u2013160 WPM with natural pauses.',
    'getting-there': 'Reduce filler words. Record yourself and count every "um."',
    'solid': 'Add vocal variety. Emphasize key numbers and land your ask.',
    'investor-ready': 'Polished delivery. Stay conversational, never rehearsed.',
  },
};

function Sparkline({ history, color }: { history: { score: number }[]; color: string }) {
  if (history.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px]"
        style={{ color: 'var(--text-muted)', height: 48 }}
      >
        Not enough data
      </div>
    );
  }

  const recent = history.slice(-12);
  const max = 20;
  const min = 0;
  const range = max - min || 1;
  const width = 200;
  const height = 48;
  const padding = 4;

  const points = recent.map((h, i) => {
    const x = padding + (i / (recent.length - 1)) * (width - padding * 2);
    const y = height - padding - ((h.score - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width={width} height={height} className="w-full">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current score dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
    </svg>
  );
}

export function CategoryProgressCard({ category, animationDelay }: CategoryProgressCardProps) {
  const catColor = getRubricColor(category.id);
  const statusCfg = STATUS_CONFIG[category.status];
  const StatusIcon = statusCfg.icon;
  const pct = (category.currentAvg / category.maxScore) * 100;
  const isImproving = category.status === 'improving';
  const tip = COACHING_TIPS[category.id]?.[category.band] ?? '';

  return (
    <div
      className="rounded-xl border p-4 animate-fade-in-up transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isImproving ? `${catColor}25` : 'var(--border-color)',
        animationDelay: animationDelay ?? '0ms',
        animationFillMode: 'both',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
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
        </div>
        <div className="flex items-center gap-1.5">
          <StatusIcon size={12} style={{ color: statusCfg.color }} />
          <span
            className="text-[11px] font-medium"
            style={{ color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex-1 h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--border-color)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out animate-bar-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${catColor}80, ${catColor})`,
              boxShadow: isImproving ? `0 0 6px ${catColor}40` : 'none',
            }}
          />
        </div>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
        >
          {category.currentAvg.toFixed(1)}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/{category.maxScore}</span>
        </span>
      </div>

      {/* Sparkline */}
      <div className="mb-3">
        <Sparkline history={category.history} color={catColor} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
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
      </div>

      {/* Coaching tip */}
      {tip && (
        <div
          className="rounded-lg p-2.5 flex items-start gap-2"
          style={{ backgroundColor: `${catColor}08` }}
        >
          <Lightbulb size={11} className="mt-0.5 flex-shrink-0" style={{ color: catColor, opacity: 0.7 }} />
          <span className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
            {tip}
          </span>
        </div>
      )}

      {/* Recent fixes */}
      {category.recentFixes.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div
            className="text-[10px] font-semibold uppercase tracking-wide mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Recent Fixes
          </div>
          <div className="flex flex-col gap-1.5">
            {category.recentFixes.slice(0, 2).map((fix, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <TrendingUp size={10} className="mt-0.5 shrink-0" style={{ color: catColor }} />
                <span
                  className="text-[11px] leading-snug line-clamp-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {fix.fix}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
