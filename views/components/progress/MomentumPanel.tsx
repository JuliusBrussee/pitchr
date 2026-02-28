'use client';

import { useMemo } from 'react';
import {
  Flame,
  BarChart3,
  TrendingUp,
  Trophy,
  ArrowUpRight,
  Zap,
  Target,
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

function getWinEmoji(delta: number): string {
  if (delta >= 10) return '🏆';
  if (delta >= 5) return '🔥';
  if (delta >= 3) return '⚡';
  return '📈';
}

/* ——— Stat Item ——— */

function StatItem({
  icon: Icon,
  label,
  value,
  color,
  sub,
  index = 0,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  color: string;
  sub?: string;
  index?: number;
}) {
  return (
    <div
      className="flex items-center gap-3 group"
      style={{
        animation: 'momentumStatReveal 0.4s ease-out both',
        animationDelay: `${200 + index * 80}ms`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{
          backgroundColor: `${color}14`,
          boxShadow: `0 0 12px ${color}0a`,
        }}
      >
        <Icon size={15} style={{ color }} strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-base font-bold tabular-nums tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {value}
          </span>
          {sub && (
            <span
              className="text-[9px] font-medium"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            >
              {sub}
            </span>
          )}
        </div>
        <div
          className="text-[10px] font-medium tracking-wide uppercase"
          style={{ color: 'var(--text-muted)', opacity: 0.7 }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

/* ——— Mini Trend Chart ——— */

function TrendChart({ history }: { history: { score: number }[] }) {
  if (history.length < 2) {
    return (
      <div
        className="flex items-center justify-center h-12 text-[10px] italic"
        style={{ color: 'var(--text-muted)', opacity: 0.6 }}
      >
        Complete more sessions to see trends
      </div>
    );
  }

  const recent = history.slice(-8);
  const max = Math.max(...recent.map((h) => h.score), 1);
  const min = Math.min(...recent.map((h) => h.score));
  const range = max - min || 1;

  // Use a wide, proportional viewBox so the chart doesn't distort
  const W = 280;
  const H = 48;
  const padX = 4;
  const padY = 6;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const points = recent.map((h, i) => {
    const x = padX + (recent.length === 1 ? chartW / 2 : (i / (recent.length - 1)) * chartW);
    const y = padY + chartH - ((h.score - min) / range) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;
  const last = points[points.length - 1];

  return (
    <div className="relative" style={{ height: H + 16 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5941" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ff5941" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#trendGrad)"
          style={{
            animation: 'trendAreaReveal 0.8s ease-out both',
            animationDelay: '400ms',
          }}
        />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#ff5941"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: 'trendLineReveal 0.6s ease-out both',
            animationDelay: '300ms',
          }}
        />
        {/* End dot with pulse */}
        <g style={{ animation: 'trendDotPop 0.3s ease-out both', animationDelay: '700ms' }}>
          <circle cx={last.x} cy={last.y} r="5" fill="#ff5941" opacity="0.15">
            <animate attributeName="r" values="5;8;5" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0.04;0.15" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={last.x} cy={last.y} r="3" fill="#ff5941" />
        </g>
      </svg>
      {/* Score labels */}
      <div className="absolute inset-x-1 bottom-0 flex justify-between pointer-events-none">
        <span className="text-[9px] font-medium tabular-nums" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          {recent[0].score}
        </span>
        <span className="text-[9px] font-bold tabular-nums" style={{ color: '#ff5941' }}>
          {recent[recent.length - 1].score}
        </span>
      </div>
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
      {/* ═══ Momentum Stats Card ═══ */}
      <div
        className="momentum-card rounded-2xl border relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Ambient top-edge glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,89,65,0.3), transparent)',
          }}
        />

        <div className="p-4 pb-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{ color: 'var(--text-muted)' }}
              >
                Momentum
              </span>
              {improvingCount > 0 && (
                <span
                  className="momentum-badge text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{
                    backgroundColor: 'rgba(34,197,94,0.10)',
                    color: '#22c55e',
                    border: '1px solid rgba(34,197,94,0.15)',
                  }}
                >
                  <TrendingUp size={8} strokeWidth={3} />
                  {improvingCount} rising
                </span>
              )}
            </div>
            {progress.currentStreak >= 3 && (
              <div
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: 'rgba(249,115,22,0.10)',
                  color: '#f97316',
                  border: '1px solid rgba(249,115,22,0.12)',
                }}
              >
                🔥 On fire
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-3.5">
            <StatItem
              icon={Flame}
              label="Current streak"
              value={`${progress.currentStreak} run${progress.currentStreak !== 1 ? 's' : ''}`}
              color="#f97316"
              sub={progress.longestStreak > progress.currentStreak ? `best: ${progress.longestStreak}` : undefined}
              index={0}
            />
            <StatItem
              icon={BarChart3}
              label="Total sessions"
              value={String(progress.totalSessions)}
              color="#3b82f6"
              index={1}
            />
            <StatItem
              icon={TrendingUp}
              label="Overall change"
              value={`${progress.overallDelta > 0 ? '+' : ''}${progress.overallDelta} pts`}
              color={progress.overallDelta > 0 ? '#22c55e' : progress.overallDelta < 0 ? '#ef4444' : '#6b7280'}
              index={2}
            />
          </div>
        </div>

        {/* Trend section */}
        <div
          className="px-4 pb-4 pt-3"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'var(--text-muted)', opacity: 0.7 }}
            >
              Recent sessions
            </span>
            {progress.overallTrend.length >= 2 && (
              <span
                className="text-[9px] font-medium"
                style={{ color: 'var(--text-muted)', opacity: 0.5 }}
              >
                last {Math.min(progress.overallTrend.length, 8)}
              </span>
            )}
          </div>
          <TrendChart history={progress.overallTrend} />
        </div>
      </div>

      {/* ═══ Biggest Win / Focus Card ═══ */}
      <div
        className="biggest-win-card rounded-2xl border relative overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
        }}
      >
        {biggestWin ? (
          <>
            {/* Multi-layer ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 85% 15%, ${getRubricColor(biggestWin.id)}12 0%, transparent 50%)`,
              }}
            />
            <div
              className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${getRubricColor(biggestWin.id)}08, transparent 70%)`,
                animation: 'winGlowPulse 3s ease-in-out infinite',
              }}
            />

            <div className="relative p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
                      border: '1px solid rgba(234,179,8,0.12)',
                    }}
                  >
                    <Trophy size={11} style={{ color: '#eab308' }} strokeWidth={2.5} />
                  </div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Biggest Win
                  </span>
                </div>
                <span className="text-sm" role="img" aria-label="win">
                  {getWinEmoji(biggestWin.delta)}
                </span>
              </div>

              {/* Skill name */}
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: getRubricColor(biggestWin.id),
                    boxShadow: `0 0 8px ${getRubricColor(biggestWin.id)}40`,
                  }}
                />
                <span
                  className="text-sm font-semibold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {biggestWin.label}
                </span>
              </div>

              {/* Delta showcase */}
              <div
                className="flex items-baseline gap-2 mb-3"
                style={{
                  animation: 'deltaCountUp 0.6s ease-out both',
                  animationDelay: '300ms',
                }}
              >
                <ArrowUpRight
                  size={16}
                  style={{ color: '#22c55e' }}
                  strokeWidth={2.5}
                  className="self-center"
                />
                <span
                  className="text-3xl font-extrabold tabular-nums tracking-tighter"
                  style={{
                    color: '#22c55e',
                    textShadow: '0 0 24px rgba(34,197,94,0.15)',
                  }}
                >
                  +{biggestWin.delta.toFixed(1)}
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  pts since first session
                </span>
              </div>

              {/* Win message */}
              <p
                className="text-[11px] leading-relaxed mb-4"
                style={{
                  color: '#22c55e',
                  opacity: 0.8,
                }}
              >
                {getWinMessage(biggestWin)}
              </p>

              {/* Focus area */}
              {weakest && weakest.id !== biggestWin.id && (
                <div
                  className="rounded-xl p-3 flex items-start gap-2.5 transition-colors duration-200"
                  style={{
                    backgroundColor: `${getRubricColor(weakest.id)}06`,
                    border: `1px solid ${getRubricColor(weakest.id)}10`,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${getRubricColor(weakest.id)}12`,
                    }}
                  >
                    <Target size={10} style={{ color: getRubricColor(weakest.id) }} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: 'var(--text-muted)', opacity: 0.7 }}
                    >
                      Focus next on
                    </span>
                    <p
                      className="text-[11px] font-semibold mt-0.5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {weakest.label}
                      <span
                        className="font-normal ml-1.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        — {weakest.currentAvg.toFixed(1)}/20
                      </span>
                    </p>
                    {/* Mini progress hint */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div
                        className="h-1 flex-1 rounded-full overflow-hidden"
                        style={{ backgroundColor: `${getRubricColor(weakest.id)}10` }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(weakest.currentAvg / 20) * 100}%`,
                            backgroundColor: getRubricColor(weakest.id),
                            opacity: 0.6,
                            animation: 'focusBarFill 0.8s ease-out both',
                            animationDelay: '500ms',
                          }}
                        />
                      </div>
                      <span
                        className="text-[8px] font-bold tabular-nums"
                        style={{ color: getRubricColor(weakest.id), opacity: 0.6 }}
                      >
                        {Math.round((weakest.currentAvg / 20) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ——— Empty state ——— */
          <div className="h-full flex flex-col justify-center items-center text-center p-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(255,89,65,0.12), rgba(255,89,65,0.04))',
                border: '1px solid rgba(255,89,65,0.10)',
              }}
            >
              <Zap size={20} style={{ color: '#ff5941' }} />
            </div>
            <span
              className="text-xs font-semibold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Your wins will show here
            </span>
            <span
              className="text-[11px] leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Complete 2+ sessions to start tracking improvement
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
