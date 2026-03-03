'use client';

import { Trophy } from 'lucide-react';
import { GlassCard } from '@/views/components/ui/GlassCard';
import { LeaderboardRow } from '@/views/components/arena/LeaderboardRow';
import type { ChallengeSubmission } from '@/types/arena';

interface ChallengeLeaderboardProps {
  submissions: ChallengeSubmission[];
  currentUserId?: string;
  maxDisplay?: number;
}

export function ChallengeLeaderboard({
  submissions,
  currentUserId,
  maxDisplay = 20,
}: ChallengeLeaderboardProps) {
  /* Sort by totalScore descending, fallback to submittedAt ascending */
  const sorted = [...submissions].sort((a, b) => {
    const scoreA = a.totalScore ?? 0;
    const scoreB = b.totalScore ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  /* Determine visible rows and whether current user needs pinning */
  const visibleRows = sorted.slice(0, maxDisplay);
  const currentUserIndex = currentUserId
    ? sorted.findIndex((s) => s.userId === currentUserId)
    : -1;
  const isCurrentUserVisible = currentUserIndex >= 0 && currentUserIndex < maxDisplay;
  const isPinnedUser = currentUserIndex >= maxDisplay;
  const pinnedSubmission = isPinnedUser ? sorted[currentUserIndex] : null;

  /* Empty state */
  if (sorted.length === 0) {
    return (
      <GlassCard className="w-full">
        <div className="flex flex-col items-center gap-3 py-8">
          <Trophy size={28} style={{ color: 'var(--text-muted)' }} />
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            No submissions yet
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Be the first to submit your pitch!
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full overflow-hidden" padding="sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 pt-2 pb-3">
        <Trophy size={18} style={{ color: '#ffaa33' }} />
        <h3
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: 'var(--text-primary)' }}
        >
          Leaderboard
        </h3>
        <span
          className="text-xs font-medium ml-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          {sorted.length} participant{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <th
                className="py-2 px-3 text-center text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Rank
              </th>
              <th
                className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Pitcher
              </th>
              <th
                className="py-2 px-3 text-right text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Base
              </th>
              <th
                className="py-2 px-3 text-right text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Bonus
              </th>
              <th
                className="py-2 px-3 text-right text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Total
              </th>
              <th
                className="py-2 px-3 text-right text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                XP
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((submission, index) => {
              const rank = index + 1;
              const isCurrentUser = currentUserId === submission.userId;

              return (
                <LeaderboardRow
                  key={submission.id}
                  submission={submission}
                  rank={rank}
                  isCurrentUser={isCurrentUser}
                />
              );
            })}

            {/* Separator + pinned current user row */}
            {isPinnedUser && pinnedSubmission && (
              <>
                <tr>
                  <td
                    colSpan={6}
                    className="py-1.5 text-center"
                  >
                    <span
                      className="text-xs font-medium tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ...
                    </span>
                  </td>
                </tr>
                <LeaderboardRow
                  submission={pinnedSubmission}
                  rank={currentUserIndex + 1}
                  isCurrentUser={true}
                />
              </>
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
