'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  TrendingUp,
  Trophy,
  Zap,
  Calendar,
  Timer,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import {
  GlassCard,
  StatCard,
  ScoreBadge,
  TagPill,
  SectionHeader,
  getModeColor,
  getModeBgColor,
  getModeLabel,
} from '@/views/components/ui';
import type { PitchMode } from '@/views/components/ui/colors';

/* ─── Mock Data (PRD-aligned) ─── */

interface MockRun {
  id: string;
  mode: PitchMode;
  overallScore: number;
  one_line_verdict: string;
  createdAt: string;
  duration_seconds: number;
  deck?: string;
}

const RECENT_RUNS: MockRun[] = [
  {
    id: '1',
    mode: 'vc_pitch',
    overallScore: 84,
    one_line_verdict: 'Strong structure but needs concrete traction numbers',
    createdAt: '2026-02-20T14:30:00Z',
    duration_seconds: 522,
    deck: 'Series A Deck v3',
  },
  {
    id: '2',
    mode: 'vc_pitch',
    overallScore: 71,
    one_line_verdict: 'Good energy but closing section runs too long',
    createdAt: '2026-02-18T10:15:00Z',
    duration_seconds: 735,
    deck: 'Series A Deck v3',
  },
  {
    id: '3',
    mode: 'elevator',
    overallScore: 89,
    one_line_verdict: 'Punchy and clear — tighten the market claim',
    createdAt: '2026-02-16T16:45:00Z',
    duration_seconds: 38,
    deck: 'Elevator 60-sec',
  },
];

const STATS = {
  totalRuns: 24,
  averageScore: 78,
  bestScore: 92,
  trend: [62, 65, 68, 71, 67, 72, 74, 78, 84, 78],
};

const PITCH_TIPS = [
  'Start with a bold claim or surprising stat — investors hear hundreds of pitches; hook them in the first 10 seconds.',
  'Use "we" instead of "I" to emphasize the team. Investors bet on teams, not individuals.',
  'Keep your ask specific. "We\'re raising $2M at $10M pre" is stronger than "we\'re looking for funding."',
  'Pause after key points. Silence builds weight and gives your audience time to absorb.',
  'Practice the transition between your problem slide and solution slide — that\'s where most pitches lose momentum.',
];

/* ─── Helpers ─── */

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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatRunDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ─── Sparkline SVG Component ─── */

function Sparkline({
  data,
  width = 240,
  height = 80,
  strokeColor = '#ff5941',
  gradientId = 'sparkGrad',
}: {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  gradientId?: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (val - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="4"
        fill={strokeColor}
        stroke="var(--bg-surface)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ─── Page Component ─── */

export default function DashboardPage() {
  // Defer dynamic values to client to avoid hydration mismatch
  const [greeting, setGreeting] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [tip, setTip] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
    setFormattedDate(getFormattedDate());
    setTip(PITCH_TIPS[Math.floor(Math.random() * PITCH_TIPS.length)]);
  }, []);

  return (
    <main
      className="flex-1 overflow-y-auto rounded-2xl border p-8"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* ─── Welcome Header ─── */}
        <div
          className="mb-6 animate-fade-in-up"
          style={{ animationDelay: '0s', animationFillMode: 'both' }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {greeting}, Founder
          </h1>
          <p
            className="text-sm flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <Calendar size={14} />
            {formattedDate}
          </p>
        </div>

        {/* ─── Run a Pitch CTA ─── */}
        <div
          className="mb-8 animate-fade-in-up"
          style={{ animationDelay: '0.05s', animationFillMode: 'both' }}
        >
          <Link href="/session" className="block no-underline">
            <div className="session-start-wrap" style={{ borderRadius: 16, padding: 2 }}>
              <div className="session-start-glow" />
              <button
                className="session-start-btn w-full border-0 px-8 cursor-pointer
                           flex items-center justify-center gap-3
                           font-semibold text-base"
                style={{ borderRadius: 14, padding: '16px 0' }}
              >
                <Zap size={20} />
                Run a Pitch
              </button>
            </div>
          </Link>
        </div>

        {/* ─── Stat Cards Row ─── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Runs"
            value={String(STATS.totalRuns)}
            icon={<Target size={16} />}
            delta="+3"
            deltaDirection="up"
            deltaIsGood
            animationDelay="0.1s"
          />
          <StatCard
            label="Average Score"
            value={`${STATS.averageScore}/100`}
            icon={<TrendingUp size={16} />}
            delta="+4"
            deltaDirection="up"
            deltaIsGood
            animationDelay="0.16s"
          />
          <StatCard
            label="Best Score"
            value={`${STATS.bestScore}/100`}
            icon={<Trophy size={16} />}
            animationDelay="0.22s"
          />
        </div>

        {/* ─── Two-Column Layout ─── */}
        <div className="grid grid-cols-5 gap-6">
          {/* Left Column — Recent Runs (3/5) */}
          <div className="col-span-3">
            <div
              className="mb-4 animate-fade-in-up"
              style={{ animationDelay: '0.28s', animationFillMode: 'both' }}
            >
              <SectionHeader>Recent Runs</SectionHeader>
            </div>

            <div className="flex flex-col gap-2">
              {RECENT_RUNS.map((run, i) => (
                <Link
                  key={run.id}
                  href={`/results/${run.id}`}
                  className="no-underline block"
                >
                  <div
                    className="group rounded-xl border p-4 transition-all duration-200 cursor-pointer animate-fade-in-up"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      animationDelay: `${0.32 + i * 0.06}s`,
                      animationFillMode: 'both',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'var(--bg-surface-hover)';
                      e.currentTarget.style.borderColor =
                        'var(--bg-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'var(--bg-surface)';
                      e.currentTarget.style.borderColor =
                        'var(--border-color)';
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left: mode pill + meta + verdict */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <TagPill
                            label={getModeLabel(run.mode)}
                            color={getModeColor(run.mode)}
                            bgColor={getModeBgColor(run.mode)}
                          />
                          <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Calendar size={11} />
                            {formatRunDate(run.createdAt)}
                          </span>
                          <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Timer size={11} />
                            {formatDuration(run.duration_seconds)}
                          </span>
                        </div>
                        <p
                          className="text-sm truncate leading-snug"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {run.one_line_verdict}
                        </p>
                      </div>

                      {/* Right: score badge + arrow */}
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <ScoreBadge score={run.overallScore} />
                        <ArrowRight
                          size={14}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Column — Score Trend + Pitch Tip (2/5) */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* Score Trend Sparkline */}
            <GlassCard animationDelay="0.36s">
              <SectionHeader className="mb-4">
                <TrendingUp size={12} />
                Score Trend
              </SectionHeader>
              <div className="h-24 w-full">
                <Sparkline data={STATS.trend} strokeColor="#ff5941" />
              </div>
              <div className="flex items-center justify-between mt-3">
                <span
                  className="text-xs tabular-nums"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {STATS.trend.length} runs
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Latest
                  </span>
                  <ScoreBadge
                    score={STATS.trend[STATS.trend.length - 1]}
                    size="sm"
                  />
                </div>
              </div>
            </GlassCard>

            {/* Pitch Tip */}
            <GlassCard animationDelay="0.44s">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#eab30818' }}
                >
                  <Lightbulb size={14} style={{ color: '#eab308' }} />
                </div>
                <SectionHeader>Pitch Tip</SectionHeader>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                &ldquo;{tip}&rdquo;
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </main>
  );
}
