'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useChallenge } from '@/hooks/useChallenge';
import { ChallengeHeader } from '@/views/components/arena/ChallengeHeader';
import { ChallengeSubmitFlow } from '@/views/components/arena/ChallengeSubmitFlow';
import { SkeletonCard, SkeletonStatRow } from '@/views/components/ui/Skeleton';

export default function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const {
    challenge,
    userSubmission,
    leaderboard,
    userRank,
    isLoading,
    isSubmitting,
    error,
    submit,
  } = useChallenge(id);

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
        {/* Back button */}
        <Link
          href="/arena"
          className="no-underline flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80 w-fit"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} />
          Back to Arena
        </Link>

        {/* Error banner */}
        {error && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: '#e63b261a',
              backgroundColor: '#e63b260d',
              color: '#e63b26',
            }}
          >
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col gap-6">
            <SkeletonStatRow />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Challenge loaded */}
        {!isLoading && challenge && (
          <>
            {/* Header */}
            <ChallengeHeader challenge={challenge} />

            {/* Main content area */}
            {challenge.status === 'active' && !userSubmission ? (
              /* Not yet submitted: show submit flow */
              <ChallengeSubmitFlow
                scenario={challenge.scenario}
                isSubmitting={isSubmitting}
                onSubmit={submit}
              />
            ) : (
              /* Already submitted or challenge ended: show results */
              <div className="flex flex-col gap-6">
                {/* User submission results */}
                {userSubmission && (
                  <ChallengeSubmitFlow
                    scenario={challenge.scenario}
                    isSubmitting={false}
                    onSubmit={submit}
                    userSubmission={userSubmission}
                    userRank={userRank}
                  />
                )}

                {/* Leaderboard placeholder */}
                {/* ChallengeLeaderboard will be created by Agent 7B */}
                {leaderboard.length > 0 && (
                  <div
                    className="rounded-xl border px-4 py-3 text-center text-sm"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Leaderboard: {leaderboard.length} entries loaded. Leaderboard component pending.
                  </div>
                )}

                {/* No submission and challenge not active */}
                {!userSubmission && challenge.status !== 'active' && (
                  <div
                    className="flex flex-col items-center justify-center gap-3 py-12 text-center"
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {challenge.status === 'upcoming'
                        ? 'This challenge has not started yet. Check back when it goes live!'
                        : 'This challenge has ended. You did not submit an entry.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* No challenge found */}
        {!isLoading && !challenge && !error && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              No active challenge found.
            </p>
            <Link
              href="/arena"
              className="no-underline text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: '#ff5941' }}
            >
              Back to Arena
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
