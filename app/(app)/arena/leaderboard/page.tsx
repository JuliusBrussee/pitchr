'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Crown,
  Medal,
  TrendingUp,
  Swords,
  ChevronDown,
  RefreshCw,
  Star,
  Award,
} from 'lucide-react';
import { GlassCard, Skeleton, SkeletonCard } from '@/views/components/ui';
import { LeagueLeaderboard } from '@/views/components/arena/LeagueLeaderboard';
import { ChallengeLeaderboard } from '@/views/components/arena/ChallengeLeaderboard';
import { useAuth } from '@/views/components/AuthProvider';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useArenaStats } from '@/hooks/useArenaStats';
import type { LeagueTier } from '@/config/arena';
import type { UserStats } from '@/types/arena';

/* ——— Constants ——— */

type TabId = 'league' | 'alltime' | 'challenge';

const TABS: { id: TabId; label: string; Icon: typeof Trophy }[] = [
  { id: 'league', label: 'League', Icon: Crown },
  { id: 'alltime', label: 'All-Time', Icon: TrendingUp },
  { id: 'challenge', label: 'Challenge', Icon: Swords },
];

const SORT_OPTIONS = [
  { value: 'total_xp' as const, label: 'XP' },
  { value: 'highest_score' as const, label: 'Best Score' },
  { value: 'challenge_wins' as const, label: 'Challenge Wins' },
];

const TIER_COLORS: Record<LeagueTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffaa33',
  diamond: '#60a5fa',
  champion: '#a855f7',
};

const RANK_COLORS: Record<number, string> = {
  1: '#ffaa33',
  2: '#c0c0c0',
  3: '#cd7f32',
};

/* ——— Podium card for top 3 ——— */

function PodiumCard({ entry, rank, isCurrentUser }: { entry: UserStats; rank: number; isCurrentUser: boolean }) {
  const color = RANK_COLORS[rank]!;
  const isFirst = rank === 1;
  const Icon = rank === 1 ? Crown : rank === 2 ? Medal : Trophy;

  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all duration-200 ${isFirst ? 'sm:-mt-4' : ''}`}
      style={{
        backgroundColor: isCurrentUser ? '#ff594115' : 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: isCurrentUser ? '#ff594140' : `${color}30`,
        flex: isFirst ? '1.2' : '1',
      }}
    >
      {/* Rank icon */}
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: isFirst ? 48 : 40,
          height: isFirst ? 48 : 40,
          backgroundColor: `${color}1a`,
        }}
      >
        <Icon size={isFirst ? 24 : 20} style={{ color }} />
      </div>

      {/* Rank number */}
      <span
        className="text-xs font-bold uppercase tracking-wider"
        style={{ color }}
      >
        #{rank}
      </span>

      {/* Name */}
      <span
        className="text-sm font-semibold truncate max-w-full text-center"
        style={{ color: isCurrentUser ? '#ff5941' : 'var(--text-primary)' }}
      >
        {entry.displayName || `${entry.userId.slice(0, 6)}...`}
        {isCurrentUser && (
          <span className="text-xs ml-1" style={{ color: '#ff5941' }}>(you)</span>
        )}
      </span>

      {/* Tier badge */}
      <span
        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
        style={{
          backgroundColor: `${TIER_COLORS[entry.currentLeagueTier]}1a`,
          color: TIER_COLORS[entry.currentLeagueTier],
        }}
      >
        {entry.currentLeagueTier}
      </span>

      {/* Stats */}
      <div className="flex items-center gap-1 mt-1">
        <Star size={12} style={{ color: '#ffaa33' }} />
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: '#ffaa33' }}
        >
          {entry.totalXp.toLocaleString()}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>XP</span>
      </div>

      {/* Badge count */}
      {entry.badges.length > 0 && (
        <div className="flex items-center gap-1">
          <Award size={10} style={{ color: 'var(--text-muted)' }} />
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {entry.badges.length} badge{entry.badges.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/* ——— All-time table row ——— */

function AllTimeRow({ entry, rank, isCurrentUser, sortKey }: {
  entry: UserStats;
  rank: number;
  isCurrentUser: boolean;
  sortKey: string;
}) {
  const rankColor = RANK_COLORS[rank] ?? 'var(--text-secondary)';
  const isTopThree = rank <= 3;
  const Icon = rank === 1 ? Crown : rank === 2 ? Medal : rank === 3 ? Trophy : null;

  return (
    <tr
      className="transition-colors duration-150"
      style={{ backgroundColor: isCurrentUser ? '#ff594115' : 'transparent' }}
    >
      {/* Rank */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          {Icon && <Icon size={14} style={{ color: rankColor }} />}
          <span
            className={`text-sm tabular-nums ${isTopThree ? 'font-bold' : 'font-medium'}`}
            style={{ color: rankColor }}
          >
            #{rank}
          </span>
        </div>
      </td>

      {/* User */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${isCurrentUser ? 'font-semibold' : 'font-medium'}`}
            style={{ color: isCurrentUser ? '#ff5941' : 'var(--text-primary)' }}
          >
            {entry.displayName || `${entry.userId.slice(0, 6)}...${entry.userId.slice(-4)}`}
            {isCurrentUser && (
              <span className="ml-1.5 text-xs font-semibold" style={{ color: '#ff5941' }}>(you)</span>
            )}
          </span>
        </div>
      </td>

      {/* Tier */}
      <td className="py-2.5 px-3 whitespace-nowrap hidden sm:table-cell">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
          style={{
            backgroundColor: `${TIER_COLORS[entry.currentLeagueTier]}1a`,
            color: TIER_COLORS[entry.currentLeagueTier],
          }}
        >
          {entry.currentLeagueTier}
        </span>
      </td>

      {/* Total XP */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <span
          className={`text-sm tabular-nums ${sortKey === 'total_xp' ? 'font-bold' : 'font-medium'}`}
          style={{ color: sortKey === 'total_xp' ? '#ffaa33' : 'var(--text-secondary)' }}
        >
          {entry.totalXp.toLocaleString()}
        </span>
      </td>

      {/* Best Score */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap hidden sm:table-cell">
        <span
          className={`text-sm tabular-nums ${sortKey === 'highest_score' ? 'font-bold' : 'font-medium'}`}
          style={{ color: sortKey === 'highest_score' ? '#ffaa33' : 'var(--text-secondary)' }}
        >
          {entry.highestScore}
        </span>
      </td>

      {/* Challenges */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap hidden md:table-cell">
        <span
          className="text-sm tabular-nums font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {entry.challengesCompleted}
        </span>
      </td>

      {/* Wins */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap hidden md:table-cell">
        <span
          className={`text-sm tabular-nums ${sortKey === 'challenge_wins' ? 'font-bold' : 'font-medium'}`}
          style={{ color: sortKey === 'challenge_wins' ? '#ffaa33' : 'var(--text-secondary)' }}
        >
          {entry.challengeWins}
        </span>
      </td>

      {/* Badges */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap hidden lg:table-cell">
        <span
          className="text-sm tabular-nums font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {entry.badges.length}
        </span>
      </td>
    </tr>
  );
}

/* ——— Loading skeleton ——— */

function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 rounded-2xl border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 px-3">
          <Skeleton className="h-4 w-8 flex-shrink-0" />
          <Skeleton className="h-4 w-24 flex-1" />
          <Skeleton className="h-4 w-16 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ——— Main Page ——— */

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { stats } = useArenaStats();
  const {
    league,
    alltimeLeaderboard,
    sort,
    setSort,
    challenges,
    challengeLeaderboard,
    isChallengeLoading,
    fetchChallengeLeaderboard,
    isLoading,
    error,
    refresh,
  } = useLeaderboard();

  const [activeTab, setActiveTab] = useState<TabId>('league');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');

  /* Auto-select first challenge when challenges load */
  useEffect(() => {
    if (challenges.length > 0 && !selectedChallengeId) {
      setSelectedChallengeId(challenges[0].id);
      fetchChallengeLeaderboard(challenges[0].id);
    }
  }, [challenges, selectedChallengeId, fetchChallengeLeaderboard]);

  /* Find current user rank in all-time */
  const currentUserRank = user
    ? alltimeLeaderboard.findIndex((e) => e.userId === user.id) + 1
    : 0;

  const handleChallengeSelect = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    fetchChallengeLeaderboard(challengeId);
  };

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId);

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
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* ——— Header ——— */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0s', animationFillMode: 'both' }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <Link
                href="/arena"
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors no-underline"
                style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
              >
                <ArrowLeft size={16} />
              </Link>
              <div className="flex items-center gap-2">
                <Trophy size={20} style={{ color: '#ffaa33' }} />
                <h1
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Leaderboard
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* User rank pill */}
              {currentUserRank > 0 && activeTab === 'alltime' && (
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full tabular-nums"
                  style={{ backgroundColor: '#ff59411a', color: '#ff5941' }}
                >
                  #{currentUserRank}
                </span>
              )}

              {/* Refresh */}
              <button
                onClick={() => refresh()}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors border-0 cursor-pointer"
                style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
                disabled={isLoading}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* ——— Tab bar ——— */}
        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0.05s', animationFillMode: 'both' }}
        >
          <div
            className="flex rounded-xl overflow-hidden border"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              backdropFilter: 'blur(var(--blur-strength))',
              WebkitBackdropFilter: 'blur(var(--blur-strength))',
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold transition-all duration-200 border-0 cursor-pointer relative"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    color: isActive ? '#ff5941' : 'var(--text-muted)',
                    borderBottom: isActive ? '2px solid #ff5941' : '2px solid transparent',
                  }}
                >
                  <tab.Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ——— Error state ——— */}
        {error && (
          <GlassCard animate={false}>
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm font-medium" style={{ color: '#ff5941' }}>{error}</p>
              <button
                onClick={() => refresh()}
                className="text-xs font-semibold px-4 py-2 rounded-lg border-0 cursor-pointer transition-colors"
                style={{ backgroundColor: '#ff59411a', color: '#ff5941' }}
              >
                Retry
              </button>
            </div>
          </GlassCard>
        )}

        {/* ——— Tab content ——— */}
        {!error && (
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
          >

            {/* League Tab */}
            {activeTab === 'league' && (
              isLoading ? (
                <SkeletonCard />
              ) : league ? (
                <LeagueLeaderboard
                  league={league}
                  currentUserId={user?.id}
                />
              ) : (
                <GlassCard animate={false}>
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: '#cd7f321a', color: '#cd7f32' }}
                    >
                      <Crown size={24} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Not in a league yet
                    </p>
                    <p className="text-xs text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
                      Pro members get placed into weekly leagues. Earn XP to climb the ranks and promote to higher tiers.
                    </p>
                  </div>
                </GlassCard>
              )
            )}

            {/* All-Time Tab */}
            {activeTab === 'alltime' && (
              <div className="flex flex-col gap-4">
                {/* Sort selector */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Ranked by
                  </span>
                  <div className="flex gap-1.5">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSort(opt.value)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer transition-all duration-200"
                        style={{
                          backgroundColor: sort === opt.value ? '#ff59411a' : 'var(--bg-surface)',
                          backdropFilter: 'blur(var(--blur-strength))',
                          WebkitBackdropFilter: 'blur(var(--blur-strength))',
                          borderColor: sort === opt.value ? '#ff594130' : 'var(--border-color)',
                          color: sort === opt.value ? '#ff5941' : 'var(--text-muted)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoading ? (
                  <LeaderboardSkeleton />
                ) : alltimeLeaderboard.length === 0 ? (
                  <GlassCard animate={false}>
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Trophy size={28} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        No data yet
                      </p>
                    </div>
                  </GlassCard>
                ) : (
                  <>
                    {/* Top 3 Podium */}
                    {alltimeLeaderboard.length >= 3 && (
                      <div className="flex gap-3 items-end">
                        {/* 2nd place */}
                        <PodiumCard
                          entry={alltimeLeaderboard[1]}
                          rank={2}
                          isCurrentUser={user?.id === alltimeLeaderboard[1].userId}
                        />
                        {/* 1st place */}
                        <PodiumCard
                          entry={alltimeLeaderboard[0]}
                          rank={1}
                          isCurrentUser={user?.id === alltimeLeaderboard[0].userId}
                        />
                        {/* 3rd place */}
                        <PodiumCard
                          entry={alltimeLeaderboard[2]}
                          rank={3}
                          isCurrentUser={user?.id === alltimeLeaderboard[2].userId}
                        />
                      </div>
                    )}

                    {/* Table for 4+ */}
                    {alltimeLeaderboard.length > 3 && (
                      <GlassCard animate={false} padding="sm" className="overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th className="py-2 px-3 text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Rank</th>
                                <th className="py-2 px-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Pitcher</th>
                                <th className="py-2 px-3 text-left text-[10px] font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Tier</th>
                                <th className="py-2 px-3 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>XP</th>
                                <th className="py-2 px-3 text-right text-[10px] font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Best</th>
                                <th className="py-2 px-3 text-right text-[10px] font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Done</th>
                                <th className="py-2 px-3 text-right text-[10px] font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Wins</th>
                                <th className="py-2 px-3 text-right text-[10px] font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Badges</th>
                              </tr>
                            </thead>
                            <tbody>
                              {alltimeLeaderboard.slice(3).map((entry, index) => (
                                <AllTimeRow
                                  key={entry.userId}
                                  entry={entry}
                                  rank={index + 4}
                                  isCurrentUser={user?.id === entry.userId}
                                  sortKey={sort}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </GlassCard>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Challenge Tab */}
            {activeTab === 'challenge' && (
              <div className="flex flex-col gap-4">
                {/* Challenge selector */}
                {challenges.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Select challenge
                      </span>
                      <div className="relative">
                        <select
                          value={selectedChallengeId}
                          onChange={(e) => handleChallengeSelect(e.target.value)}
                          className="appearance-none text-sm font-medium pl-3 pr-8 py-1.5 rounded-lg border cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            backdropFilter: 'blur(var(--blur-strength))',
                            WebkitBackdropFilter: 'blur(var(--blur-strength))',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {challenges.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title} ({c.status})
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </div>
                    </div>

                    {/* Challenge context */}
                    {selectedChallenge && (
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          backdropFilter: 'blur(var(--blur-strength))',
                          WebkitBackdropFilter: 'blur(var(--blur-strength))',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <Swords size={14} style={{ color: '#ff5941' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {selectedChallenge.title}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ml-auto"
                          style={{
                            backgroundColor: selectedChallenge.status === 'active' ? '#22c55e1a' : 'var(--bg-surface)',
                            color: selectedChallenge.status === 'active' ? '#22c55e' : 'var(--text-muted)',
                          }}
                        >
                          {selectedChallenge.status}
                        </span>
                      </div>
                    )}

                    {/* Challenge leaderboard */}
                    {isChallengeLoading ? (
                      <SkeletonCard />
                    ) : (
                      <ChallengeLeaderboard
                        submissions={challengeLeaderboard}
                        currentUserId={user?.id}
                        maxDisplay={50}
                      />
                    )}
                  </>
                ) : isLoading ? (
                  <SkeletonCard />
                ) : (
                  <GlassCard animate={false}>
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Swords size={28} style={{ color: 'var(--text-muted)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        No challenges yet
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Challenge leaderboards will appear here once challenges are created.
                      </p>
                    </div>
                  </GlassCard>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
