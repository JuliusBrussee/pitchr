'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserStats, LeagueMembership, League } from '@/types/arena';

export interface UseLeaderboardReturn {
  league: (League & { memberships: LeagueMembership[] }) | null;
  alltimeLeaderboard: UserStats[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [league, setLeague] = useState<(League & { memberships: LeagueMembership[] }) | null>(null);
  const [alltimeLeaderboard, setAlltimeLeaderboard] = useState<UserStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [leagueRes, alltimeRes] = await Promise.all([
        fetch('/api/arena/leaderboard?type=league'),
        fetch('/api/arena/leaderboard?type=alltime&sort=total_xp'),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { league, alltimeLeaderboard, isLoading, error, refresh };
}
