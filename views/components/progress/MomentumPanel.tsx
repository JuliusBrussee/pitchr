'use client';

import { useMemo } from 'react';
import {
  Flame,
  BarChart3,
  TrendingUp,
  Trophy,
  ArrowUp,
  Zap,
} from 'lucide-react';
import type { ProgressSummary, CategoryProgress } from '@/lib/progress';
import { getRubricColor } from '@/views/components/ui/colors';

/* ——— Helpers ——— */

function getBiggestWin(categories: CategoryProgress[]): CategoryProgress | null {
  const improving = categories.filter((c) => c.delta > 0);
  if (improving.length === 0) return null;
  return improving.sort((a, b) => b.delta - a.delta)[0];
}

function getWeakestSkill(categories: CategoryProgress[]): CategoryProgress | null {
  const sorted = [...categories].sort((a, b) => a.currentAvg - b.currentAvg);
  return sorted[0] ?? null;
}

function getWinMessage(cat: CategoryProgress): string {
  if (cat.delta >= 5) return 'Major breakthrough! Your hard work is paying off.';
  if (cat.delta >= 3) return 'Strong improvement. Keep this momentum going.';
  if (cat.delta >= 1) return 'Steady progress. You\'re moving in the right direction.';
  return 'Slight improvement detected. Stay consistent.';
}

/* ——— Stat Item ——— */

function StatItem({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <div className="min-w-0">
        <div
          className="text-xs font-bold tabular-nums"
          style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
        >
          {value}
        </div>
        <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {label}
          {sub && (
            <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}> {sub}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ——— Mini Trend Bar ——— */

function TrendBar({ history }: { history: { score: number }[] }) {
  if (history.length < 3) return null;

  const recent = history.slice(-8);
  const max = Math.max(...recent.map((h) => h.score));

  return (
    <div className="flex items-end gap-0.5 h-6">
      {recent.map((h, i) => {
        const height = max > 0 ? (h.score / max) * 100 : 0;
        const isLast = i === recent.length - 1;
        return (
          <div
            key={i}
            className="rounded-sm flex-1 transition-all duration-500"
            style={{
              height: `${Math.max(height, 8)}%`,
              backgroundColor: isLast ? '#ff5941' : 'var(--border-color)',
              opacity: isLast ? 1 : 0.4 + (i / recent.length) * 0.6,
              minWidth: 3,
            }}
          />
        );
      })}
    </div>
  );
}

/* ——— Main Component ——— */

interface MomentumPanelProps {
  progress: ProgressSummary;
  animationDelay?: string;
}

export function MomentumPanel({ progress, animationDelay }: MomentumPanelProps) {
  const biggestWin = useMemo(
    () => getBiggestWin(progress.categories),
    [progress.categories],
  );
  const weakest = useMemo(
    () => getWeakestSkill(progress.categories),
    [progress.categories],
  );

  const improvingCount = progress.categories.filter((c) => c.status === 'improving').length;

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in-up"
      style={{
        animationDelay: animationDelay ?? '0ms',
        animationFillMode: 'both',
      }}
    >
      {/* Stats Card */}
      <div
        className="rounded-2xl border p-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Momentum
          </span>
          {improvingCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
            >
              {improvingCount} skill{improvingCount !== 1 ? 's' : ''} rising
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <StatItem
            icon={Flame}
            label="Current streak"
            value={`${progress.currentStreak} run${progress.currentStreak !== 1 ? 's' : ''}`}
            color="#f97316"
            sub={progress.longestStreak > progress.currentStreak ? `best: ${progress.longestStreak}` : undefined}
          />
          <StatItem
            icon={BarChart3}
            label="Total sessions"
            value={String(progress.totalSessions)}
            color="#3b82f6"
          />
          <StatItem
            icon={TrendingUp}
            label="Overall change"
            value={`${progress.overallDelta > 0 ? '+' : ''}${progress.overallDelta} pts`}
            color={progress.overallDelta > 0 ? '#22c55e' : progress.overallDelta < 0 ? '#ef4444' : '#6b7280'}
          />
        </div>

        {/* Score trend bars */}
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Recent sessions
            </span>
          </div>
          <TrendBar history={progress.overallTrend} />
        </div>
      </div>

      {/* Biggest Win / Focus Area Card */}
      <div
        className="rounded-2xl border p-4 relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
        }}
      >
        {biggestWin ? (
          <>
            {/* Subtle glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 80% 20%, ${getRubricColor(biggestWin.id)}10 0%, transparent 60%)`,
              }}
            />

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={13} style={{ color: '#eab308' }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Biggest Win
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getRubricColor(biggestWin.id) }}
                />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {biggestWin.label}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <ArrowUp size={14} style={{ color: '#22c55e' }} />
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  +{biggestWin.delta.toFixed(1)}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>pts since first session</span>
              </div>

              <p className="text-[11px] leading-snug mb-3" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {getWinMessage(biggestWin)}
              </p>

              {/* Focus area hint */}
              {weakest && weakest.id !== biggestWin.id && (
                <div
                  className="rounded-lg p-2.5 flex items-start gap-2"
                  style={{ backgroundColor: `${getRubricColor(weakest.id)}08` }}
                >
                  <Zap size={11} className="mt-0.5 flex-shrink-0" style={{ color: getRubricColor(weakest.id) }} />
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      Focus next on
                    </span>
                    <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {weakest.label}
                      <span style={{ color: 'var(--text-muted)' }}> \u2014 {weakest.currentAvg.toFixed(1)}/20</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No wins yet — show encouragement */
          <div className="h-full flex flex-col justify-center items-center text-center py-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: 'rgba(255,89,65,0.10)' }}
            >
              <Zap size={18} style={{ color: '#ff5941' }} />
            </div>
            <span className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Your wins will show here
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Complete 2+ sessions to start tracking improvement
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
