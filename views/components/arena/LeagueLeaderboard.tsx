'use client';

import { useEffect, useState } from 'react';
import { Trophy, Crown, Medal, Clock, Users, ChevronUp } from 'lucide-react';
import { GlassCard } from '@/views/components/ui/GlassCard';
import { Skeleton } from '@/views/components/ui/Skeleton';
import { PromotionZoneSeparator, ZoneIndicator, ZoneBadge } from '@/views/components/arena/PromotionZone';
import type { League, LeagueMembership } from '@/types/arena';
import type { LeagueTier } from '@/config/arena';
import { LEAGUE_CONFIG } from '@/config/arena';

/* ——————————————————————————————————————————————————————————
 * Tier visual config
 * —————————————————————————————————————————————————————————— */

const TIER_CONFIG: Record<LeagueTier, { label: string; color: string; bgColor: string; Icon: typeof Trophy }> = {
  bronze:   { label: 'Bronze',   color: '#cd7f32', bgColor: '#cd7f3215', Icon: Medal },
  silver:   { label: 'Silver',   color: '#c0c0c0', bgColor: '#c0c0c015', Icon: Medal },
  gold:     { label: 'Gold',     color: '#ffaa33', bgColor: '#ffaa3315', Icon: Trophy },
  diamond:  { label: 'Diamond',  color: '#60a5fa', bgColor: '#60a5fa15', Icon: Crown },
  champion: { label: 'Champion', color: '#a855f7', bgColor: '#a855f715', Icon: Crown },
};

/* ——————————————————————————————————————————————————————————
 * Countdown hook — time until next Monday 00:00 UTC
 * —————————————————————————————————————————————————————————— */

function useLeagueCountdown(endsAt: string) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const now = Date.now();
      const end = new Date(endsAt).getTime();
      const diff = Math.max(0, end - now);

      if (diff === 0) {
        setTimeLeft('League ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return timeLeft;
}

/* ——————————————————————————————————————————————————————————
 * Determine zone for a given rank
 * —————————————————————————————————————————————————————————— */

type ZoneType = 'promotion' | 'safe' | 'demotion';

function getZone(rank: number, totalMembers: number): ZoneType {
  if (rank <= LEAGUE_CONFIG.PROMOTION_COUNT) return 'promotion';
  if (rank > totalMembers - LEAGUE_CONFIG.DEMOTION_COUNT) return 'demotion';
  return 'safe';
}

/* ——————————————————————————————————————————————————————————
 * Rank icon (top 3)
 * —————————————————————————————————————————————————————————— */

const RANK_COLORS: Record<number, string> = {
  1: '#ffaa33',
  2: '#c0c0c0',
  3: '#cd7f32',
};

function RankIcon({ rank }: { rank: number }) {
  const color = RANK_COLORS[rank];
  if (rank === 1) return <Crown size={14} style={{ color }} />;
  if (rank === 2) return <Medal size={14} style={{ color }} />;
  if (rank === 3) return <Trophy size={14} style={{ color }} />;
  return null;
}

function getUserLabel(_userId: string, displayName?: string): string {
  if (displayName) return displayName;
  return 'Anonymous Pitcher';
}

/* ——————————————————————————————————————————————————————————
 * League member row
 * —————————————————————————————————————————————————————————— */

interface LeagueMemberRowProps {
  membership: LeagueMembership;
  rank: number;
  isCurrentUser: boolean;
  zone: ZoneType;
}

function LeagueMemberRow({ membership, rank, isCurrentUser, zone }: LeagueMemberRowProps) {
  const isTopThree = rank <= 3;
  const rankColor = RANK_COLORS[rank] ?? 'var(--text-secondary)';

  return (
    <ZoneIndicator zone={zone}>
      <div
        className="flex items-center gap-3 py-2.5 px-3 transition-colors duration-150"
        style={{
          backgroundColor: isCurrentUser ? '#ff594115' : 'transparent',
        }}
      >
        {/* Rank */}
        <div className="flex items-center gap-1.5 w-12 flex-shrink-0">
          {isTopThree && <RankIcon rank={rank} />}
          <span
            className={`text-sm tabular-nums ${isTopThree ? 'font-bold' : 'font-medium'}`}
            style={{ color: rankColor }}
          >
            #{rank}
          </span>
        </div>

        {/* User */}
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm truncate ${isCurrentUser ? 'font-semibold' : 'font-medium'}`}
            style={{ color: isCurrentUser ? '#ff5941' : 'var(--text-primary)' }}
          >
            {getUserLabel(membership.userId, membership.displayName)}
            {isCurrentUser && (
              <span
                className="ml-1.5 text-xs font-semibold"
                style={{ color: '#ff5941' }}
              >
                (you)
              </span>
            )}
          </span>
        </div>

        {/* Weekly XP */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ChevronUp size={12} style={{ color: '#ffaa33' }} />
          <span
            className="text-sm tabular-nums font-semibold"
            style={{ color: '#ffaa33' }}
          >
            {membership.weeklyXp.toLocaleString()}
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            XP
          </span>
        </div>
      </div>
    </ZoneIndicator>
  );
}

/* ——————————————————————————————————————————————————————————
 * Loading skeleton
 * —————————————————————————————————————————————————————————— */

function LeagueLeaderboardSkeleton() {
  return (
    <GlassCard className="w-full" padding="sm">
      <div className="px-3 pt-2 pb-3">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 px-3">
            <Skeleton className="h-4 w-8 flex-shrink-0" />
            <Skeleton className="h-4 w-24 flex-1" />
            <Skeleton className="h-4 w-16 flex-shrink-0" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ——————————————————————————————————————————————————————————
 * Main component
 * —————————————————————————————————————————————————————————— */

interface LeagueLeaderboardProps {
  league: League & { memberships: LeagueMembership[] };
  currentUserId?: string;
  isLoading?: boolean;
}

export function LeagueLeaderboard({
  league,
  currentUserId,
  isLoading,
}: LeagueLeaderboardProps) {
  const timeLeft = useLeagueCountdown(league.endsAt);
  const tier = TIER_CONFIG[league.tier];

  if (isLoading) {
    return <LeagueLeaderboardSkeleton />;
  }

  /* Sort memberships by weekly XP descending */
  const sorted = [...league.memberships].sort((a, b) => {
    if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const totalMembers = sorted.length;

  /* Find current user's rank */
  const currentUserRank = currentUserId
    ? sorted.findIndex((m) => m.userId === currentUserId) + 1
    : 0;
  const currentUserZone = currentUserRank > 0
    ? getZone(currentUserRank, totalMembers)
    : 'safe' as ZoneType;

  /* Determine zone boundaries */
  const promotionCutoff = LEAGUE_CONFIG.PROMOTION_COUNT;
  const demotionCutoff = totalMembers - LEAGUE_CONFIG.DEMOTION_COUNT;

  return (
    <GlassCard className="w-full overflow-hidden" padding="sm">
      {/* Header: Tier badge + countdown */}
      <div className="px-3 pt-2 pb-3">
        <div className="flex items-center justify-between mb-2">
          {/* Tier badge */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ backgroundColor: tier.bgColor }}
            >
              <tier.Icon size={18} style={{ color: tier.color }} />
            </div>
            <div>
              <h3
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: tier.color }}
              >
                {tier.label} League
              </h3>
              <span
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Week {league.weekNumber}, {league.year}
              </span>
            </div>
          </div>

          {/* Current user zone badge */}
          {currentUserRank > 0 && (
            <ZoneBadge zone={currentUserZone} />
          )}
        </div>

        {/* Countdown + member count */}
        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-1.5">
            <Clock size={12} style={{ color: 'var(--text-muted)' }} />
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: 'var(--text-secondary)' }}
            >
              {timeLeft}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={12} style={{ color: 'var(--text-muted)' }} />
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {totalMembers} member{totalMembers !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Column headers */}
      <div
        className="flex items-center gap-3 py-2 px-3"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-wider w-12 flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          Rank
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider flex-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Pitcher
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 text-right"
          style={{ color: 'var(--text-muted)' }}
        >
          Weekly XP
        </span>
      </div>

      {/* Ranked member list with zone separators */}
      <div>
        {sorted.map((membership, index) => {
          const rank = index + 1;
          const isCurrentUser = currentUserId === membership.userId;
          const zone = getZone(rank, totalMembers);

          /* Insert zone separators at boundaries */
          const showPromotionSeparator = rank === 1;
          const showDemotionSeparator = rank === demotionCutoff + 1 && totalMembers > LEAGUE_CONFIG.DEMOTION_COUNT;
          const showSafeSeparator = rank === promotionCutoff + 1 && totalMembers > LEAGUE_CONFIG.PROMOTION_COUNT;

          return (
            <div key={membership.id}>
              {showPromotionSeparator && (
                <PromotionZoneSeparator type="promotion" />
              )}
              {showSafeSeparator && (
                <div
                  className="h-px mx-3"
                  style={{ backgroundColor: 'var(--border-color)' }}
                />
              )}
              {showDemotionSeparator && (
                <PromotionZoneSeparator type="demotion" />
              )}
              <LeagueMemberRow
                membership={membership}
                rank={rank}
                isCurrentUser={isCurrentUser}
                zone={zone}
              />
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {totalMembers === 0 && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Trophy size={28} style={{ color: 'var(--text-muted)' }} />
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            No members yet
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Earn XP to join a league!
          </p>
        </div>
      )}
    </GlassCard>
  );
}

export { LeagueLeaderboardSkeleton };
