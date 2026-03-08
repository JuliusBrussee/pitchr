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
  Globe,
} from 'lucide-react';
import { useTheme, type ThemePreference } from '@/views/components/ThemeProvider';
import { useLocaleContext } from '@/views/components/LocaleProvider';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings } from '@/hooks/useSettings';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTutorial } from '@/hooks/useTutorial';
import { useCompliance } from '@/hooks/useCompliance';
import { useToast } from '@/views/components/Toast';
import { useRouter } from 'next/navigation';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { SectionCard } from './SectionCard';
import { SettingRow } from './SettingRow';
import { SUPPORTED_LOCALES, LOCALE_CONFIGS } from '@/types/locale';
import type { SupportedLocale } from '@/types/locale';
import { t as interp } from '@/lib/locale/interpolate';

export function GeneralTab() {
  const router = useRouter();
  const { preference, setTheme } = useTheme();
  const { locale, isAutoDetect, setLocale, setAutoDetect } = useLocaleContext();
  const { t } = useTranslation();
  const { settings, adjustTimer } = useSettings();
  const onboarding = useOnboarding();
  const { resetTours } = useTutorial();
  const compliance = useCompliance();
  const { toast } = useToast();

  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isConsentSaving, setIsConsentSaving] = useState(false);

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
      throw new Error(error instanceof Error ? error.message : t.settings.privacy.analyticsError);
    } finally {
      setIsConsentSaving(false);
    }
  }

  const timerMin = Math.floor(settings.timerDuration / 60);
  const timerSec = settings.timerDuration % 60;
  const formattedTimer = `${timerMin}:${String(timerSec).padStart(2, '0')}`;

  const THEME_OPTIONS: { key: ThemePreference; label: string; icon: React.ReactNode }[] = [
    { key: 'system', label: t.settings.appearance.system, icon: <Monitor size={12} /> },
    { key: 'light', label: t.settings.appearance.light, icon: <Sun size={12} /> },
    { key: 'dark', label: t.settings.appearance.dark, icon: <Moon size={12} /> },
  ];

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
      toast('error', t.settings.data.exportFailed);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(t.settings.data.deleteConfirm)) return;
    try {
      const payload = await fetchEdge('pitch-run', {
        params: { includePending: 'true', allProjects: 'true' },
      }).then((r) => r.json());
      const allRuns = Array.isArray(payload?.runs) ? payload.runs : [];
      await Promise.all(allRuns.map((r: { id: string }) => fetchEdge('pitch-run-detail', { method: 'DELETE', params: { runId: r.id } })));
      toast('success', t.settings.data.deleteSuccess);
    } catch {
      toast('error', t.settings.data.deleteFailed);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Appearance */}
      <SectionCard icon={Palette} title={t.settings.appearance.title} delay={0} compact>
        <SettingRow label={t.settings.appearance.theme} description={t.settings.appearance.themeDescription}>
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

      {/* Language */}
      <SectionCard icon={Globe} title={t.settings.language.title} delay={20} iconColor="#8b5cf6" compact>
        <SettingRow label={t.settings.language.language} description={t.settings.language.description}>
          <select
            value={locale}
            disabled={isAutoDetect}
            onChange={(e) => setLocale(e.target.value as SupportedLocale)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              color: isAutoDetect ? 'var(--text-muted)' : 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              opacity: isAutoDetect ? 0.6 : 1,
              cursor: isAutoDetect ? 'not-allowed' : 'pointer',
            }}
          >
            {SUPPORTED_LOCALES.map((code) => (
              <option key={code} value={code}>
                {LOCALE_CONFIGS[code].label} ({LOCALE_CONFIGS[code].englishLabel})
              </option>
            ))}
          </select>
        </SettingRow>
        <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />
        <SettingRow
          label={t.settings.language.autoDetect}
          description={t.settings.language.autoDetectDescription}
        >
          <input
            type="checkbox"
            checked={isAutoDetect}
            onChange={(e) => setAutoDetect(e.target.checked)}
          />
        </SettingRow>
        {isAutoDetect && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {interp(t.settings.language.detected, { language: LOCALE_CONFIGS[locale].label })}
          </p>
        )}
      </SectionCard>

      {/* Session Defaults */}
      <SectionCard icon={Sliders} title={t.settings.session.title} delay={40} compact>
        <SettingRow label={t.settings.session.timerLabel} description={t.settings.session.timerDescription}>
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
          {t.settings.session.projectNote}
        </p>
      </SectionCard>

      {/* Onboarding & Tips */}
      <SectionCard icon={RotateCcw} title={t.settings.onboarding.title} delay={80} iconColor="#3b82f6" compact>
        <SettingRow label={t.settings.onboarding.replay} description={t.settings.onboarding.replayDescription}>
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
            {t.settings.onboarding.replayButton}
          </button>
        </SettingRow>
        <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />
        <SettingRow label={t.settings.onboarding.resetTips} description={t.settings.onboarding.resetTipsDescription}>
          <button
            onClick={() => {
              resetTours();
              toast('success', t.settings.onboarding.resetTipsSuccess);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              backgroundColor: 'transparent',
            }}
          >
            <MessageCircle size={13} />
            {t.settings.onboarding.resetTipsButton}
          </button>
        </SettingRow>
      </SectionCard>

      {/* Privacy */}
      <SectionCard icon={Shield} title={t.settings.privacy.title} delay={120} iconColor="#16a34a" compact>
        {compliance.isLoading ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t.settings.privacy.loadingPrivacy}
          </p>
        ) : (
          <>
            <SettingRow
              label={t.settings.privacy.analytics}
              description={t.settings.privacy.analyticsDescription}
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
                    toast('error', error instanceof Error ? error.message : t.settings.privacy.analyticsError);
                  }
                }}
              />
            </SettingRow>
            <div className="h-px my-1" style={{ backgroundColor: 'var(--border-color)' }} />
            <SettingRow
              label={t.settings.privacy.marketing}
              description={t.settings.privacy.marketingDescription}
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
                    toast('error', error instanceof Error ? error.message : t.settings.privacy.marketingError);
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
        title={t.settings.data.title}
        delay={160}
        iconColor="#ef4444"
        titleColor="#ef4444"
        borderColor="rgba(239, 68, 68, 0.15)"
        compact
      >
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          {t.settings.data.description}
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
            {t.settings.data.deleteAll}
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
            {t.settings.data.exportData}
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
