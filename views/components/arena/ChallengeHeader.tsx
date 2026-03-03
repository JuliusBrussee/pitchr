'use client';

import { useEffect, useState } from 'react';
import { Clock, Users, Swords } from 'lucide-react';
import { TagPill } from '@/views/components/ui/TagPill';
import type { Challenge } from '@/types/arena';

interface ChallengeHeaderProps {
  challenge: Challenge;
}

const CHALLENGE_TYPE_COLORS: Record<string, string> = {
  elevator: '#ff5941',
  vc_pitch: '#a855f7',
  speed_round: '#ffaa33',
  pivot: '#3b82f6',
  objection: '#e63b26',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  upcoming: { label: 'Upcoming', color: '#3b82f6' },
  active: { label: 'Active', color: '#22c55e' },
  completed: { label: 'Completed', color: 'var(--text-muted)' },
};

function formatChallengeType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function computeCountdown(endsAt: string): string {
  const now = Date.now();
  const end = new Date(endsAt).getTime();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function ChallengeHeader({ challenge }: ChallengeHeaderProps) {
  const [countdown, setCountdown] = useState(() => computeCountdown(challenge.endsAt));
  const typeColor = CHALLENGE_TYPE_COLORS[challenge.challengeType] ?? '#6b7280';
  const statusConfig = STATUS_CONFIG[challenge.status] ?? STATUS_CONFIG.active;

  useEffect(() => {
    if (challenge.status !== 'active') return;

    const interval = setInterval(() => {
      setCountdown(computeCountdown(challenge.endsAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge.endsAt, challenge.status]);

  return (
    <div
      className="flex flex-col gap-4 animate-fade-in-up"
      style={{ animationDelay: '0s', animationFillMode: 'both' }}
    >
      {/* Top row: status + type badge */}
      <div className="flex items-center gap-2">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: statusConfig.color,
              ...(challenge.status === 'active' ? { animation: 'pulse 2s ease-in-out infinite' } : {}),
            }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: statusConfig.color }}
          >
            {statusConfig.label}
          </span>
        </div>

        <span style={{ color: 'var(--border-color)' }}>|</span>

        <TagPill
          label={formatChallengeType(challenge.challengeType)}
          color={typeColor}
        />
      </div>

      {/* Title + icon */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${typeColor}1a`, color: typeColor }}
        >
          <Swords size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {challenge.title}
          </h1>
          {challenge.description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {challenge.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta strip: countdown + participants */}
      <div className="flex items-center gap-4">
        {/* Countdown */}
        {challenge.status === 'active' && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: `${typeColor}1a`,
              color: typeColor,
            }}
          >
            <Clock size={12} />
            <span className="tabular-nums">{countdown}</span>
          </div>
        )}

        {/* Participant count */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            backgroundColor: 'var(--bg-surface-hover)',
            color: 'var(--text-secondary)',
          }}
        >
          <Users size={12} />
          <span>
            {challenge.participantCount} participant{challenge.participantCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Week info */}
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          Week {challenge.weekNumber}, {challenge.year}
        </span>
      </div>
    </div>
  );
}
