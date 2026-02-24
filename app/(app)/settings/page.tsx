'use client';

import { useEffect, useState } from 'react';
import {
  Award,
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
<<<<<<< HEAD
import { useTheme } from '@/views/components/ThemeProvider';
import { useSettings } from '@/hooks/useSettings';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementGrid } from '@/views/components/achievements';
import type { ProgressRunRecord } from '@/lib/progress';
=======
import { fetchEdge } from '@/lib/supabase/fetch-edge';
>>>>>>> claude/migrate-api-to-edge-functions-e9NmC

/* ——— Types ——— */

type ThemeChoice = 'system' | 'light' | 'dark';

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
  const { isDark, toggleTheme } = useTheme();
  const { settings, adjustTimer, update } = useSettings();
  const achievements = useAchievements();

  // Fetch runs for achievement computation
  const [runs, setRuns] = useState<ProgressRunRecord[]>([]);

  useEffect(() => {
<<<<<<< HEAD
    fetch('/api/pitch/run')
=======
    fetchEdge('settings')
>>>>>>> claude/migrate-api-to-edge-functions-e9NmC
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

<<<<<<< HEAD
  useEffect(() => {
    if (runs.length > 0) achievements.processRuns(runs);
  }, [runs, achievements.processRuns]);
=======
  function persistSetting(updates: Record<string, unknown>) {
    fetchEdge('settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  }
>>>>>>> claude/migrate-api-to-edge-functions-e9NmC

  // Scroll to hash on mount
  useEffect(() => {
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, []);

  // Theme state
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>('system');

  useEffect(() => {
    setThemeChoice(isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleThemeChange = (choice: ThemeChoice) => {
    setThemeChoice(choice);
    if (choice === 'dark' && !isDark) toggleTheme();
    if (choice === 'light' && isDark) toggleTheme();
    if (choice === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark !== isDark) toggleTheme();
    }
  };

  const themeOptions: { key: ThemeChoice; label: string; icon: React.ReactNode }[] = [
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
      const payload = await fetch('/api/pitch/run').then((r) => r.json());
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
      const payload = await fetch('/api/pitch/run?includePending=true').then((r) => r.json());
      const allRuns = Array.isArray(payload?.runs) ? payload.runs : [];
      await Promise.all(allRuns.map((r: { id: string }) => fetch(`/api/pitch/run/${r.id}`, { method: 'DELETE' })));
      achievements.resetAchievements();
      setRuns([]);
      alert('All data cleared.');
    } catch {
      alert('Failed to clear data.');
    }
  };

  return (
    <main className="flex-1 overflow-y-auto pr-1">
      <div className="max-w-2xl mx-auto py-8 px-2">
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
                      backgroundColor: themeChoice === opt.key ? 'rgba(255, 89, 65, 0.12)' : 'transparent',
                      color: themeChoice === opt.key ? '#ff5941' : 'var(--text-muted)',
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
<<<<<<< HEAD
                  <Plus size={12} />
=======
                  <Camera size={12} />
                  FaceTime HD Camera
                  <ChevronRight size={10} style={{ color: 'var(--text-muted)' }} />
                </div>
              </SettingRow>

              <div
                className="h-px my-1"
                style={{ backgroundColor: 'var(--border-color)' }}
              />

              {/* Default Mic */}
              <SettingRow label="Default Mic">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <Mic size={12} />
                  MacBook Pro Microphone
                  <ChevronRight size={10} style={{ color: 'var(--text-muted)' }} />
                </div>
              </SettingRow>

              <div
                className="h-px my-1"
                style={{ backgroundColor: 'var(--border-color)' }}
              />

              {/* Auto-record */}
              <SettingRow
                label="Auto-record"
                description="Automatically record every session"
              >
                <ToggleSwitch
                  enabled={autoRecord}
                  onToggle={() => setAutoRecord((p) => { persistSetting({ auto_record: !p }); return !p; })}
                />
              </SettingRow>

              <div
                className="h-px my-1"
                style={{ backgroundColor: 'var(--border-color)' }}
              />

              {/* Timer Duration */}
              <SettingRow
                label="Timer Duration"
                description="Default practice timer length"
              >
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
            </SectionCard>

            {/* ——— Appearance ——— */}
            <SectionCard icon={Palette} title="Appearance" delay={240}>
              {/* Theme */}
              <SettingRow label="Theme" description="Choose your preferred color mode">
                <div
                  className="inline-flex rounded-lg overflow-hidden"
                  style={{ border: '1px solid var(--border-color)' }}
                >
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setTheme(opt.key); persistSetting({ theme: opt.key }); }}
                      className="px-3 py-1.5 text-xs font-medium transition-all duration-200"
                      style={{
                        backgroundColor:
                          theme === opt.key
                            ? 'rgba(255, 89, 65, 0.12)'
                            : 'transparent',
                        color:
                          theme === opt.key
                            ? '#ff5941'
                            : 'var(--text-muted)',
                        borderRight: '1px solid var(--border-color)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <div
                className="h-px my-1"
                style={{ backgroundColor: 'var(--border-color)' }}
              />

              {/* Compact Mode */}
              <SettingRow
                label="Compact Mode"
                description="Reduce spacing for denser layouts"
              >
                <ToggleSwitch
                  enabled={compactMode}
                  onToggle={() => setCompactMode((p) => { persistSetting({ compact_mode: !p }); return !p; })}
                />
              </SettingRow>
            </SectionCard>

            {/* ——— Danger Zone ——— */}
            <div
              className="rounded-2xl border p-6 animate-fade-in-up"
              style={{
                backgroundColor: 'var(--bg-surface)',
                backdropFilter: 'blur(var(--blur-strength))',
                WebkitBackdropFilter: 'blur(var(--blur-strength))',
                borderColor: 'rgba(239, 68, 68, 0.15)',
                animationDelay: '300ms',
                animationFillMode: 'backwards',
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <Shield size={16} style={{ color: '#ef4444' }} />
                </div>
                <h2
                  className="text-sm font-semibold tracking-wide uppercase"
                  style={{ color: '#ef4444' }}
                >
                  Danger Zone
                </h2>
              </div>

              <p
                className="text-xs mb-4"
                style={{ color: 'var(--text-muted)' }}
              >
                Irreversible actions. Proceed with caution.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!confirm('Delete all pitch runs? This cannot be undone.')) return;
                    const payload = await fetchEdge('pitch-run', { params: { includePending: 'true' } }).then((r) => r.json());
                    const runs = Array.isArray(payload?.runs) ? payload.runs : [];
                    await Promise.all(runs.map((r: { id: string }) => fetchEdge('pitch-run-detail', { method: 'DELETE', params: { runId: r.id } })));
                    alert('All data deleted.');
                  }}
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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                  }}
                >
                  <Download size={13} />
                  Export Data
>>>>>>> claude/migrate-api-to-edge-functions-e9NmC
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
                Clear All Data
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
