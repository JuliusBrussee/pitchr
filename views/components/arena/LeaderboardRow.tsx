'use client';

import { Trophy, Medal, Crown } from 'lucide-react';
import type { ChallengeSubmission } from '@/types/arena';

interface LeaderboardRowProps {
  submission: ChallengeSubmission;
  rank: number;
  isCurrentUser: boolean;
}

const RANK_COLORS: Record<number, string> = {
  1: '#ffaa33',  // gold
  2: '#c0c0c0',  // silver
  3: '#cd7f32',  // bronze
};

function RankIcon({ rank }: { rank: number }) {
  const color = RANK_COLORS[rank];
  if (rank === 1) return <Crown size={16} style={{ color }} />;
  if (rank === 2) return <Medal size={16} style={{ color }} />;
  if (rank === 3) return <Trophy size={16} style={{ color }} />;
  return null;
}

function getUserLabel(userId: string, displayName?: string): string {
  if (displayName) return displayName;
  if (userId.length <= 12) return userId;
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
}

export function LeaderboardRow({ submission, rank, isCurrentUser }: LeaderboardRowProps) {
  const rankColor = RANK_COLORS[rank] ?? 'var(--text-secondary)';
  const isTopThree = rank <= 3;

  return (
    <tr
      className="transition-colors duration-150"
      style={{
        backgroundColor: isCurrentUser
          ? '#ff594115'
          : 'transparent',
      }}
    >
      {/* Rank */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          {isTopThree && <RankIcon rank={rank} />}
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
        <span
          className={`text-sm ${isCurrentUser ? 'font-semibold' : 'font-medium'}`}
          style={{ color: isCurrentUser ? '#ff5941' : 'var(--text-primary)' }}
        >
          {getUserLabel(submission.userId, submission.displayName)}
          {isCurrentUser && (
            <span
              className="ml-1.5 text-xs font-semibold"
              style={{ color: '#ff5941' }}
            >
              (you)
            </span>
          )}
        </span>
      </td>

      {/* Base Score */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <span
          className="text-sm tabular-nums"
          style={{ color: 'var(--text-secondary)' }}
        >
          {submission.baseScore ?? '-'}
        </span>
      </td>

      {/* Bonus Score */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <span
          className="text-sm tabular-nums"
          style={{ color: submission.bonusScore > 0 ? '#ffaa33' : 'var(--text-muted)' }}
        >
          {submission.bonusScore > 0 ? `+${submission.bonusScore}` : '0'}
        </span>
      </td>

      {/* Total Score */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <span
          className={`text-sm tabular-nums ${isTopThree ? 'font-bold' : 'font-semibold'}`}
          style={{ color: isTopThree ? rankColor : 'var(--text-primary)' }}
        >
          {submission.totalScore ?? '-'}
        </span>
      </td>

      {/* XP Earned */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <span
          className="text-sm tabular-nums font-medium"
          style={{ color: '#ffaa33' }}
        >
          +{submission.xpEarned}
        </span>
      </td>
    </tr>
  );
}
