'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Activity,
  Zap,
  CreditCard,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard, SearchInput } from '@/views/components/ui';
import { useAuth } from '@/views/components/AuthProvider';
import { fetchEdge } from '@/lib/supabase/fetch-edge';

/* ——— Types ——— */

interface DailyKpi {
  day: string;
  signups: number;
  confirmed: number;
  active_users: number;
  total_runs: number;
  completed_runs: number;
  fallback_runs: number;
  referral_claims: number;
  credit_purchases: number;
  day_passes_sold: number;
}

interface Funnel {
  total_signups: number;
  confirmed: number;
  logged_in: number;
  first_run: number;
  second_run: number;
  five_runs: number;
  paid_users: number;
  confirmed_pct: number;
  logged_in_pct: number;
  first_run_pct: number;
  second_run_pct: number;
  five_runs_pct: number;
  paid_pct: number;
}

interface UserEngagement {
  user_id: string;
  email: string;
  signed_up_at: string;
  total_runs: number;
  avg_score: number;
  best_score: number;
  score_improvement: number;
  days_active: number;
  plan: string;
}

interface Revenue {
  active_pro_subs: number;
  estimated_mrr: number;
  total_day_passes: number;
  total_credits_purchased: number;
  unique_credit_buyers: number;
}

interface CohortRetention {
  cohort_week: string;
  cohort_size: number;
  weeks_since_signup: number;
  active_users: number;
  retention_pct: number;
}

interface DashboardData {
  kpis: DailyKpi[];
  funnel: Funnel | null;
  users: UserEngagement[];
  revenue: Revenue | null;
  retention: CohortRetention[];
}

type SortField = keyof Pick<
  UserEngagement,
  'email' | 'signed_up_at' | 'total_runs' | 'avg_score' | 'best_score' | 'plan' | 'days_active'
>;

/* ——— Helpers ——— */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  pro: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  day_pass: { bg: 'rgba(251,146,60,0.12)', text: '#fb923c' },
  free: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' },
};

const ROWS_PER_PAGE = 25;

/* ——— KPI Card ——— */

function KpiCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size: number }>;
  accent?: boolean;
}) {
  return (
    <GlassCard padding="md" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: accent ? 'rgba(255,89,65,0.1)' : 'rgba(148,163,184,0.08)',
            color: accent ? '#ff5941' : 'var(--text-muted)',
          }}
        >
          <Icon size={16} />
        </div>
      </div>
      <span
        className="text-2xl font-bold tabular-nums"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
    </GlassCard>
  );
}

/* ——— Skeleton ——— */

function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: 'var(--border-color)' }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassCard key={i} padding="md" animate={false}>
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-8 w-16" />
          </GlassCard>
        ))}
      </div>
      <GlassCard padding="lg" animate={false}>
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-40 w-full" />
      </GlassCard>
      <GlassCard padding="lg" animate={false}>
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

/* ——— Page ——— */

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User table state
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('total_runs');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    // Wait for auth to resolve
    if (isAuthLoading) return;

    // Redirect to login if not authenticated
    if (!authUser) {
      router.replace('/login');
      return;
    }

    fetchEdge('admin-dashboard')
      .then(async (res) => {
        if (res.status === 403) {
          throw new Error('You do not have admin access.');
        }
        if (res.status === 401) {
          throw new Error('Session expired. Please sign in again.');
        }
        if (!res.ok) {
          throw new Error('Failed to load dashboard data.');
        }
        return res.json() as Promise<DashboardData>;
      })
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthLoading, authUser, router]);

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [search]);

  /* ——— Derived values ——— */

  const kpis = data?.kpis ?? [];
  const funnel = data?.funnel;
  const revenue = data?.revenue;

  const latestKpi = kpis[0];
  const totalRunsSum = kpis.reduce((s, k) => s + (k.total_runs ?? 0), 0);

  // Sort kpis chronologically for chart
  const chartKpis = useMemo(() => [...kpis].reverse(), [kpis]);
  const maxActiveUsers = Math.max(...chartKpis.map((k) => k.active_users ?? 0), 1);

  // Filtered + sorted users
  const filteredUsers = useMemo(() => {
    let users = data?.users ?? [];
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.email?.toLowerCase().includes(q));
    }
    users = [...users].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortAsc ? aNum - bNum : bNum - aNum;
    });
    return users;
  }, [data?.users, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ROWS_PER_PAGE));
  const pagedUsers = filteredUsers.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE,
  );

  // Funnel steps
  const funnelSteps = funnel
    ? [
        { label: 'Signups', value: funnel.total_signups, pct: 100 },
        { label: 'Confirmed', value: funnel.confirmed, pct: funnel.confirmed_pct },
        { label: 'Logged In', value: funnel.logged_in, pct: funnel.logged_in_pct },
        { label: 'First Run', value: funnel.first_run, pct: funnel.first_run_pct },
        { label: 'Second Run', value: funnel.second_run, pct: funnel.second_run_pct },
        { label: '5 Runs', value: funnel.five_runs, pct: funnel.five_runs_pct },
        { label: 'Paid', value: funnel.paid_users, pct: funnel.paid_pct },
      ]
    : [];

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  const SortHeader = ({
    field,
    children,
    align = 'left',
  }: {
    field: SortField;
    children: React.ReactNode;
    align?: 'left' | 'right';
  }) => (
    <th
      className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      style={{ color: 'var(--text-muted)' }}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown
          size={12}
          style={{
            opacity: sortField === field ? 1 : 0.3,
            color: sortField === field ? '#ff5941' : undefined,
          }}
        />
      </span>
    </th>
  );

  /* ——— Render ——— */

  if (loading) {
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
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-40 mb-8" />
          <LoadingSkeleton />
        </div>
      </main>
    );
  }

  if (error) {
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
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
          <AlertTriangle size={48} style={{ color: '#ff5941' }} />
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Access Denied
          </h1>
          <p
            className="text-sm text-center max-w-md"
            style={{ color: 'var(--text-muted)' }}
          >
            {error}
          </p>
        </div>
      </main>
    );
  }

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
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* ——— Header ——— */}
        <div className="animate-fade-in-up" style={{ animationFillMode: 'both' }}>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Admin Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {getFormattedDate()}
          </p>
        </div>

        {/* ——— KPI Cards ——— */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-fade-in-up"
          style={{ animationDelay: '0.06s', animationFillMode: 'both' }}
        >
          <KpiCard
            label="Total Users"
            value={funnel?.total_signups?.toLocaleString() ?? '—'}
            icon={Users}
            accent
          />
          <KpiCard
            label="Active Today"
            value={latestKpi?.active_users?.toLocaleString() ?? '—'}
            icon={Activity}
          />
          <KpiCard
            label="Runs (30d)"
            value={totalRunsSum.toLocaleString()}
            icon={Zap}
          />
          <KpiCard
            label="Paid Users"
            value={funnel?.paid_users?.toLocaleString() ?? '—'}
            icon={CreditCard}
          />
          <KpiCard
            label="MRR"
            value={revenue ? formatCurrency(revenue.estimated_mrr) : '—'}
            icon={DollarSign}
            accent
          />
          <KpiCard
            label="Conversion"
            value={funnel?.paid_pct != null ? `${funnel.paid_pct.toFixed(1)}%` : '—'}
            icon={TrendingUp}
          />
        </div>

        {/* ——— Daily Activity Chart ——— */}
        <GlassCard
          padding="lg"
          animationDelay="0.12s"
          className="animate-fade-in-up"
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-4"
            style={{ color: 'var(--text-muted)' }}
          >
            Daily Active Users (Last 30 Days)
          </h2>
          <div className="flex items-end gap-[3px]" style={{ height: 160 }}>
            {chartKpis.map((kpi, i) => {
              const pct = (kpi.active_users / maxActiveUsers) * 100;
              const showLabel = i % 7 === 0;
              return (
                <div
                  key={kpi.day}
                  className="flex-1 flex flex-col items-center justify-end"
                  style={{ height: '100%' }}
                >
                  <div
                    className="relative group w-full rounded-t-sm"
                    style={{
                      height: `${Math.max(pct, 2)}%`,
                      backgroundColor: '#ff5941',
                      opacity: 0.7 + (pct / 100) * 0.3,
                      minHeight: 2,
                      transition: 'opacity 0.2s',
                    }}
                    title={`${formatShortDate(kpi.day)}: ${kpi.active_users} users`}
                  />
                  {showLabel && (
                    <span
                      className="text-[9px] mt-1 tabular-nums whitespace-nowrap"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {formatShortDate(kpi.day)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* ——— Funnel ——— */}
        {funnelSteps.length > 0 && (
          <GlassCard
            padding="lg"
            animationDelay="0.18s"
            className="animate-fade-in-up"
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-5"
              style={{ color: 'var(--text-muted)' }}
            >
              User Funnel
            </h2>
            <div className="flex flex-col gap-3">
              {funnelSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span
                    className="text-xs font-medium w-20 text-right tabular-nums flex-shrink-0"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {step.label}
                  </span>
                  <div
                    className="flex-1 h-7 rounded-lg overflow-hidden relative"
                    style={{ backgroundColor: 'var(--border-color)' }}
                  >
                    <div
                      className="h-full rounded-lg flex items-center px-2 transition-all duration-500"
                      style={{
                        width: `${Math.max(step.pct, 1)}%`,
                        background:
                          'linear-gradient(90deg, #ff5941, rgba(255,89,65,0.7))',
                        minWidth: 40,
                      }}
                    >
                      <span
                        className="text-[11px] font-semibold tabular-nums whitespace-nowrap"
                        style={{ color: '#fff' }}
                      >
                        {step.value.toLocaleString()} ({step.pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* ——— User Table ——— */}
        <GlassCard
          padding="lg"
          animationDelay="0.24s"
          className="animate-fade-in-up"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              User Engagement ({filteredUsers.length})
            </h2>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Filter by email..."
              className="w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <SortHeader field="email">Email</SortHeader>
                  <SortHeader field="signed_up_at">Signed Up</SortHeader>
                  <SortHeader field="total_runs" align="right">Runs</SortHeader>
                  <SortHeader field="avg_score" align="right">Avg Score</SortHeader>
                  <SortHeader field="best_score" align="right">Best</SortHeader>
                  <SortHeader field="plan">Plan</SortHeader>
                  <SortHeader field="days_active" align="right">Days Active</SortHeader>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((user) => {
                  const planStyle = PLAN_COLORS[user.plan] ?? PLAN_COLORS.free;
                  return (
                    <tr
                      key={user.user_id}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td
                        className="px-3 py-2.5 text-sm truncate max-w-[200px]"
                        style={{ color: 'var(--text-primary)' }}
                        title={user.email}
                      >
                        {user.email}
                      </td>
                      <td
                        className="px-3 py-2.5 text-sm tabular-nums whitespace-nowrap"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {formatDate(user.signed_up_at)}
                      </td>
                      <td
                        className="px-3 py-2.5 text-sm tabular-nums text-right font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {user.total_runs}
                      </td>
                      <td
                        className="px-3 py-2.5 text-sm tabular-nums text-right"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {user.avg_score != null ? user.avg_score.toFixed(1) : '—'}
                      </td>
                      <td
                        className="px-3 py-2.5 text-sm tabular-nums text-right"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {user.best_score ?? '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold"
                          style={{
                            backgroundColor: planStyle.bg,
                            color: planStyle.text,
                          }}
                        >
                          {user.plan ?? 'free'}
                        </span>
                      </td>
                      <td
                        className="px-3 py-2.5 text-sm tabular-nums text-right"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {user.days_active}
                      </td>
                    </tr>
                  );
                })}
                {pagedUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-8 text-center text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <span
                className="text-xs tabular-nums"
                style={{ color: 'var(--text-muted)' }}
              >
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg border transition-colors disabled:opacity-30"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                    cursor: page === 0 ? 'default' : 'pointer',
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border transition-colors disabled:opacity-30"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                    cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        {/* ——— Revenue Summary ——— */}
        {revenue && (
          <GlassCard
            padding="lg"
            animationDelay="0.30s"
            className="animate-fade-in-up"
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Revenue Breakdown
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Active Pro Subs', value: revenue.active_pro_subs },
                { label: 'Estimated MRR', value: formatCurrency(revenue.estimated_mrr) },
                { label: 'Day Passes Sold', value: revenue.total_day_passes },
                { label: 'Credits Purchased', value: revenue.total_credits_purchased },
                { label: 'Credit Buyers', value: revenue.unique_credit_buyers },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border p-3 text-center"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider block mb-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {typeof item.value === 'number'
                      ? item.value.toLocaleString()
                      : item.value}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* ——— Cohort Retention ——— */}
        {data?.retention && data.retention.length > 0 && (
          <GlassCard
            padding="lg"
            animationDelay="0.36s"
            className="animate-fade-in-up"
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              Cohort Retention
            </h2>
            <div className="overflow-x-auto">
              <CohortTable retention={data.retention} />
            </div>
          </GlassCard>
        )}
      </div>
    </main>
  );
}

/* ——— Cohort Table ——— */

function CohortTable({ retention }: { retention: CohortRetention[] }) {
  // Group by cohort week
  const cohorts = useMemo(() => {
    const map = new Map<string, Map<number, CohortRetention>>();
    for (const row of retention) {
      if (!map.has(row.cohort_week)) {
        map.set(row.cohort_week, new Map());
      }
      map.get(row.cohort_week)!.set(row.weeks_since_signup, row);
    }
    return map;
  }, [retention]);

  const maxWeek = Math.max(...retention.map((r) => r.weeks_since_signup));
  const weeks = Array.from({ length: maxWeek + 1 }, (_, i) => i);
  const sortedCohorts = [...cohorts.entries()].sort(([a], [b]) =>
    b.localeCompare(a),
  );

  // Only show first 12 cohorts and 12 weeks to keep it readable
  const displayCohorts = sortedCohorts.slice(0, 12);
  const displayWeeks = weeks.slice(0, 12);

  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          <th
            className="px-2 py-2 text-left font-semibold whitespace-nowrap"
            style={{ color: 'var(--text-muted)' }}
          >
            Cohort
          </th>
          <th
            className="px-2 py-2 text-right font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Size
          </th>
          {displayWeeks.map((w) => (
            <th
              key={w}
              className="px-2 py-2 text-center font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              W{w}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {displayCohorts.map(([week, weekData]) => {
          const w0 = weekData.get(0);
          return (
            <tr
              key={week}
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <td
                className="px-2 py-1.5 whitespace-nowrap tabular-nums"
                style={{ color: 'var(--text-secondary)' }}
              >
                {formatShortDate(week)}
              </td>
              <td
                className="px-2 py-1.5 text-right tabular-nums font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {w0?.cohort_size ?? '—'}
              </td>
              {displayWeeks.map((w) => {
                const cell = weekData.get(w);
                const pct = cell?.retention_pct ?? 0;
                const opacity = pct / 100;
                return (
                  <td key={w} className="px-2 py-1.5 text-center">
                    {cell ? (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded tabular-nums font-medium"
                        style={{
                          backgroundColor: `rgba(255,89,65,${Math.max(opacity * 0.4, 0.04)})`,
                          color:
                            pct > 50
                              ? '#ff5941'
                              : pct > 20
                                ? 'var(--text-secondary)'
                                : 'var(--text-muted)',
                        }}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>
                        —
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
