'use client';

import Link from 'next/link';
import {
  Trophy,
  Flame,
  Gamepad2,
  Swords,
  Target,
  TrendingUp,
  Crown,
  ArrowRight,
  Star,
} from 'lucide-react';
import { GlassCard, Skeleton, SkeletonCard } from '@/views/components/ui';
import { ChallengeCard } from '@/views/components/arena/ChallengeCard';
import { useArenaStats } from '@/hooks/useArenaStats';
import { useChallenge } from '@/hooks/useChallenge';
import type { LeagueTier } from '@/config/arena';

/* ——— League display helpers ——— */

const LEAGUE_TIER_CONFIG: Record<LeagueTier, { label: string; color: string; icon: typeof Crown }> = {
  bronze:   { label: 'Bronze',   color: '#cd7f32', icon: Trophy },
  silver:   { label: 'Silver',   color: '#a8a9ad', icon: Trophy },
  gold:     { label: 'Gold',     color: '#ffaa33', icon: Trophy },
  diamond:  { label: 'Diamond',  color: '#3b82f6', icon: Crown },
  champion: { label: 'Champion', color: '#a855f7', icon: Crown },
};

const DIFFICULTY_LABELS = [
  { label: 'Starter', color: '#22c55e' },
  { label: 'Pro', color: '#ffaa33' },
  { label: 'Expert', color: '#ff5941' },
];

/* ——— XP bar ——— */

function XpBar({ totalXp, isLoading }: { totalXp: number; isLoading: boolean }) {
  // XP levels: every 500 XP = 1 level
  const XP_PER_LEVEL = 500;
  const level = Math.floor(totalXp / XP_PER_LEVEL);
  const currentLevelXp = totalXp % XP_PER_LEVEL;
  const progress = (currentLevelXp / XP_PER_LEVEL) * 100;

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: '#ffaa331a', color: '#ffaa33' }}
      >
        {level}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            Level {level}
          </span>
          <span
            className="text-xs tabular-nums"
            style={{ color: 'var(--text-muted)' }}
          >
            {currentLevelXp} / {XP_PER_LEVEL} XP
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ff5941, #ffaa33)',
            }}
          />
        </div>
      </div>
      <div
        className="flex items-center gap-1.5 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <Star size={14} style={{ color: '#ffaa33' }} />
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {totalXp.toLocaleString()}
        </span>
        <span className="text-xs">XP</span>
      </div>
    </div>
  );
}

/* ——— Streak tracker ——— */

function StreakTracker({ streak, isLoading }: { streak: number; isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
        style={{
          backgroundColor: streak > 0 ? '#ff59411a' : 'var(--bg-surface-hover)',
          color: streak > 0 ? '#ff5941' : 'var(--text-muted)',
        }}
      >
        <Flame size={14} />
        <span className="text-sm font-bold tabular-nums">{streak}</span>
        <span className="text-xs font-medium">day{streak !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

/* ——— Main page ——— */

export default function ArenaPage() {
  const { stats, isLoading: statsLoading } = useArenaStats();
  const { challenge, userSubmission, isLoading: challengeLoading } = useChallenge();

  const isLoading = statsLoading;
  const tier = stats?.currentLeagueTier ?? 'bronze';
  const tierConfig = LEAGUE_TIER_CONFIG[tier];

  return (
    <main
      className="flex-1 overflow-y-auto rounded-2xl border p-6 sm:p-8"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-6">

        {/* ——— Header: Title + XP bar + Streak ——— */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0s', animationFillMode: 'both' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Pitch Arena
              </h1>
              <p
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Compete, practice, and level up your pitch skills.
              </p>
            </div>
            <StreakTracker streak={stats?.currentStreak ?? 0} isLoading={isLoading} />
          </div>
          <GlassCard padding="sm" animate={false}>
            <XpBar totalXp={stats?.totalXp ?? 0} isLoading={isLoading} />
          </GlassCard>
        </div>

        {/* ——— Two-column grid (desktop) ——— */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ——— Left column ——— */}
          <div className="flex flex-col gap-6">

            {/* Active Challenge Card */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.08s', animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Swords size={16} style={{ color: '#ff5941' }} />
                  <h2
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Active Challenge
                  </h2>
                </div>
                {challenge && (
                  <Link
                    href={`/arena/challenge/${challenge.id}`}
                    className="text-xs font-semibold no-underline flex items-center gap-1"
                    style={{ color: '#ff5941' }}
                  >
                    View <ArrowRight size={12} />
                  </Link>
                )}
              </div>
              {challengeLoading ? (
                <SkeletonCard />
              ) : challenge && challenge.status === 'active' ? (
                <ChallengeCard
                  challenge={challenge}
                  userSubmission={userSubmission}
                />
              ) : (
                <GlassCard animate={false}>
                  <div className="flex flex-col items-center text-center py-4 gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-muted)' }}
                    >
                      <Swords size={20} />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      No active challenge
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      New challenges drop every week. Check back soon!
                    </p>
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Game Mode Entry */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.16s', animationFillMode: 'both' }}
            >
              <Link href="/arena/game-mode" className="no-underline block">
                <GlassCard
                  animate={false}
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                  style={{ borderColor: '#ff594140' }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#ff59411a', color: '#ff5941' }}
                    >
                      <Gamepad2 size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base font-bold mb-1"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Game Mode
                      </h3>
                      <p
                        className="text-xs leading-relaxed mb-3"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Random scenario, timed pitch. Pick your difficulty and go.
                      </p>
                      <div className="flex items-center gap-2">
                        {DIFFICULTY_LABELS.map((d) => (
                          <span
                            key={d.label}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: `${d.color}1a`, color: d.color }}
                          >
                            {d.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1 text-xs font-semibold flex-shrink-0 mt-1"
                      style={{ color: '#ff5941' }}
                    >
                      Play
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </div>

            {/* All-Time Leaderboard link */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.24s', animationFillMode: 'both' }}
            >
              <Link href="/arena/leaderboard" className="no-underline block">
                <GlassCard
                  animate={false}
                  padding="sm"
                  className="cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#a855f71a', color: '#a855f7' }}
                      >
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <span
                          className="text-sm font-bold block"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          All-Time Leaderboard
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          See top pitchers worldwide
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </GlassCard>
              </Link>
            </div>
          </div>

          {/* ——— Right column ——— */}
          <div className="flex flex-col gap-6">

            {/* League Standings (compact) */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.10s', animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Crown size={16} style={{ color: tierConfig.color }} />
                <h2
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  League Standing
                </h2>
              </div>
              {isLoading ? (
                <SkeletonCard />
              ) : stats?.currentLeagueTier && stats.currentLeagueTier !== 'bronze' ? (
                <GlassCard
                  animate={false}
                  style={{ borderColor: `${tierConfig.color}40` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tierConfig.color}1a`, color: tierConfig.color }}
                    >
                      <tierConfig.icon size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-lg font-bold block"
                        style={{ color: tierConfig.color }}
                      >
                        {tierConfig.label} League
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Keep earning XP to climb the ranks
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className="text-2xl font-bold tabular-nums block"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {stats.totalXp.toLocaleString()}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-wider font-semibold"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Total XP
                      </span>
                    </div>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard animate={false}>
                  <div className="flex flex-col items-center text-center py-4 gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#cd7f321a', color: '#cd7f32' }}
                    >
                      <Trophy size={20} />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {tier === 'bronze' ? 'Bronze League' : 'Join Pro to compete in leagues'}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {tier === 'bronze'
                        ? 'Earn XP to promote to Silver at the end of the week.'
                        : 'Pro members get access to ranked leagues and weekly promotions.'}
                    </p>
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Quick Stats */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '0.18s', animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} style={{ color: '#ffaa33' }} />
                <h2
                  className="text-sm font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Quick Stats
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <GlassCard padding="sm" animate={false}>
                  <div className="flex flex-col items-center text-center gap-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                      style={{ backgroundColor: '#3b82f61a', color: '#3b82f6' }}
                    >
                      <Swords size={14} />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-8" />
                    ) : (
                      <span
                        className="text-xl font-bold tabular-nums"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {stats?.challengesCompleted ?? 0}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Challenges
                    </span>
                  </div>
                </GlassCard>

                <GlassCard padding="sm" animate={false}>
                  <div className="flex flex-col items-center text-center gap-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                      style={{ backgroundColor: '#ff59411a', color: '#ff5941' }}
                    >
                      <Gamepad2 size={14} />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-8" />
                    ) : (
                      <span
                        className="text-xl font-bold tabular-nums"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {stats?.gameModeCompleted ?? 0}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Game Mode
                    </span>
                  </div>
                </GlassCard>

                <GlassCard padding="sm" animate={false}>
                  <div className="flex flex-col items-center text-center gap-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                      style={{ backgroundColor: '#ffaa331a', color: '#ffaa33' }}
                    >
                      <Trophy size={14} />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-8" />
                    ) : (
                      <span
                        className="text-xl font-bold tabular-nums"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {stats?.highestScore ?? 0}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Best Score
                    </span>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
