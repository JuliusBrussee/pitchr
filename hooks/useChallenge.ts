'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Challenge, ChallengeSubmission, Scenario } from '@/types/arena';

export interface UseChallengeReturn {
  challenge: (Challenge & { scenario: Scenario }) | null;
  userSubmission: ChallengeSubmission | null;
  leaderboard: ChallengeSubmission[];
  userRank: number | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  submit: (runId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useChallenge(challengeId?: string): UseChallengeReturn {
  const [challenge, setChallenge] = useState<(Challenge & { scenario: Scenario }) | null>(null);
  const [userSubmission, setUserSubmission] = useState<ChallengeSubmission | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeSubmission[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = challengeId
        ? `/api/arena/challenges/${challengeId}`
        : '/api/arena/challenges';

      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch challenge');
      }

      const data = await res.json();
      setChallenge(data.challenge);
      setUserSubmission(data.userSubmission ?? null);
      setLeaderboard(data.leaderboard ?? []);
      setUserRank(data.userRank ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch challenge');
    } finally {
      setIsLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(async (runId: string) => {
    if (!challenge) return;
    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(`/api/arena/challenges/${challenge.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      const data = await res.json();
      setUserSubmission(data.submission);
      setUserRank(data.rank ?? null);

      // Refresh leaderboard after submission
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [challenge, refresh]);

  return {
    challenge,
    userSubmission,
    leaderboard,
    userRank,
    isLoading,
    isSubmitting,
    error,
    submit,
    refresh,
  };
}
