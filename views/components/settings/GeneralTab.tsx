'use client';

import { useEffect, useState } from 'react';
import {
  Palette,
  Shield,
  Sliders,
  Plus,
  Minus,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  MessageCircle,
  Trash2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { useTheme, type ThemePreference } from '@/views/components/ThemeProvider';
import { useSettings } from '@/hooks/useSettings';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTutorial } from '@/hooks/useTutorial';
import { useCompliance } from '@/hooks/useCompliance';
import { useBilling } from '@/hooks/useBilling';
import { useAuth } from '@/views/components/AuthProvider';
import { useToast } from '@/views/components/Toast';
import { useRouter } from 'next/navigation';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { createClient } from '@/lib/supabase/client';
import { ConfirmDialog } from '@/views/components/ui';
import { SectionCard } from './SectionCard';
import { SettingRow } from './SettingRow';
import { DeleteAccountDialog } from './DeleteAccountDialog';

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { key: 'system', label: 'System', icon: <Monitor size={12} /> },
  { key: 'light', label: 'Light', icon: <Sun size={12} /> },
  { key: 'dark', label: 'Dark', icon: <Moon size={12} /> },
];

export function GeneralTab() {
  const router = useRouter();
  const { preference, setTheme } = useTheme();
  const { settings, adjustTimer } = useSettings();
  const onboarding = useOnboarding();
  const { resetTours } = useTutorial();
  const compliance = useCompliance();
  const billing = useBilling();
  const { user } = useAuth();
  const { toast } = useToast();

  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isConsentSaving, setIsConsentSaving] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const hasActivePaidPlan = billing.subscription
    ? billing.subscription.planId !== 'free' && billing.subscription.status === 'active'
    : false;

  useEffect(() => {
    if (!compliance.status) return;
    setAnalyticsConsent(compliance.status.analyticsOptIn);
    setMarketingConsent(compliance.status.marketingOptIn);
  }, [compliance.status]);

  async function persistConsents(next: { analyticsOptIn?: boolean; marketingOptIn?: boolean }) {
    setIsConsentSaving(true);
    try {
      await compliance.updateConsents(next);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update privacy preferences.');
    } finally {
      setIsConsentSaving(false);
    }
  }

  const timerMin = Math.floor(settings.timerDuration / 60);
  const timerSec = settings.timerDuration % 60;
  const formattedTimer = `${timerMin}:${String(timerSec).padStart(2, '0')}`;

  const handleExport = async () => {
    try {
      const payload = await fetchEdge('pitch-run', { params: { allProjects: 'true' } }).then((r) => r.json());
      const data = Array.isArray(payload?.runs) ? payload.runs : [];
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pitchr-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('error', 'Failed to export data.');
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const payload = await fetchEdge('pitch-run', {
        params: { includePending: 'true', allProjects: 'true' },
      }).then((r) => r.json());
      const allRuns = Array.isArray(payload?.runs) ? payload.runs : [];
      await Promise.all(allRuns.map((r: { id: string }) => fetchEdge('pitch-run-detail', { method: 'DELETE', params: { runId: r.id } })));
      toast('success', 'All data cleared successfully.');
      setShowClearAllConfirm(false);
    } catch {
      toast('error', 'Failed to clear data.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Appearance */}
      <SectionCard icon={Palette} title="Appearance" delay={0} compact>
        <SettingRow label="Theme" description="Choose your preferred color mode">
          <div
            className="inline-flex rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border-color)' }}
          >
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
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

      {/* Session Defaults */}
      <SectionCard icon={Sliders} title="Session Defaults" delay={40} compact>
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
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Workflow defaults now follow your selected project. Choose project before each session.
        </p>
      </SectionCard>

      {/* Onboarding & Tips */}
      <SectionCard icon={RotateCcw} title="Onboarding & Tips" delay={80} iconColor="#3b82f6" compact>
        <SettingRow label="Replay onboarding" description="Walk through the product introduction again">
          <button
            onClick={() => {
              onboarding.reset();
              router.push('/try');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              backgroundColor: 'transparent',
            }}
          >
            <RotateCcw size={13} />
            Replay
          </button>
        </SettingRow>
        <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />
        <SettingRow label="Reset page tips" description="Show guided tours again on each page">
          <button
            onClick={() => {
              resetTours();
              toast('success', 'Page tips have been reset.');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              backgroundColor: 'transparent',
            }}
          >
            <MessageCircle size={13} />
            Reset Tips
          </button>
        </SettingRow>
      </SectionCard>

      {/* Privacy */}
      <SectionCard icon={Shield} title="Privacy Preferences" delay={120} iconColor="#16a34a" compact>
        {compliance.isLoading ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Loading privacy preferences...
          </p>
        ) : (
          <>
            <SettingRow
              label="Analytics Cookies"
              description="Allow analytics scripts to improve product quality."
            >
              <input
                type="checkbox"
                checked={analyticsConsent}
                disabled={isConsentSaving}
                onChange={async (event) => {
                  const next = event.target.checked;
                  const previous = analyticsConsent;
                  setAnalyticsConsent(next);
                  try {
                    await persistConsents({ analyticsOptIn: next });
                  } catch (error) {
                    setAnalyticsConsent(previous);
                    toast('error', error instanceof Error ? error.message : 'Failed to update analytics preference.');
                  }
                }}
              />
            </SettingRow>
            <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />
            <SettingRow
              label="Product Update Emails"
              description="Allow product update and launch emails."
            >
              <input
                type="checkbox"
                checked={marketingConsent}
                disabled={isConsentSaving}
                onChange={async (event) => {
                  const next = event.target.checked;
                  const previous = marketingConsent;
                  setMarketingConsent(next);
                  try {
                    await persistConsents({ marketingOptIn: next });
                  } catch (error) {
                    setMarketingConsent(previous);
                    toast('error', error instanceof Error ? error.message : 'Failed to update marketing preference.');
                  }
                }}
              />
            </SettingRow>
            {compliance.error && (
              <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
                {compliance.error}
              </p>
            )}
          </>
        )}
      </SectionCard>

      {/* Data Management */}
      <SectionCard
        icon={Shield}
        title="Data Management"
        delay={160}
        iconColor="#ef4444"
        titleColor="#ef4444"
        borderColor="rgba(239, 68, 68, 0.15)"
        compact
      >
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Export your data or clear everything. Clearing is irreversible.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowClearAllConfirm(true)}
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

      {/* Danger Zone */}
      <SectionCard
        icon={AlertTriangle}
        title="Danger Zone"
        delay={200}
        iconColor="#ef4444"
        titleColor="#ef4444"
        borderColor="rgba(239, 68, 68, 0.25)"
        compact
      >
        {hasActivePaidPlan ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            You must cancel your subscription before deleting your account.
            Go to the <strong>Billing</strong> tab and use &quot;Manage Subscription&quot; to cancel first.
          </p>
        ) : (
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
        )}
        <button
          onClick={() => setShowDeleteAccount(true)}
          disabled={hasActivePaidPlan}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          style={{
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            backgroundColor: 'transparent',
          }}
        >
          <Trash2 size={13} />
          Delete Account
        </button>
      </SectionCard>

      <ConfirmDialog
        open={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        title="Delete ALL pitch runs and reset achievements?"
        description="This cannot be undone."
        confirmLabel="Delete all"
        variant="danger"
        isConfirming={isClearing}
        onConfirm={handleClearAll}
      />

      {user?.email && (
        <DeleteAccountDialog
          open={showDeleteAccount}
          onClose={() => setShowDeleteAccount(false)}
          userEmail={user.email}
          onConfirm={async (email, password) => {
            const res = await fetch('/api/account', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Failed to delete account.');
            }
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = '/';
          }}
        />
      )}
    </div>
  );
}
