'use client';

import Link from 'next/link';
import {
  Gamepad2,
  Swords,
  Trophy,
  Star,
  Flame,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { GlassCard } from '@/views/components/ui/GlassCard';
import { Skeleton } from '@/views/components/ui/Skeleton';
import { useArenaStats } from '@/hooks/useArenaStats';

export default function ArenaPage() {
  const { stats, isLoading } = useArenaStats();

  return (
    <main
      className="flex-1 overflow-y-auto rounded-2xl border p-8"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0s', animationFillMode: 'both' }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Arena
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Compete, practice, and level up your pitch skills.
          </p>
        </div>

        {/* Stats strip */}
        <div
          className="grid grid-cols-3 gap-4 animate-fade-in-up"
          style={{ animationDelay: '0.08s', animationFillMode: 'both' }}
        >
          <GlassCard padding="sm" animate={false}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#ffaa331a', color: '#ffaa33' }}
              >
                <Star size={16} />
              </div>
              <div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider block"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total XP
                </span>
                {isLoading ? (
                  <Skeleton className="h-5 w-12 mt-0.5" />
                ) : (
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {(stats?.totalXp ?? 0).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="sm" animate={false}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#ff59411a', color: '#ff5941' }}
              >
                <Flame size={16} />
              </div>
              <div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider block"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Streak
                </span>
                {isLoading ? (
                  <Skeleton className="h-5 w-8 mt-0.5" />
                ) : (
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {stats?.currentStreak ?? 0}d
                  </span>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="sm" animate={false}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#a855f71a', color: '#a855f7' }}
              >
                <Trophy size={16} />
              </div>
              <div>
                <span
                  className="text-xs font-semibold uppercase tracking-wider block"
                  style={{ color: 'var(--text-muted)' }}
                >
                  High Score
                </span>
                {isLoading ? (
                  <Skeleton className="h-5 w-10 mt-0.5" />
                ) : (
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {stats?.highestScore ?? 0}
                  </span>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Arena sections */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Game Mode - Active */}
          <Link href="/arena/game-mode" className="no-underline block">
            <GlassCard
              animationDelay="0.16s"
              className="h-full cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              style={{ borderColor: '#ff594140' }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#ff59411a', color: '#ff5941' }}
                >
                  <Gamepad2 size={24} />
                </div>
                <h3
                  className="text-base font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Game Mode
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Random scenario, timed pitch. Pick your difficulty and go.
                </p>
                <div
                  className="flex items-center gap-1 text-xs font-semibold mt-1"
                  style={{ color: '#ff5941' }}
                >
                  Play Now
                  <ArrowRight size={12} />
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* Challenges - Coming Soon */}
          <GlassCard
            animationDelay="0.24s"
            className="h-full opacity-60"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}
              >
                <Swords size={24} />
              </div>
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Challenges
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Weekly community challenges. Pitch the same scenario, compete on score.
              </p>
              <div
                className="flex items-center gap-1.5 text-xs font-semibold mt-1 px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-muted)',
                }}
              >
                <Lock size={10} />
                Coming Soon
              </div>
            </div>
          </GlassCard>

          {/* Leagues - Coming Soon */}
          <GlassCard
            animationDelay="0.32s"
            className="h-full opacity-60"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}
              >
                <Trophy size={24} />
              </div>
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Leagues
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Climb the ranks from Bronze to Champion. Earn XP to promote each week.
              </p>
              <div
                className="flex items-center gap-1.5 text-xs font-semibold mt-1 px-2.5 py-1 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-muted)',
                }}
              >
                <Lock size={10} />
                Coming Soon
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
