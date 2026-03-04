'use client';

import { Flame, Snowflake, Trophy } from 'lucide-react';

/* ——— Props ——— */

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  streakFreezesRemaining: number;
}

/* ——— Helpers ——— */

function getUtcDateString(date?: Date): string {
  const d = date ?? new Date();
  return d.toISOString().split('T')[0];
}

/** Build array of the last 7 days with day-of-week labels. Active flags default to false. */
function buildWeekGrid(): { label: string; date: string; active: boolean }[] {
  const today = new Date();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const days: { label: string; date: string; active: boolean }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = getUtcDateString(d);
    const dayOfWeek = d.getUTCDay();

    days.push({
      label: dayLabels[dayOfWeek],
      date: dateStr,
      active: false,
    });
  }

  return days;
}

function markActiveDays(
  days: { label: string; date: string; active: boolean }[],
  currentStreak: number,
  lastActivityDate?: string,
): { label: string; date: string; active: boolean }[] {
  if (!lastActivityDate || currentStreak <= 0) {
    return days.map((d) => ({ ...d, active: false }));
  }

  const lastDate = new Date(lastActivityDate + 'T00:00:00Z');

  // The streak covers `currentStreak` consecutive days ending at lastActivityDate
  const streakStartDate = new Date(lastDate);
  streakStartDate.setUTCDate(streakStartDate.getUTCDate() - currentStreak + 1);

  return days.map((d) => {
    const dayDate = new Date(d.date + 'T00:00:00Z');
    const isInStreakWindow =
      dayDate >= streakStartDate && dayDate <= lastDate;
    return { ...d, active: isInStreakWindow };
  });
}

/* ——— Component ——— */

export function StreakTracker({
  currentStreak,
  longestStreak,
  lastActivityDate,
  streakFreezesRemaining,
}: StreakTrackerProps) {
  const rawDays = buildWeekGrid();
  const weekDays = markActiveDays(rawDays, currentStreak, lastActivityDate);
  const isActive = currentStreak > 0;

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isActive ? '#ffaa3340' : 'var(--border-color)',
      }}
    >
      {/* Flame + current streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: isActive ? '#ff59411a' : 'var(--bg-surface-hover)',
              color: isActive ? '#ff5941' : 'var(--text-muted)',
            }}
          >
            <Flame size={22} />
          </div>
          <div className="flex flex-col">
            <span
              className="text-2xl font-bold tabular-nums leading-none"
              style={{ color: isActive ? '#ffaa33' : 'var(--text-muted)' }}
            >
              {currentStreak}
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              day streak
            </span>
          </div>
        </div>

        {/* Streak freezes */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{
            backgroundColor: streakFreezesRemaining > 0 ? '#3b82f61a' : 'var(--bg-surface-hover)',
            color: streakFreezesRemaining > 0 ? '#3b82f6' : 'var(--text-muted)',
          }}
        >
          <Snowflake size={12} />
          <span className="text-xs font-semibold tabular-nums">
            {streakFreezesRemaining}
          </span>
          <span className="text-[10px]">
            freeze{streakFreezesRemaining !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* 7-day calendar grid */}
      <div className="flex items-center justify-between gap-1">
        {weekDays.map((day) => (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <span
              className="text-[9px] font-semibold uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              {day.label}
            </span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                backgroundColor: day.active ? '#ff5941' : 'var(--bg-surface-hover)',
                boxShadow: day.active ? '0 0 8px #ff594140' : 'none',
              }}
            >
              {day.active && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#fff' }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Longest streak */}
      <div
        className="flex items-center justify-between pt-2 border-t"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-1.5">
          <Trophy size={12} style={{ color: '#ffaa33' }} />
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Longest streak
          </span>
        </div>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {longestStreak} day{longestStreak !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
