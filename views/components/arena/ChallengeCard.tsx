'use client';

import Link from 'next/link';
import { Clock, Users, CheckCircle, ArrowRight, Swords } from 'lucide-react';
import { GlassCard } from '@/views/components/ui/GlassCard';
import { TagPill } from '@/views/components/ui/TagPill';
import type { Challenge, ChallengeSubmission } from '@/types/arena';

interface ChallengeCardProps {
  challenge: Challenge;
  userSubmission?: ChallengeSubmission | null;
  animationDelay?: string;
}

const CHALLENGE_TYPE_COLORS: Record<string, string> = {
  elevator: '#ff5941',
  vc_pitch: '#a855f7',
  speed_round: '#ffaa33',
  pivot: '#3b82f6',
  objection: '#e63b26',
};

function formatChallengeType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTimeRemaining(endsAt: string): string {
  const now = Date.now();
  const end = new Date(endsAt).getTime();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function ChallengeCard({ challenge, userSubmission, animationDelay }: ChallengeCardProps) {
  const typeColor = CHALLENGE_TYPE_COLORS[challenge.challengeType] ?? '#6b7280';
  const isCompleted = challenge.status === 'completed';
  const isActive = challenge.status === 'active';
  const hasSubmitted = !!userSubmission;

  return (
    <Link
      href={`/arena/challenge/${challenge.id}`}
      className="no-underline block"
    >
      <GlassCard
        animationDelay={animationDelay}
        className="cursor-pointer transition-all duration-200 hover:scale-[1.02]"
        style={{ borderColor: isActive ? `${typeColor}40` : undefined }}
      >
        <div className="flex flex-col gap-3">
          {/* Title + type badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${typeColor}1a`, color: typeColor }}
              >
                <Swords size={16} />
              </div>
              <h3
                className="text-sm font-bold truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {challenge.title}
              </h3>
            </div>
            <TagPill
              label={formatChallengeType(challenge.challengeType)}
              color={typeColor}
            />
          </div>

          {/* Description */}
          {challenge.description && (
            <p
              className="text-xs leading-relaxed line-clamp-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {challenge.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Time remaining */}
              {isActive && (
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Clock size={12} />
                  <span>{getTimeRemaining(challenge.endsAt)}</span>
                </div>
              )}

              {/* Participants */}
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                <Users size={12} />
                <span>{challenge.participantCount}</span>
              </div>
            </div>

            {/* Submission status */}
            {hasSubmitted ? (
              <div
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: '#22c55e' }}
              >
                <CheckCircle size={12} />
                Submitted
              </div>
            ) : isActive ? (
              <div
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: typeColor }}
              >
                Enter
                <ArrowRight size={12} />
              </div>
            ) : isCompleted ? (
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                View Results
              </span>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
