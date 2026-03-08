'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Radio,
  Clock,
  BarChart3,
  TrendingUp,
  FolderOpen,
  Settings,
  LogOut,
  Play,
  Sun,
  Moon,
  Swords,
} from 'lucide-react';
import { useTheme } from '@/views/components/ThemeProvider';
import { useAuth } from '@/views/components/AuthProvider';
import { useProject } from '@/views/components/ProjectProvider';
import { ProjectSelect } from '@/views/components/ProjectSelect';
import { StartSessionButton } from '@/views/components/StartSessionButton';
import { useSidebar } from '@/views/components/SidebarContext';
import { PitchrLogo } from '@/views/components/PitchrLogo';
import { useTranslation } from '@/hooks/useTranslation';

interface AppSidebarProps {
  onStartSession?: () => void;
  isSessionActive?: boolean;
  isProjectSwitchLocked?: boolean;
}

const NAV_ICON_MAP = {
  dashboard: LayoutDashboard,
  session: Radio,
  history: Clock,
  analytics: BarChart3,
  progress: TrendingUp,
  arena: Swords,
} as const;

const TOOL_ICON_MAP = {
  projects: FolderOpen,
  settings: Settings,
} as const;

export function AppSidebar({
  onStartSession,
  isSessionActive = false,
  isProjectSwitchLocked = false,
}: AppSidebarProps) {
  const { isDark, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { projects, activeProjectId, setActiveProject, isLoading: isProjectLoading } = useProject();
  const pathname = usePathname();
  const { closeSidebar } = useSidebar();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { id: 'dashboard' as const, label: t.nav.dashboard, href: '/dashboard' },
    { id: 'session' as const, label: t.nav.session, href: '/session' },
    { id: 'history' as const, label: t.nav.history, href: '/history' },
    { id: 'analytics' as const, label: t.nav.analytics, href: '/analytics' },
    { id: 'progress' as const, label: t.nav.progress, href: '/progress' },
    { id: 'arena' as const, label: t.nav.arena, href: '/arena' },
  ];

  const TOOL_ITEMS = [
    { id: 'projects' as const, label: t.nav.projects, href: '/projects' },
    { id: 'settings' as const, label: t.nav.settings, href: '/settings' },
  ];

  return (
    <aside
      className="flex flex-col h-full w-60 rounded-2xl p-4 border flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Logo + Theme Toggle */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-1.5">
          <PitchrLogo size={14} />
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Pitchr
          </span>
        </div>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="px-2 mb-3">
        <label
          htmlFor="project-switcher"
          className="text-[11px] font-medium block mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {t.nav.currentProject}
        </label>
        <ProjectSelect
          id="project-switcher"
          compact
          ariaLabel={t.nav.currentProject}
          disabled={isProjectLoading || projects.length === 0 || isSessionActive || isProjectSwitchLocked}
          value={activeProjectId ?? projects[0]?.id ?? ''}
          placeholder={isProjectLoading ? t.nav.loadingProjects : t.nav.noProjects}
          options={projects.map((project) => ({
            value: project.id,
            label: project.name,
          }))}
          onChange={(nextProjectId) => {
            if (isSessionActive || isProjectSwitchLocked || !nextProjectId || nextProjectId === activeProjectId) return;
            void setActiveProject(nextProjectId).catch(() => {});
          }}
        />
        {isSessionActive || isProjectSwitchLocked ? (
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {t.nav.switchProjectLocked}
          </p>
        ) : null}
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const Icon = NAV_ICON_MAP[item.id];
          const isActive = item.id === 'session'
            ? pathname.startsWith('/session')
            : item.id === 'arena'
              ? pathname.startsWith('/arena')
              : pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={closeSidebar}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline"
              style={{
                backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backdropFilter: isActive ? `blur(var(--blur-strength))` : undefined,
              }}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="my-4 h-px" style={{ backgroundColor: 'var(--border-color)' }} />

      {/* Tools */}
      <nav className="flex flex-col gap-1">
        <span className="px-3 text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
          {t.nav.tools}
        </span>
        {TOOL_ITEMS.map(item => {
          const Icon = TOOL_ICON_MAP[item.id];
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={closeSidebar}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline"
              style={{
                backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User section */}
      {user && (
        <div
          className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg"
          style={{ backgroundColor: 'var(--bg-surface-hover)' }}
        >
          <span
            className="flex-1 text-xs truncate"
            style={{ color: 'var(--text-secondary)' }}
            title={user.email}
          >
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="p-1 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            aria-label={t.nav.signOut}
          >
            <LogOut size={14} />
          </button>
        </div>
      )}

      {/* Legal links */}
      <div className="flex items-center gap-3 px-3 mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <Link href="/terms" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>
          {t.nav.terms}
        </Link>
        <span>·</span>
        <Link href="/privacy" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>
          {t.nav.privacy}
        </Link>
      </div>

      {/* Start Session CTA */}
      {onStartSession ? (
        <StartSessionButton onClick={onStartSession} isSessionActive={isSessionActive} />
      ) : (
        <div className="session-start-wrap">
          <div className="session-start-glow" />
          <Link href="/session" className="session-start-btn no-underline">
            <span className="session-start-btn__icon">
              <Play size={15} fill="currentColor" />
            </span>
            {t.nav.startSession}
          </Link>
        </div>
      )}
    </aside>
  );
}
