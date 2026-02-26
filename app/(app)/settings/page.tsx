'use client';

import { useEffect, useState } from 'react';
import {
  Award,
  CreditCard,
  ExternalLink,
  Palette,
  Shield,
  Trash2,
  Download,
  Sliders,
  Plus,
  Minus,
  Sun,
  Moon,
  Monitor,
  Settings,
} from 'lucide-react';
import { useTheme, type ThemePreference } from '@/views/components/ThemeProvider';
import { useSettings } from '@/hooks/useSettings';
import { useAchievements } from '@/hooks/useAchievements';
import { useBilling } from '@/hooks/useBilling';
import { AchievementGrid } from '@/views/components/achievements';
import { SubscriptionBadge, UsageBar, PlanCard } from '@/views/components/billing';
import { getAllPlans } from '@/config/billing';
import type { BillingPlanId, BillingInterval } from '@/types/billing';
import type { ProgressRunRecord } from '@/lib/progress';
import { fetchEdge } from '@/lib/supabase/fetch-edge';

/* ——— Types ——— */


interface RawRunRecord {
  id: string;
  mode: string;
  overallScore: number;
  createdAt: string;
  analysis: {
    one_line_verdict: string;
    rubric_breakdown: { category: string; score: number; max_score: number }[];
    delivery_metrics: { duration_seconds: number; wpm: number; filler_rate: number };
    top_fixes?: { rank: number; category: string; issue: string; fix: string; impact: string }[];
  };
}

/* ——— Reusable: Section Card ——— */

function SectionCard({
  icon: Icon,
  title,
  delay,
  id: sectionId,
  children,
  iconColor,
  titleColor,
  borderColor,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  delay: number;
  id?: string;
  children: React.ReactNode;
  iconColor?: string;
  titleColor?: string;
  borderColor?: string;
}) {
  return (
    <div
      id={sectionId}
      className="rounded-2xl border p-6 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: borderColor ?? 'var(--border-color)',
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ backgroundColor: iconColor ? `${iconColor}1a` : 'var(--bg-surface-hover)' }}
        >
          <Icon size={16} style={iconColor ? { color: iconColor } : undefined} />
        </div>
        <h2
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: titleColor ?? 'var(--text-primary)' }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

/* ——— Reusable: Setting Row ——— */

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
    </div>
  );
}

/* ——— Page ——— */

export default function SettingsPage() {
  const { isDark, preference, setTheme } = useTheme();
  const { settings, adjustTimer, update } = useSettings();
  const achievements = useAchievements();
  const billing = useBilling();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Fetch runs for achievement computation
  const [runs, setRuns] = useState<ProgressRunRecord[]>([]);

  useEffect(() => {
    fetchEdge('settings')
      .then((r) => r.json())
      .then((payload: { runs?: RawRunRecord[] }) => {
        const data = Array.isArray(payload.runs) ? payload.runs : [];
        const normalized: ProgressRunRecord[] = data.map((raw) => ({
          id: raw.id,
          createdAt: raw.createdAt,
          overallScore: raw.overallScore,
          mode: raw.mode,
          analysis: {
            one_line_verdict: raw.analysis.one_line_verdict,
            rubric_breakdown: raw.analysis.rubric_breakdown ?? [],
            delivery_metrics: {
              duration_seconds: raw.analysis.delivery_metrics?.duration_seconds ?? 0,
              wpm: raw.analysis.delivery_metrics?.wpm ?? 0,
              filler_rate: raw.analysis.delivery_metrics?.filler_rate ?? 0,
            },
            top_fixes: raw.analysis.top_fixes ?? [],
          },
        }));
        setRuns(normalized);
      })
      .catch(() => setRuns([]));
  }, []);

  function persistSetting(updates: Record<string, unknown>) {
    fetchEdge('settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {
      // Settings are also persisted locally — remote sync failure is non-critical
    });
  }

  useEffect(() => {
    if (runs.length > 0) achievements.processRuns(runs);
  }, [runs, achievements.processRuns]);

  // Scroll to hash on mount
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, []);

  const handleThemeChange = (choice: ThemePreference) => {
    setTheme(choice);
  };

  const themeOptions: { key: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { key: 'system', label: 'System', icon: <Monitor size={12} /> },
    { key: 'light', label: 'Light', icon: <Sun size={12} /> },
    { key: 'dark', label: 'Dark', icon: <Moon size={12} /> },
  ];

  // Timer display
  const timerMin = Math.floor(settings.timerDuration / 60);
  const timerSec = settings.timerDuration % 60;
  const formattedTimer = `${timerMin}:${String(timerSec).padStart(2, '0')}`;

  // Mode options
  const modeOptions: { key: 'elevator' | 'vc_pitch'; label: string }[] = [
    { key: 'elevator', label: 'Elevator' },
    { key: 'vc_pitch', label: 'VC Pitch' },
  ];

  // Export data handler
  const handleExport = async () => {
    try {
      const payload = await fetchEdge('pitch-run').then((r) => r.json());
      const data = Array.isArray(payload?.runs) ? payload.runs : [];
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pitchr-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export data.');
    }
  };

  // Clear all data handler
  const handleClearAll = async () => {
    if (!confirm('Delete ALL pitch runs and reset achievements? This cannot be undone.')) return;
    try {
      const payload = await fetchEdge('pitch-run', { params: { includePending: 'true' } }).then((r) => r.json());
      const allRuns = Array.isArray(payload?.runs) ? payload.runs : [];
      await Promise.all(allRuns.map((r: { id: string }) => fetchEdge('pitch-run-detail', { method: 'DELETE', params: { runId: r.id } })));
      achievements.resetAchievements();
      setRuns([]);
      alert('All data cleared.');
    } catch {
      alert('Failed to clear data.');
    }
  };

  return (
    <main className="flex-1 overflow-y-auto pr-1">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 animate-fade-in-up" style={{ animationFillMode: 'backwards' }}>
          <Settings size={24} style={{ color: 'var(--text-primary)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Settings
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Customize your practice experience
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* ——— Achievements Showcase ——— */}
          <SectionCard icon={Award} title="Achievements" delay={60} id="achievements" iconColor="#eab308">
            <AchievementGrid state={achievements.state} />
          </SectionCard>

          {/* ——— Billing & Subscription ——— */}
          <SectionCard icon={CreditCard} title="Plan & Billing" delay={90} id="billing" iconColor="#ff5941">
            {billing.isLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center">
                <div
                  className="w-4 h-4 rounded-full animate-pulse"
                  style={{ backgroundColor: 'rgba(255, 89, 65, 0.3)' }}
                />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading your plan...</p>
              </div>
            ) : billing.subscription ? (
              <div className="space-y-6">
                {/* Current plan header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SubscriptionBadge
                      planId={billing.subscription.planId as BillingPlanId}
                      status={billing.subscription.status}
                      cancelAtPeriodEnd={billing.subscription.cancelAtPeriodEnd}
                    />
                    {billing.usage && (
                      <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                        {new Date(billing.usage.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' \u2014 '}
                        {new Date(billing.usage.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  {billing.subscription.hasStripeSubscription && (
                    <button
                      onClick={() => billing.openPortal()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'transparent',
                      }}
                    >
                      <ExternalLink size={12} />
                      Manage Billing
                    </button>
                  )}
                </div>

                {/* Usage bars */}
                {billing.usage && (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: 'var(--bg-surface-hover)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                      Usage This Period
                    </p>
                    <UsageBar label="Pitch Analyses" used={billing.usage.runsUsed} limit={billing.usage.runsLimit} />
                    <UsageBar label="Deck Uploads" used={billing.usage.decksUsed} limit={billing.usage.decksLimit} />
                    <UsageBar label="Q&A Time (seconds)" used={billing.usage.qaSecondsUsed} limit={billing.usage.qaSecondsLimit} />
                  </div>
                )}

                {/* Pricing section header */}
                <div className="text-center pt-2">
                  <h3
                    className="text-lg font-bold tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Choose Your Plan
                  </h3>
                  <p
                    className="text-[13px] mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Scale your pitch coaching as you grow
                  </p>
                </div>

                {/* Interval toggle - pill style */}
                <div className="flex items-center justify-center gap-1 pt-1">
                  <div
                    className="inline-flex items-center rounded-full p-1 gap-0.5"
                    style={{
                      backgroundColor: 'var(--bg-surface-hover)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <button
                      onClick={() => setBillingInterval('month')}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                      style={{
                        backgroundColor: billingInterval === 'month' ? 'var(--bg-primary)' : 'transparent',
                        color: billingInterval === 'month' ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: billingInterval === 'month' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingInterval('year')}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5"
                      style={{
                        backgroundColor: billingInterval === 'year' ? 'var(--bg-primary)' : 'transparent',
                        color: billingInterval === 'year' ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: billingInterval === 'year' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      Yearly
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' }}
                      >
                        -17%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plan cards grid */}
                <div className="pricing-grid grid gap-4 items-stretch pt-1">
                  {getAllPlans().map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      interval={billingInterval}
                      currentPlanId={billing.subscription!.planId as BillingPlanId}
                      isLoading={isCheckoutLoading}
                      onSelect={async (planId, interval) => {
                        try {
                          setIsCheckoutLoading(true);
                          await billing.startCheckout(planId, interval);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Checkout failed');
                        } finally {
                          setIsCheckoutLoading(false);
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Trust signals */}
                <div className="flex items-center justify-center gap-6 pt-2 pb-1">
                  <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Secure checkout
                  </span>
                  <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Powered by Stripe
                  </span>
                  <span className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    Cancel anytime
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Unable to load billing information.
                </p>
                <button
                  onClick={() => billing.refresh()}
                  className="mt-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  style={{ color: '#ff5941', backgroundColor: 'rgba(255, 89, 65, 0.08)' }}
                >
                  Retry
                </button>
              </div>
            )}
          </SectionCard>

          {/* ——— Appearance ——— */}
          <SectionCard icon={Palette} title="Appearance" delay={120}>
            <SettingRow label="Theme" description="Choose your preferred color mode">
              <div
                className="inline-flex rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--border-color)' }}
              >
                {themeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleThemeChange(opt.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200"
                    style={{
                      backgroundColor: preference === opt.key ? 'rgba(255, 89, 65, 0.12)' : 'transparent',
                      color: preference === opt.key ? '#ff5941' : 'var(--text-muted)',
                      borderRight: '1px solid var(--border-color)',
                    }}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </SettingRow>
          </SectionCard>

          {/* ——— Session Defaults ——— */}
          <SectionCard icon={Sliders} title="Session Defaults" delay={180}>
            {/* Timer Duration */}
            <SettingRow label="Timer Duration" description="Default practice timer length">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustTimer(-30)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <Minus size={12} />
                </button>
                <span
                  className="w-12 text-center text-sm font-mono font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formattedTimer}
                </span>
                <button
                  onClick={() => adjustTimer(30)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <Plus size={12} />
                </button>
              </div>
            </SettingRow>

            <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />

            {/* Default Pitch Mode */}
            <SettingRow label="Default Pitch Mode" description="Starting mode for new sessions">
              <div
                className="inline-flex rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--border-color)' }}
              >
                {modeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => update({ defaultMode: opt.key })}
                    className="px-3 py-1.5 text-xs font-medium transition-all duration-200"
                    style={{
                      backgroundColor: settings.defaultMode === opt.key ? 'rgba(255, 89, 65, 0.12)' : 'transparent',
                      color: settings.defaultMode === opt.key ? '#ff5941' : 'var(--text-muted)',
                      borderRight: '1px solid var(--border-color)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </SettingRow>
          </SectionCard>

          {/* ——— Data Management (Danger Zone) ——— */}
          <SectionCard
            icon={Shield}
            title="Data Management"
            delay={240}
            iconColor="#ef4444"
            titleColor="#ef4444"
            borderColor="rgba(239, 68, 68, 0.15)"
          >
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Export your data or clear everything. Clearing is irreversible.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  backgroundColor: 'transparent',
                }}
              >
                <Trash2 size={13} />
                Delete All Data
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                }}
              >
                <Download size={13} />
                Export Data
              </button>
            </div>
          </SectionCard>

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </div>
    </main>
  );
}
