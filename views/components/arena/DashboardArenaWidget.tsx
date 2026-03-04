'use client';

import Link from 'next/link';
import { Flame, Trophy, Swords, Gamepad2, ArrowRight } from 'lucide-react';
import { useArenaStats } from '@/hooks/useArenaStats';
import { GlassCard } from '@/views/components/ui/GlassCard';
import { Skeleton } from '@/views/components/ui/Skeleton';
import type { LeagueTier } from '@/config/arena';

/* ——— Constants ——— */

const TIER_COLORS: Record<LeagueTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffaa33',
  diamond: '#b9f2ff',
  champion: '#ff5941',
};

const TIER_LABELS: Record<LeagueTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
  champion: 'Champion',
};

const XP_PER_LEVEL = 200;

function getLevel(totalXp: number): { level: number; progress: number } {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const progress = (totalXp % XP_PER_LEVEL) / XP_PER_LEVEL;
  return { level, progress };
}

/* ——— Sub-components ——— */

function WidgetSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

function EmptyArenaState() {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex items-center gap-2">
        <Swords size={18} style={{ color: 'var(--text-muted)' }} />
        <span
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Start your arena journey
        </span>
      </div>
      <Link href="/arena" className="no-underline">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-0 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
          style={{
            backgroundColor: '#ff5941',
            color: '#fff',
          }}
        >
          <Swords size={14} />
          Enter Arena
        </button>
      </Link>
    </div>
  );
}

/* ——— Main Widget ——— */

export function DashboardArenaWidget() {
  const { stats, isLoading } = useArenaStats();

  return (
    <GlassCard animationDelay="0.5s" className="dash-hover-depth">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#ff594115', color: '#ff5941' }}
          >
            <Swords size={14} />
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Arena
          </span>
        </div>
        <Link
          href="/arena"
          className="text-xs font-medium no-underline flex items-center gap-1 transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          View All
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <WidgetSkeleton />
      ) : !stats ? (
        <EmptyArenaState />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Stat row */}
          <div className="grid grid-cols-4 gap-2">
            {/* Streak */}
            <div
              className="rounded-xl border p-2.5 text-center"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame size={12} style={{ color: '#ffaa33' }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Streak
                </span>
              </div>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: '#ffaa33' }}
              >
                {stats.currentStreak}
              </span>
            </div>

            {/* League Tier */}
            <div
              className="rounded-xl border p-2.5 text-center"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy size={12} style={{ color: TIER_COLORS[stats.currentLeagueTier] }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  League
                </span>
              </div>
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={{
                  color: TIER_COLORS[stats.currentLeagueTier],
                  backgroundColor: `${TIER_COLORS[stats.currentLeagueTier]}15`,
                }}
              >
                {TIER_LABELS[stats.currentLeagueTier]}
              </span>
            </div>

            {/* XP + Level */}
            <div
              className="rounded-xl border p-2.5 text-center"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Level
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: '#ff5941' }}
                >
                  {getLevel(stats.totalXp).level}
                </span>
                {/* XP progress bar */}
                <div
                  className="w-full h-1 rounded-full mt-1"
                  style={{ backgroundColor: 'var(--bg-surface-hover)' }}
                >
                  <div
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(getLevel(stats.totalXp).progress * 100)}%`,
                      backgroundColor: '#ff5941',
                    }}
                  />
                </div>
                <span
                  className="text-[9px] tabular-nums mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {stats.totalXp.toLocaleString()} XP
                </span>
              </div>
            </div>

            {/* Games Played */}
            <div
              className="rounded-xl border p-2.5 text-center"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gamepad2 size={12} style={{ color: 'var(--text-muted)' }} />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Games
                </span>
              </div>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {stats.gameModeCompleted}
              </span>
            </div>
          </div>

          {/* CTA: Play Game Mode */}
          <Link href="/arena/game-mode" className="no-underline block">
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-0 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #ff5941, #ffaa33)',
                color: '#fff',
              }}
            >
              <Gamepad2 size={15} />
              Play Game Mode
              <ArrowRight size={14} />
            </button>
          </Link>
        </div>
      )}
    </GlassCard>
  );
}
