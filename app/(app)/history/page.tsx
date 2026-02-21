'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  Clock,
  ArrowRight,
  Play,
  Star,
  Calendar,
  Tag,
} from 'lucide-react';

/* ─── Types ─── */

interface SessionTag {
  label: string;
  color: string; // CSS color string
}

interface MockSession {
  id: number;
  number: number;
  name: string;
  date: string;
  dateGroup: 'today' | 'yesterday' | 'thisWeek' | 'earlier';
  duration: string;
  score: number;
  deck: string;
  tags: SessionTag[];
}

/* ─── Tag palette (uses translucent colors that work on glass) ─── */

const TAG_PALETTE: Record<string, { bg: string; text: string }> = {
  Clarity:    { bg: 'rgba(59,130,246,0.14)',  text: 'rgba(96,165,250,1)' },
  Pacing:     { bg: 'rgba(168,85,247,0.14)',  text: 'rgba(192,132,252,1)' },
  Storytelling:{ bg: 'rgba(236,72,153,0.14)', text: 'rgba(244,114,182,1)' },
  Energy:     { bg: 'rgba(245,158,11,0.14)',  text: 'rgba(251,191,36,1)' },
  Structure:  { bg: 'rgba(16,185,129,0.14)',  text: 'rgba(52,211,153,1)' },
  'Eye Contact':{ bg: 'rgba(99,102,241,0.14)',text: 'rgba(129,140,248,1)' },
  Filler:     { bg: 'rgba(239,68,68,0.14)',   text: 'rgba(248,113,113,1)' },
  Confidence: { bg: 'rgba(234,179,8,0.14)',   text: 'rgba(250,204,21,1)' },
};

function makeTag(label: string): SessionTag {
  const palette = TAG_PALETTE[label] ?? { bg: 'rgba(156,163,175,0.14)', text: 'rgba(156,163,175,1)' };
  return { label, color: palette.text };
}

/* ─── Mock data ─── */

const MOCK_SESSIONS: MockSession[] = [
  {
    id: 1,
    number: 28,
    name: 'Series A Deck — Final Run',
    date: 'Feb 21, 2026',
    dateGroup: 'today',
    duration: '5:12',
    score: 8.4,
    deck: 'Series A Pitch v3',
    tags: [makeTag('Clarity'), makeTag('Pacing'), makeTag('Confidence')],
  },
  {
    id: 2,
    number: 27,
    name: 'Investor Q\u0026A Practice',
    date: 'Feb 21, 2026',
    dateGroup: 'today',
    duration: '3:47',
    score: 7.1,
    deck: 'Series A Pitch v3',
    tags: [makeTag('Storytelling'), makeTag('Energy')],
  },
  {
    id: 3,
    number: 26,
    name: 'Series A Deck — Dry Run',
    date: 'Feb 20, 2026',
    dateGroup: 'yesterday',
    duration: '6:03',
    score: 6.8,
    deck: 'Series A Pitch v2',
    tags: [makeTag('Structure'), makeTag('Eye Contact'), makeTag('Filler')],
  },
  {
    id: 4,
    number: 25,
    name: 'Elevator Pitch Sprint',
    date: 'Feb 20, 2026',
    dateGroup: 'yesterday',
    duration: '1:55',
    score: 9.2,
    deck: 'Elevator 60-sec',
    tags: [makeTag('Pacing'), makeTag('Confidence')],
  },
  {
    id: 5,
    number: 24,
    name: 'Demo Day Rehearsal',
    date: 'Feb 18, 2026',
    dateGroup: 'thisWeek',
    duration: '4:32',
    score: 5.6,
    deck: 'Demo Day 2026',
    tags: [makeTag('Clarity'), makeTag('Energy'), makeTag('Storytelling')],
  },
  {
    id: 6,
    number: 23,
    name: 'Product Walkthrough',
    date: 'Feb 17, 2026',
    dateGroup: 'thisWeek',
    duration: '7:18',
    score: 4.3,
    deck: 'Product Tour v1',
    tags: [makeTag('Structure'), makeTag('Filler')],
  },
  {
    id: 7,
    number: 22,
    name: 'Seed Round — Narrative Focus',
    date: 'Feb 16, 2026',
    dateGroup: 'thisWeek',
    duration: '5:44',
    score: 7.9,
    deck: 'Seed Round Deck',
    tags: [makeTag('Storytelling'), makeTag('Eye Contact'), makeTag('Pacing')],
  },
  {
    id: 8,
    number: 21,
    name: 'Cold Open Practice',
    date: 'Feb 15, 2026',
    dateGroup: 'thisWeek',
    duration: '2:10',
    score: 6.1,
    deck: 'Series A Pitch v1',
    tags: [makeTag('Energy'), makeTag('Confidence')],
  },
];

const DATE_GROUP_LABELS: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  earlier: 'Earlier',
};

const DATE_GROUP_ORDER = ['today', 'yesterday', 'thisWeek', 'earlier'];

type FilterRange = 'all' | 'week' | 'month';
type ViewMode = 'list' | 'grid';

/* ─── Score helpers ─── */

function scoreColor(score: number): { bg: string; text: string } {
  if (score >= 7) return { bg: 'rgba(16,185,129,0.16)', text: '#34d399' };
  if (score >= 5) return { bg: 'rgba(245,158,11,0.16)', text: '#fbbf24' };
  return { bg: 'rgba(239,68,68,0.16)', text: '#f87171' };
}

/* ─── Component ─── */

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRange, setFilterRange] = useState<FilterRange>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [visibleCount, setVisibleCount] = useState(8);

  /* Filtering */
  const filtered = MOCK_SESSIONS.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesText =
        s.name.toLowerCase().includes(q) ||
        s.deck.toLowerCase().includes(q) ||
        s.tags.some((t) => t.label.toLowerCase().includes(q));
      if (!matchesText) return false;
    }
    if (filterRange === 'week') {
      return s.dateGroup === 'today' || s.dateGroup === 'yesterday' || s.dateGroup === 'thisWeek';
    }
    if (filterRange === 'month') return true; // all mock data is this month
    return true;
  });

  const visibleSessions = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  /* Grouped visible sessions */
  const groupedVisible = DATE_GROUP_ORDER.reduce<Record<string, MockSession[]>>((acc, group) => {
    const items = visibleSessions.filter((s) => s.dateGroup === group);
    if (items.length > 0) acc[group] = items;
    return acc;
  }, {});

  /* Running index for stagger animation */
  let animIndex = 0;

  return (
      <main className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {/* ─── Header Card ─── */}
        <div
          className="rounded-2xl border p-5 flex flex-col gap-4 flex-shrink-0 animate-fade-in-up"
          style={{
            backgroundColor: 'var(--bg-surface)',
            backdropFilter: 'blur(var(--blur-strength))',
            WebkitBackdropFilter: 'blur(var(--blur-strength))',
            borderColor: 'var(--border-color)',
          }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(168,85,247,0.12)' }}
              >
                <Clock size={18} style={{ color: 'rgba(192,132,252,1)' }} />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  Session History
                </h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {filtered.length} session{filtered.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
            </div>

            {/* View toggle */}
            <div
              className="flex rounded-lg border overflow-hidden"
              style={{ borderColor: 'var(--border-color)' }}
            >
              {(['list', 'grid'] as ViewMode[]).map((mode) => {
                const Icon = mode === 'list' ? List : Grid;
                const active = viewMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="p-2 transition-colors duration-150"
                    style={{
                      backgroundColor: active ? 'var(--bg-surface-hover)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                    aria-label={`${mode} view`}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search + Filter row */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search sessions, decks, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:opacity-50"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            {/* Filter dropdown */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <select
                value={filterRange}
                onChange={(e) => setFilterRange(e.target.value as FilterRange)}
                className="bg-transparent border-none outline-none text-sm cursor-pointer appearance-none pr-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Session List ─── */}
        <div
          className="flex-1 rounded-2xl border p-5 overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg-surface)',
            backdropFilter: 'blur(var(--blur-strength))',
            WebkitBackdropFilter: 'blur(var(--blur-strength))',
            borderColor: 'var(--border-color)',
          }}
        >
          {Object.keys(groupedVisible).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
              <Search size={32} style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No sessions match your search.
              </p>
            </div>
          ) : viewMode === 'list' ? (
            /* ─── List View ─── */
            <div className="flex flex-col gap-6">
              {DATE_GROUP_ORDER.map((group) => {
                const sessions = groupedVisible[group];
                if (!sessions) return null;
                return (
                  <div key={group} className="flex flex-col gap-2">
                    {/* Group header */}
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {DATE_GROUP_LABELS[group]}
                      </span>
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                    </div>

                    {/* Session rows */}
                    {sessions.map((session) => {
                      const sc = scoreColor(session.score);
                      const idx = animIndex++;
                      return (
                        <div
                          key={session.id}
                          className="group flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer animate-fade-in-up"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: 'var(--border-color)',
                            animationDelay: `${idx * 60}ms`,
                            animationFillMode: 'both',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                            e.currentTarget.style.borderColor = 'var(--bg-surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                          }}
                        >
                          {/* Play icon */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: 'var(--bg-surface-hover)' }}
                          >
                            <Play size={14} style={{ color: 'var(--text-secondary)' }} fill="currentColor" />
                          </div>

                          {/* Session info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                Pitch #{session.number}
                              </span>
                              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                              <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                                {session.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {session.date}
                              </span>
                              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                <Clock size={11} />
                                {session.duration}
                              </span>
                              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                <Tag size={11} />
                                {session.deck}
                              </span>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
                            {session.tags.slice(0, 3).map((tag) => {
                              const palette = TAG_PALETTE[tag.label];
                              return (
                                <span
                                  key={tag.label}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap"
                                  style={{
                                    backgroundColor: palette?.bg ?? 'rgba(156,163,175,0.14)',
                                    color: palette?.text ?? 'rgba(156,163,175,1)',
                                  }}
                                >
                                  {tag.label}
                                </span>
                              );
                            })}
                          </div>

                          {/* Score badge */}
                          <div
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: sc.bg, color: sc.text }}
                          >
                            <Star size={12} fill="currentColor" />
                            {session.score.toFixed(1)}
                          </div>

                          {/* Arrow */}
                          <ArrowRight
                            size={16}
                            className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ─── Grid View ─── */
            <div className="flex flex-col gap-6">
              {DATE_GROUP_ORDER.map((group) => {
                const sessions = groupedVisible[group];
                if (!sessions) return null;
                return (
                  <div key={group} className="flex flex-col gap-3">
                    {/* Group header */}
                    <div className="flex items-center gap-2 px-1">
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {DATE_GROUP_LABELS[group]}
                      </span>
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {sessions.map((session) => {
                        const sc = scoreColor(session.score);
                        const idx = animIndex++;
                        return (
                          <div
                            key={session.id}
                            className="group flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer animate-fade-in-up"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-color)',
                              animationDelay: `${idx * 60}ms`,
                              animationFillMode: 'both',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                              e.currentTarget.style.borderColor = 'var(--bg-surface-hover)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                          >
                            {/* Top row: play + score */}
                            <div className="flex items-center justify-between">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                                style={{ backgroundColor: 'var(--bg-surface-hover)' }}
                              >
                                <Play size={14} style={{ color: 'var(--text-secondary)' }} fill="currentColor" />
                              </div>
                              <div
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                                style={{ backgroundColor: sc.bg, color: sc.text }}
                              >
                                <Star size={12} fill="currentColor" />
                                {session.score.toFixed(1)}
                              </div>
                            </div>

                            {/* Title */}
                            <div>
                              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                Pitch #{session.number} &mdash; {session.name}
                              </p>
                              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                {session.deck}
                              </p>
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center gap-3">
                              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                <Calendar size={11} />
                                {session.date}
                              </span>
                              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                <Clock size={11} />
                                {session.duration}
                              </span>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {session.tags.map((tag) => {
                                const palette = TAG_PALETTE[tag.label];
                                return (
                                  <span
                                    key={tag.label}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap"
                                    style={{
                                      backgroundColor: palette?.bg ?? 'rgba(156,163,175,0.14)',
                                      color: palette?.text ?? 'rgba(156,163,175,1)',
                                    }}
                                  >
                                    {tag.label}
                                  </span>
                                );
                              })}
                            </div>

                            {/* Review link */}
                            <div className="flex items-center justify-end mt-auto">
                              <span
                                className="text-xs font-medium flex items-center gap-1 transition-all duration-200 group-hover:gap-2"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                Review
                                <ArrowRight size={13} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Load More ─── */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setVisibleCount((c) => c + 6)}
                className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Load More Sessions
              </button>
            </div>
          )}

          {/* ─── Pagination summary ─── */}
          <div className="flex items-center justify-center mt-4 gap-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} sessions
            </span>
          </div>
        </div>
      </main>
  );
}
