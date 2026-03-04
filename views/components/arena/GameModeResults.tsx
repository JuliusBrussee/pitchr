'use client';

import { useEffect, useState } from 'react';
import { Trophy, Flame, Star, ArrowLeft, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/views/components/ui/GlassCard';
import type { GameModeResults as GameModeResultsData } from '@/hooks/useGameMode';

interface GameModeResultsProps {
  results: GameModeResultsData;
  onPlayAgain: () => void;
  onBackToArena: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#ffaa33';
  if (score >= 50) return '#ff5941';
  return '#e63b26';
}

function getScoreLabel(score: number): string {
  if (score >= 95) return 'Outstanding';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Great';
  if (score >= 50) return 'Good Start';
  return 'Keep Practicing';
}

export function GameModeResults({ results, onPlayAgain, onBackToArena }: GameModeResultsProps) {
  const [isXpAnimated, setIsXpAnimated] = useState(false);
  const scoreColor = getScoreColor(results.score);

  useEffect(() => {
    const timer = setTimeout(() => setIsXpAnimated(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Score Hero */}
      <GlassCard className="w-full text-center" animationDelay="0.1s">
        <div className="flex flex-col items-center gap-3 py-4">
          <Trophy size={28} style={{ color: scoreColor }} />

          <div>
            <span
              className="text-6xl font-bold tabular-nums"
              style={{ color: scoreColor }}
            >
              {results.score}
            </span>
            <span
              className="text-2xl font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              /100
            </span>
          </div>

          <span
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: scoreColor }}
          >
            {getScoreLabel(results.score)}
          </span>
        </div>
      </GlassCard>

      {/* XP Earned */}
      <GlassCard className="w-full" animationDelay="0.2s">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#ffaa331a', color: '#ffaa33' }}
            >
              <Star size={20} />
            </div>
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block"
                style={{ color: 'var(--text-muted)' }}
              >
                XP Earned
              </span>
              <span
                className={`text-xl font-bold transition-all duration-500 ${isXpAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                style={{ color: '#ffaa33' }}
              >
                +{results.xpEarned} XP
              </span>
            </div>
          </div>

          <div className="text-right">
            <span
              className="text-xs font-semibold uppercase tracking-wider block"
              style={{ color: 'var(--text-muted)' }}
            >
              Total XP
            </span>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {results.totalXp.toLocaleString()}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Streak */}
      <GlassCard className="w-full" animationDelay="0.3s">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#ff59411a', color: '#ff5941' }}
          >
            <Flame size={20} />
          </div>
          <div className="flex-1">
            <span
              className="text-xs font-semibold uppercase tracking-wider block"
              style={{ color: 'var(--text-muted)' }}
            >
              Current Streak
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {results.streak.currentStreak} day{results.streak.currentStreak !== 1 ? 's' : ''}
            </span>
          </div>

          {results.streak.isNewMilestone && results.streak.milestone && (
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse"
              style={{
                backgroundColor: '#ff59411a',
                color: '#ff5941',
              }}
            >
              {results.streak.milestone}-day milestone!
            </div>
          )}
        </div>
      </GlassCard>

      {/* Actions */}
      <div
        className="flex items-center gap-3 w-full animate-fade-in-up"
        style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
      >
        <button
          onClick={onBackToArena}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors duration-200"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ArrowLeft size={16} />
          Arena
        </button>

        <button
          onClick={onPlayAgain}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
          style={{ backgroundColor: '#ff5941' }}
        >
          <RotateCcw size={16} />
          Play Again
        </button>
      </div>
    </div>
  );
}
