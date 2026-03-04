'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserStats, LeagueMembership, League, Challenge, ChallengeSubmission } from '@/types/arena';

type SortColumn = 'total_xp' | 'highest_score' | 'challenge_wins';

export interface UseLeaderboardReturn {
  league: (League & { memberships: LeagueMembership[] }) | null;
  alltimeLeaderboard: UserStats[];
  sort: SortColumn;
  setSort: (sort: SortColumn) => void;
  challenges: Challenge[];
  challengeLeaderboard: ChallengeSubmission[];
  isChallengeLoading: boolean;
  fetchChallengeLeaderboard: (challengeId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [league, setLeague] = useState<(League & { memberships: LeagueMembership[] }) | null>(null);
  const [alltimeLeaderboard, setAlltimeLeaderboard] = useState<UserStats[]>([]);
  const [sort, setSortState] = useState<SortColumn>('total_xp');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeLeaderboard, setChallengeLeaderboard] = useState<ChallengeSubmission[]>([]);
  const [isChallengeLoading, setIsChallengeLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [leagueRes, alltimeRes, challengesRes] = await Promise.all([
        fetch('/api/arena/leaderboard?type=league'),
        fetch(`/api/arena/leaderboard?type=alltime&sort=${sort}&limit=50`),
        fetch('/api/arena/leaderboard?type=challenges'),
      ]);

      if (!leagueRes.ok) {
        const data = await leagueRes.json();
        throw new Error(data.error || 'Failed to fetch league leaderboard');
      }

      if (!alltimeRes.ok) {
        const data = await alltimeRes.json();
        throw new Error(data.error || 'Failed to fetch all-time leaderboard');
      }

      const leagueData = await leagueRes.json();
      const alltimeData = await alltimeRes.json();

      setLeague(leagueData.league ?? null);
      setAlltimeLeaderboard(alltimeData.leaderboard ?? []);

      if (challengesRes.ok) {
        const challengesData = await challengesRes.json();
        setChallenges(challengesData.challenges ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [sort]);

  const setSort = useCallback((newSort: SortColumn) => {
    setSortState(newSort);
  }, []);

  const fetchChallengeLeaderboard = useCallback(async (challengeId: string) => {
    try {
      setIsChallengeLoading(true);
      const res = await fetch(`/api/arena/leaderboard?type=challenge&challengeId=${challengeId}&limit=50`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch challenge leaderboard');
      }
      const data = await res.json();
      setChallengeLeaderboard(data.submissions ?? []);
    } catch {
      setChallengeLeaderboard([]);
    } finally {
      setIsChallengeLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
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
  };
}
