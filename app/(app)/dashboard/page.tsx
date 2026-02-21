'use client';

import Link from 'next/link';
import {
  Flame,
  TrendingUp,
  Clock,
  Zap,
  Target,
  Upload,
  Lightbulb,
  ArrowRight,
  Calendar,
  Timer,
} from 'lucide-react';

/* ─── Mock Data ─── */

const STATS = [
  { label: 'Total Sessions', value: '24', icon: Target, accent: '#8b5cf6' },
  { label: 'Avg Score', value: '7.8/10', icon: TrendingUp, accent: '#22c55e' },
  { label: 'Practice Streak', value: '5 days', icon: Flame, accent: '#f97316' },
  { label: 'Practice Time', value: '12.5 hrs', icon: Clock, accent: '#3b82f6' },
];

const RECENT_SESSIONS = [
  {
    id: 1,
    name: 'Series A Pitch — Final Run',
    date: 'Feb 20, 2026',
    duration: '8m 42s',
    score: 8.4,
    deck: 'Series A Deck v3',
  },
  {
    id: 2,
    name: 'Investor Q&A Practice',
    date: 'Feb 18, 2026',
    duration: '12m 15s',
    score: 7.1,
    deck: 'Q&A Scenarios',
  },
  {
    id: 3,
    name: 'Product Demo Walkthrough',
    date: 'Feb 16, 2026',
    duration: '6m 33s',
    score: 8.9,
    deck: 'Product Demo Deck',
  },
  {
    id: 4,
    name: 'Elevator Pitch Sprint',
    date: 'Feb 14, 2026',
    duration: '2m 05s',
    score: 6.5,
    deck: 'One-Pager Deck',
  },
];

const PITCH_TIPS = [
  'Start with a bold claim or surprising stat — investors hear hundreds of pitches; hook them in the first 10 seconds.',
  'Use "we" instead of "I" to emphasize the team. Investors bet on teams, not individuals.',
  'Keep your ask specific. "We\'re raising $2M at $10M pre" is stronger than "we\'re looking for funding."',
  'Pause after key points. Silence builds weight and gives your audience time to absorb.',
  'Practice the transition between your problem slide and solution slide — that\'s where most pitches lose momentum.',
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#22c55e';
  if (score >= 7) return '#eab308';
  return '#ef4444';
}

const randomTip = PITCH_TIPS[Math.floor(Math.random() * PITCH_TIPS.length)];

/* ─── Page Component ─── */

export default function DashboardPage() {
  return (
      <main
        className="flex-1 overflow-y-auto rounded-2xl border p-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: `blur(var(--blur-strength))`,
          WebkitBackdropFilter: `blur(var(--blur-strength))`,
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="max-w-5xl mx-auto">

          {/* ─── Welcome Header ─── */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0s', animationFillMode: 'both' }}>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {getGreeting()}, Founder
            </h1>
            <p className="text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Calendar size={14} />
              {getFormattedDate()}
            </p>
          </div>

          {/* ─── Quick Stats Row ─── */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border p-5 transition-all duration-200 animate-fade-in-up"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    backdropFilter: `blur(var(--blur-strength))`,
                    WebkitBackdropFilter: `blur(var(--blur-strength))`,
                    animationDelay: `${0.05 + i * 0.06}s`,
                    animationFillMode: 'both',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {stat.label}
                    </span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${stat.accent}18` }}
                    >
                      <Icon size={16} style={{ color: stat.accent }} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {stat.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Two-Column Section ─── */}
          <div className="grid grid-cols-5 gap-6">

            {/* Left — Recent Sessions (3/5 width) */}
            <div
              className="col-span-3 animate-fade-in-up"
              style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                Recent Sessions
              </h2>
              <div className="flex flex-col gap-2">
                {RECENT_SESSIONS.map((session, i) => (
                  <div
                    key={session.id}
                    className="group rounded-xl border p-4 transition-all duration-200 cursor-pointer animate-fade-in-up"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      animationDelay: `${0.35 + i * 0.06}s`,
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
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {session.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {session.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Timer size={11} />
                            {session.duration}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: 'var(--border-color)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {session.deck}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div
                          className="text-sm font-bold tabular-nums px-2.5 py-1 rounded-lg"
                          style={{
                            color: getScoreColor(session.score),
                            backgroundColor: `${getScoreColor(session.score)}14`,
                          }}
                        >
                          {session.score.toFixed(1)}
                        </div>
                        <ArrowRight
                          size={14}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Quick Actions (2/5 width) */}
            <div
              className="col-span-2 flex flex-col gap-4 animate-fade-in-up"
              style={{ animationDelay: '0.35s', animationFillMode: 'both' }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Quick Actions
              </h2>

              {/* New Practice Session */}
              <Link
                href="/session"
                className="group rounded-2xl border p-5 transition-all duration-200 no-underline block"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
                  >
                    <Zap size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      New Practice Session
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      Start a live AI-coached session with real-time feedback.
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>
              </Link>

              {/* Upload Deck */}
              <Link
                href="/deck"
                className="group rounded-2xl border p-5 transition-all duration-200 no-underline block"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f97316, #eab308)' }}
                  >
                    <Upload size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      Upload Deck
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      Add a pitch deck to practice with slide-by-slide guidance.
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>
              </Link>

              {/* Pitch Tips */}
              <div
                className="rounded-2xl border p-5 animate-fade-in-up"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  animationDelay: '0.5s',
                  animationFillMode: 'both',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#eab30818' }}
                  >
                    <Lightbulb size={14} style={{ color: '#eab308' }} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Pitch Tip
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  &ldquo;{randomTip}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}
