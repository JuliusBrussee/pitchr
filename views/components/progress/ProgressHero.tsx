'use client';

import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, Zap } from 'lucide-react';
import type { ProgressSummary } from '@/lib/progress';

/* ——— Level System ——— */

const LEVELS = [
  { name: 'Rough Draft', minScore: 0, maxScore: 24, tier: 1 },
  { name: 'Finding Your Voice', minScore: 25, maxScore: 39, tier: 2 },
  { name: 'Structured Story', minScore: 40, maxScore: 54, tier: 3 },
  { name: 'Confident Founder', minScore: 55, maxScore: 69, tier: 4 },
  { name: 'Polished Pitcher', minScore: 70, maxScore: 84, tier: 5 },
  { name: 'Investor-Ready', minScore: 85, maxScore: 100, tier: 6 },
];

function getLevel(score: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].minScore) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(score: number) {
  const current = getLevel(score);
  const idx = LEVELS.findIndex((l) => l.name === current.name);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

function getLevelColor(tier: number): string {
  const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#22c55e'];
  return colors[tier - 1] ?? '#6b7280';
}

function getCompetitiveContext(score: number, sessions: number): string {
  if (score >= 85) return 'You\'re in the top tier. Most funded startups pitch at this level.';
  if (score >= 70) return 'Top YC founders average 75+ by their third practice session.';
  if (score >= 55) return 'Founders who reach 70+ are 3x more likely to close their round.';
  if (score >= 40) return 'Most founders start here. The ones who iterate fastest win.';
  if (sessions <= 2) return 'Your first sessions matter most. Founders improve 15+ pts in 3 sessions.';
  return 'Consistent practice separates funded founders from the rest.';
}

/* ——— Score Ring SVG ——— */

function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 160;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / 100, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full animate-glow-pulse"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          filter: 'blur(12px)',
        }}
      />
      <svg
        width={size}
        height={size}
        className="relative"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-score-ring"
          style={{
            '--ring-circumference': circumference,
            '--ring-offset': offset,
            filter: `drop-shadow(0 0 6px ${color}60)`,
          } as React.CSSProperties}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[42px] font-bold tabular-nums leading-none"
          style={{ color: 'var(--text-primary)' }}
        >
          {score}
        </span>
        <span
          className="text-[11px] font-medium uppercase tracking-widest mt-0.5"
          style={{ color: 'var(--text-muted)' }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}

/* ——— XP Progress Bar ——— */

function XPBar({
  current,
  min,
  max,
  nextLevelName,
  color,
}: {
  current: number;
  min: number;
  max: number;
  nextLevelName: string | null;
  color: string;
}) {
  const range = max - min;
  const progress = range > 0 ? Math.min(((current - min) / range) * 100, 100) : 100;
  const pointsToNext = Math.max(0, max + 1 - current);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {nextLevelName ? `${pointsToNext} pts to ${nextLevelName}` : 'Max level reached'}
        </span>
        <span
          className="text-[10px] font-bold tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {current}/{max + 1}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden relative"
        style={{ backgroundColor: 'var(--border-color)' }}
      >
        <div
          className="h-full rounded-full animate-bar-fill relative"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
        {/* Level markers */}
        {LEVELS.slice(1, -1).map((level) => {
          const markerPos = range > 0 ? ((level.minScore - min) / range) * 100 : 0;
          if (markerPos <= 0 || markerPos >= 100) return null;
          return (
            <div
              key={level.tier}
              className="absolute top-0 h-full w-px"
              style={{
                left: `${markerPos}%`,
                backgroundColor: 'var(--bg-primary)',
                opacity: 0.4,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ——— Level Tier Dots ——— */

function LevelTierDots({ currentTier }: { currentTier: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {LEVELS.map((level) => (
        <div
          key={level.tier}
          className="rounded-full transition-all duration-500"
          style={{
            width: level.tier === currentTier ? 20 : 6,
            height: 6,
            backgroundColor:
              level.tier <= currentTier
                ? getLevelColor(currentTier)
                : 'var(--border-color)',
            opacity: level.tier <= currentTier ? 1 : 0.3,
            boxShadow:
              level.tier === currentTier
                ? `0 0 8px ${getLevelColor(currentTier)}60`
                : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ——— Main Component ——— */

interface ProgressHeroProps {
  progress: ProgressSummary;
  latestScore: number;
  animationDelay?: string;
  streak?: number;
  sessionCount?: number;
}

export function ProgressHero({ progress, latestScore, animationDelay, streak, sessionCount }: ProgressHeroProps) {
  const level = useMemo(() => getLevel(latestScore), [latestScore]);
  const nextLevel = useMemo(() => getNextLevel(latestScore), [latestScore]);
  const color = getLevelColor(level.tier);
  const context = getCompetitiveContext(latestScore, progress.totalSessions);

  const DeltaIcon =
    progress.overallDelta > 0 ? ArrowUp : progress.overallDelta < 0 ? ArrowDown : Minus;
  const deltaColor =
    progress.overallDelta > 0 ? '#22c55e' : progress.overallDelta < 0 ? '#ef4444' : 'var(--text-muted)';

  return (
    <div
      className="rounded-2xl border p-6 animate-fade-in-up relative"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
        animationDelay: animationDelay ?? '0ms',
        animationFillMode: 'both',
      }}
    >
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 20% 50%, ${color}08 0%, transparent 60%)`,
        }}
      />

      <div className="relative flex items-center gap-8">
        {/* Score Ring */}
        <div className="flex-shrink-0">
          <ScoreRing score={latestScore} color={color} />
        </div>

        {/* Level Info */}
        <div className="flex-1 min-w-0">
          {/* Level tier dots */}
          <LevelTierDots currentTier={level.tier} />

          {/* Level name */}
          <h2
            className="text-2xl font-bold mt-2 mb-0.5"
            style={{
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {level.name}
          </h2>

          {/* Tier label */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Level {level.tier} of {LEVELS.length}
            </span>
            {progress.overallDelta !== 0 && (
              <span className="flex items-center gap-0.5" style={{ color: deltaColor }}>
                <DeltaIcon size={11} />
                <span className="text-[11px] font-bold tabular-nums">
                  {progress.overallDelta > 0 ? '+' : ''}{progress.overallDelta} pts
                </span>
              </span>
            )}
          </div>

          {/* XP Bar */}
          <XPBar
            current={latestScore}
            min={level.minScore}
            max={level.maxScore}
            nextLevelName={nextLevel?.name ?? null}
            color={color}
          />

          {/* Competitive context */}
          <div className="flex items-start gap-1.5 mt-3">
            <Zap size={11} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <span
              className="text-[11px] leading-snug"
              style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
            >
              {context}
            </span>
          </div>
        </div>

        {/* Streak & Sessions (shown when props provided) */}
        {(streak != null || sessionCount != null) && (
          <div className="flex flex-col gap-3 flex-shrink-0 pr-1">
            {streak != null && (
              <div className="text-center">
                <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Streak
                </div>
                <div className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: '#ffaa33' }}>
                  {streak}
                </div>
              </div>
            )}
            {sessionCount != null && (
              <div className="text-center">
                <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Sessions
                </div>
                <div className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {sessionCount}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
