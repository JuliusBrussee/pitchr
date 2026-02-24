'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Camera,
  Mic,
  Palette,
  Shield,
  Trash2,
  Download,
  ChevronRight,
  Check,
  Sliders,
  Brain,
  Plus,
  Minus,
} from 'lucide-react';
import { fetchEdge } from '@/lib/supabase/fetch-edge';

/* ——— Types ——— */
type FeedbackIntensity = 'gentle' | 'balanced' | 'aggressive';
type ThemeChoice = 'system' | 'light' | 'dark';

interface FocusArea {
  id: string;
  label: string;
}

const FOCUS_AREAS: FocusArea[] = [
  { id: 'clarity', label: 'Clarity' },
  { id: 'pacing', label: 'Pacing' },
  { id: 'filler', label: 'Filler Words' },
  { id: 'body', label: 'Body Language' },
  { id: 'eye', label: 'Eye Contact' },
  { id: 'structure', label: 'Structure' },
];

/* ——— Reusable: Toggle Switch ——— */
function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0"
      style={{
        backgroundColor: enabled
          ? 'rgba(147, 51, 234, 0.7)'
          : 'var(--bg-surface-hover)',
        border: `1px solid ${enabled ? 'rgba(147, 51, 234, 0.4)' : 'var(--border-color)'}`,
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full transition-transform duration-200"
        style={{
          transform: enabled ? 'translateX(22px)' : 'translateX(4px)',
          backgroundColor: enabled ? '#fff' : 'var(--text-muted)',
        }}
      />
    </button>
  );
}

/* ——— Reusable: Section Card ——— */
function SectionCard({
  icon: Icon,
  title,
  delay,
  children,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border p-6 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
        animationDelay: `${delay}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <Icon size={16} />
        </div>
        <h2
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-primary)' }}
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
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </p>
        {description && (
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
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
  // AI Feedback
  const [feedbackIntensity, setFeedbackIntensity] =
    useState<FeedbackIntensity>('balanced');
  const [realtimeCoaching, setRealtimeCoaching] = useState(true);
  const [postSessionReport, setPostSessionReport] = useState(true);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([
    'clarity',
    'pacing',
    'filler',
  ]);

  // Session Defaults
  const [autoRecord, setAutoRecord] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Appearance
  const [theme, setTheme] = useState<ThemeChoice>('system');
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    fetchEdge('settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        if (data.feedback_intensity) setFeedbackIntensity(data.feedback_intensity);
        if (typeof data.realtime_coaching === 'boolean') setRealtimeCoaching(data.realtime_coaching);
        if (typeof data.post_session_report === 'boolean') setPostSessionReport(data.post_session_report);
        if (Array.isArray(data.focus_areas)) setSelectedFocusAreas(data.focus_areas);
        if (typeof data.auto_record === 'boolean') setAutoRecord(data.auto_record);
        if (typeof data.timer_seconds === 'number') {
          setTimerMinutes(Math.floor(data.timer_seconds / 60));
          setTimerSeconds(data.timer_seconds % 60);
        }
        if (data.theme) setTheme(data.theme);
        if (typeof data.compact_mode === 'boolean') setCompactMode(data.compact_mode);
      })
      .catch(() => {});
  }, []);

  function persistSetting(updates: Record<string, unknown>) {
    fetchEdge('settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  }

  const toggleFocusArea = (id: string) => {
    setSelectedFocusAreas((prev) => {
      const next = prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id];
      persistSetting({ focus_areas: next });
      return next;
    });
  };

  const adjustTimer = (delta: number) => {
    const totalSeconds = timerMinutes * 60 + timerSeconds + delta;
    if (totalSeconds < 60 || totalSeconds > 30 * 60) return;
    setTimerMinutes(Math.floor(totalSeconds / 60));
    setTimerSeconds(totalSeconds % 60);
    persistSetting({ timer_seconds: totalSeconds });
  };

  const formattedTimer = `${timerMinutes}:${String(timerSeconds).padStart(2, '0')}`;

  const intensityOptions: { key: FeedbackIntensity; label: string }[] = [
    { key: 'gentle', label: 'Gentle' },
    { key: 'balanced', label: 'Balanced' },
    { key: 'aggressive', label: 'Aggressive' },
  ];

  const themeOptions: { key: ThemeChoice; label: string }[] = [
    { key: 'system', label: 'System' },
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
  ];

  return (
      <main className="flex-1 overflow-y-auto pr-1">
        <div className="max-w-2xl mx-auto py-8 px-2">
          {/* Header */}
          <div
            className="mb-8 animate-fade-in-up"
            style={{ animationFillMode: 'backwards' }}
          >
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Settings
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Customize your practice experience
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* ——— Profile ——— */}
            <SectionCard icon={User} title="Profile" delay={60}>
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0 text-white font-bold text-lg"
                  style={{
                    background:
                      'linear-gradient(135deg, #1c1210 0%, #2a1a16 100%)',
                  }}
                >
                  JB
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Julius Brussee
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    julius@pitchr.ai
                  </p>
                </div>

                {/* Edit button */}
                <button
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  Edit Profile
                  <ChevronRight size={12} />
                </button>
              </div>
            </SectionCard>

            {/* ——— AI Feedback Preferences ——— */}
            <SectionCard icon={Brain} title="AI Feedback Preferences" delay={120}>
              {/* Feedback Intensity */}
              <SettingRow
                label="Feedback Intensity"
                description="How direct should the AI coaching be"
              >
                <div
                  className="inline-flex rounded-lg overflow-hidden"
                  style={{ border: '1px solid var(--border-color)' }}
                >
                  {intensityOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setFeedbackIntensity(opt.key); persistSetting({ feedback_intensity: opt.key }); }}
                      className="px-3 py-1.5 text-xs font-medium transition-all duration-200"
                      style={{
                        backgroundColor:
                          feedbackIntensity === opt.key
                            ? 'rgba(255, 89, 65, 0.12)'
                            : 'transparent',
                        color:
                          feedbackIntensity === opt.key
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

              {/* Real-time Coaching */}
              <SettingRow
                label="Real-time Coaching"
                description="Get live tips during your session"
              >
                <ToggleSwitch
                  enabled={realtimeCoaching}
                  onToggle={() => setRealtimeCoaching((p) => { persistSetting({ realtime_coaching: !p }); return !p; })}
                />
              </SettingRow>

              <div
                className="h-px my-1"
                style={{ backgroundColor: 'var(--border-color)' }}
              />

              {/* Post-Session Report */}
              <SettingRow
                label="Post-Session Report"
                description="Receive a detailed breakdown after each practice"
              >
                <ToggleSwitch
                  enabled={postSessionReport}
                  onToggle={() => setPostSessionReport((p) => { persistSetting({ post_session_report: !p }); return !p; })}
                />
              </SettingRow>

              <div
                className="h-px my-1"
                style={{ backgroundColor: 'var(--border-color)' }}
              />

              {/* Focus Areas */}
              <div className="pt-3">
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Focus Areas
                </p>
                <p
                  className="text-xs mb-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Select the areas the AI should prioritize
                </p>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_AREAS.map((area) => {
                    const isSelected = selectedFocusAreas.includes(area.id);
                    return (
                      <button
                        key={area.id}
                        onClick={() => toggleFocusArea(area.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(255, 89, 65, 0.12)'
                            : 'var(--bg-surface-hover)',
                          color: isSelected
                            ? '#ff5941'
                            : 'var(--text-secondary)',
                          border: `1px solid ${isSelected ? 'rgba(255, 89, 65, 0.25)' : 'var(--border-color)'}`,
                        }}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                        {area.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            {/* ——— Session Defaults ——— */}
            <SectionCard icon={Sliders} title="Session Defaults" delay={180}>
              {/* Default Camera */}
              <SettingRow label="Default Camera">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
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
                </button>
              </div>
            </div>

            {/* Bottom spacer */}
            <div className="h-8" />
          </div>
        </div>
      </main>
  );
}
