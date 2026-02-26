'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Trophy } from 'lucide-react';
import { AchievementCard } from './AchievementCard';
import {
  type AchievementCategory,
  type AchievementState,
  ACHIEVEMENT_DEFS,
  CATEGORY_LABELS,
} from '@/lib/achievements';

interface AchievementGridProps {
  state: AchievementState;
}

const ALL_CATEGORIES: (AchievementCategory | 'all')[] = [
  'all', 'sessions', 'scores', 'streaks', 'mastery', 'improvement', 'special',
];

export function AchievementGrid({ state }: AchievementGridProps) {
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldStagger, setShouldStagger] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const expandedRef = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  // Use empty state on server to avoid hydration mismatch
  const safeState = isMounted ? state : {};
  const earnedCount = Object.keys(safeState).length;
  const totalCount = ACHIEVEMENT_DEFS.length;
  const percent = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const filtered = filter === 'all'
    ? ACHIEVEMENT_DEFS
    : ACHIEVEMENT_DEFS.filter((d) => d.category === filter);

  // Earned achievements sorted by unlock date (most recent first)
  const earned = ACHIEVEMENT_DEFS.filter((d) => safeState[d.id]);
  const recentEarned = [...earned]
    .sort((a, b) => {
      const ta = new Date(safeState[a.id]?.unlockedAt ?? 0).getTime();
      const tb = new Date(safeState[b.id]?.unlockedAt ?? 0).getTime();
      return tb - ta;
    })
    .slice(0, 5);

  // Measure and set height for smooth transitions
  const [expandedHeight, setExpandedHeight] = useState(0);
  const [collapsedHeight, setCollapsedHeight] = useState(0);

  const measure = useCallback(() => {
    if (expandedRef.current) {
      setExpandedHeight(expandedRef.current.scrollHeight);
    }
    if (collapsedRef.current) {
      setCollapsedHeight(collapsedRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    measure();
  }, [measure, filter, safeState, earned.length]);

  // Re-measure on window resize
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const handleToggle = () => {
    if (!isExpanded) {
      setShouldStagger(true);
      setTimeout(() => setShouldStagger(false), 800);
    }
    setIsExpanded((prev) => !prev);
  };

  const contentHeight = isExpanded ? expandedHeight : collapsedHeight;

  return (
    <div>
      {/* ——— Progress ring + stats row ——— */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
            <circle
              cx="24" cy="24" r="20"
              fill="none"
              strokeWidth="3"
              style={{ stroke: 'var(--bg-surface-hover)' }}
            />
            <circle
              cx="24" cy="24" r="20"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - percent / 100)}`}
              className="ach-ring-fill"
              style={{
                stroke: 'url(#ach-ring-grad)',
                filter: earnedCount > 0 ? 'drop-shadow(0 0 4px rgba(255,89,65,0.3))' : 'none',
              }}
            />
            <defs>
              <linearGradient id="ach-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff5941" />
                <stop offset="100%" stopColor="#ffaa33" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: earnedCount > 0 ? '#ff5941' : 'var(--text-muted)' }}
            >
              {percent}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {earnedCount}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              of {totalCount} unlocked
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden mt-1.5"
            style={{ backgroundColor: 'var(--bg-surface-hover)' }}
          >
            <div
              className="h-full rounded-full ach-bar-grow"
              style={{
                width: `${percent}%`,
                background: 'linear-gradient(90deg, #ff5941, #ffaa33)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ——— Animated content area ——— */}
      <div
        className="overflow-hidden"
        style={{
          height: contentHeight > 0 ? `${contentHeight}px` : 'auto',
          transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Collapsed shelf — always mounted, faded in/out */}
        <div
          ref={collapsedRef}
          style={{
            opacity: isExpanded ? 0 : 1,
            transform: isExpanded ? 'translateY(-8px)' : 'translateY(0)',
            transition: 'opacity 0.25s ease, transform 0.25s ease',
            pointerEvents: isExpanded ? 'none' : 'auto',
            position: isExpanded ? 'absolute' : 'relative',
            width: '100%',
          }}
        >
          {recentEarned.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {recentEarned.map((def, i) => (
                <AchievementCard
                  key={def.id}
                  def={def}
                  state={safeState[def.id]}
                  isLocked={false}
                  compact
                  index={i}
                />
              ))}
              {earned.length > 5 && (
                <span
                  className="text-[10px] font-medium px-2 py-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  +{earned.length - 5}
                </span>
              )}
            </div>
          ) : (
            <div
              className="flex items-center gap-2.5 py-2 px-3 rounded-lg"
              style={{ backgroundColor: 'var(--bg-surface-hover)' }}
            >
              <Trophy size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Complete pitch sessions to start earning achievements
              </span>
            </div>
          )}
        </div>

        {/* Expanded grid — always mounted, faded in/out */}
        <div
          ref={expandedRef}
          style={{
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.3s ease 0.05s, transform 0.3s ease 0.05s',
            pointerEvents: isExpanded ? 'auto' : 'none',
            position: isExpanded ? 'relative' : 'absolute',
            width: '100%',
          }}
        >
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ALL_CATEGORIES.map((cat) => {
              const isActive = filter === cat;
              const label = cat === 'all' ? 'All' : CATEGORY_LABELS[cat];
              const catCount = cat === 'all'
                ? earnedCount
                : ACHIEVEMENT_DEFS.filter((d) => d.category === cat && safeState[d.id]).length;
              const catTotal = cat === 'all'
                ? totalCount
                : ACHIEVEMENT_DEFS.filter((d) => d.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? 'rgba(255, 89, 65, 0.1)' : 'var(--bg-surface-hover)',
                    color: isActive ? '#ff5941' : 'var(--text-secondary)',
                    border: `1px solid ${isActive ? 'rgba(255, 89, 65, 0.2)' : 'transparent'}`,
                  }}
                >
                  {label}
                  <span className="text-[9px] opacity-60 tabular-nums">
                    {catCount}/{catTotal}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid */}
          <div className={`grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 ${shouldStagger ? 'ach-stagger' : ''}`}>
            {filtered.map((def, i) => (
              <AchievementCard
                key={def.id}
                def={def}
                state={safeState[def.id]}
                isLocked={!safeState[def.id]}
                index={shouldStagger ? i : 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ——— Toggle ——— */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 mx-auto mt-3 px-3.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wide uppercase transition-all duration-300"
        style={{
          color: isExpanded ? '#ff5941' : 'var(--text-muted)',
          backgroundColor: isExpanded ? 'rgba(255, 89, 65, 0.06)' : 'var(--bg-surface-hover)',
          border: `1px solid ${isExpanded ? 'rgba(255, 89, 65, 0.15)' : 'transparent'}`,
        }}
      >
        {isExpanded ? 'Collapse' : `View all ${totalCount}`}
        <ChevronDown
          size={11}
          className="transition-transform duration-300"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
    </div>
  );
}
