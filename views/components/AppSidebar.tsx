'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Radio,
  Clock,
  TrendingUp,
  FolderOpen,
  Settings,
  LogOut,
  Play,
  Sun,
  Moon,
  Diamond,
  Sparkles,
} from 'lucide-react';
import { isEarlyAdopterPeriod } from '@/config/early-adopter';
import { useBilling } from '@/hooks/useBilling';
import { useTheme } from '@/views/components/ThemeProvider';
import { useAuth } from '@/views/components/AuthProvider';
import { useProject } from '@/views/components/ProjectProvider';
import { ProjectSelect } from '@/views/components/ProjectSelect';
import { StartSessionButton } from '@/views/components/StartSessionButton';
import { useSidebar } from '@/views/components/SidebarContext';
import { PitchrLogo } from '@/views/components/PitchrLogo';

interface AppSidebarProps {
  onStartSession?: () => void;
  isSessionActive?: boolean;
  isProjectSwitchLocked?: boolean;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'session', label: 'Session', icon: Radio, href: '/session' },
  { id: 'history', label: 'History', icon: Clock, href: '/history' },
  { id: 'insights', label: 'Insights', icon: TrendingUp, href: '/insights' },
];

const TOOL_ITEMS = [
  { id: 'projects', label: 'Projects', icon: FolderOpen, href: '/projects' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function AppSidebar({
  onStartSession,
  isSessionActive = false,
  isProjectSwitchLocked = false,
}: AppSidebarProps) {
  const { isDark, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { projects, activeProjectId, setActiveProject, isLoading: isProjectLoading } = useProject();
  const pathname = usePathname() ?? '';
  const { closeSidebar } = useSidebar();
  const { subscription, credits } = useBilling();

  const planLabel = subscription?.planId === 'pro'
    ? 'Pro Plan'
    : subscription?.planId === 'day_pass'
      ? 'Day Pass'
      : 'Free Plan';

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  const NavLink = ({ item, isActive }: { item: { id: string; label: string; icon: React.ComponentType<{ size: number }>; href: string }; isActive: boolean }) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={closeSidebar}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 no-underline"
        style={{
          backgroundColor: isActive
            ? isDark ? 'rgba(255,89,65,0.1)' : 'rgba(255,89,65,0.06)'
            : 'transparent',
          border: isActive
            ? isDark ? '1px solid rgba(255,89,65,0.12)' : '1px solid rgba(255,89,65,0.1)'
            : '1px solid transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200"
          style={{
            backgroundColor: isActive
              ? isDark ? 'rgba(255,89,65,0.15)' : 'rgba(255,89,65,0.1)'
              : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            color: isActive ? '#ff5941' : undefined,
          }}
        >
          <Icon size={16} />
        </div>
        <span className="flex-1">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside
      className="flex flex-col h-full w-60 rounded-2xl p-4 border flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, rgba(255,89,65,0.04) 0%, transparent 40%), var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Logo + Theme Toggle */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div
            className="rounded-lg overflow-hidden"
            style={{ boxShadow: '0 0 20px rgba(255,89,65,0.3)' }}
          >
            <PitchrLogo size={14} />
          </div>
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
          Current project
        </label>
        <ProjectSelect
          id="project-switcher"
          compact
          ariaLabel="Current project"
          disabled={isProjectLoading || projects.length === 0 || isSessionActive || isProjectSwitchLocked}
          value={activeProjectId ?? projects[0]?.id ?? ''}
          placeholder={isProjectLoading ? 'Loading projects...' : 'No projects'}
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
            Finish or discard this session to switch projects.
          </p>
        ) : null}
      </div>

      <nav className="flex flex-col gap-[3px]">
        {NAV_ITEMS.map(item => {
          const isActive = item.id === 'session'
            ? pathname.startsWith('/session')
            : pathname === item.href;
          return <NavLink key={item.id} item={item} isActive={isActive} />;
        })}
      </nav>

      {/* Divider */}
      <div className="my-4 h-px" style={{ backgroundColor: 'var(--border-color)' }} />

      {/* Tools */}
      <nav className="flex flex-col gap-[3px]">
        <span className="px-3 text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
          Tools
        </span>
        {TOOL_ITEMS.map(item => {
          const isActive = pathname === item.href;
          return <NavLink key={item.id} item={item} isActive={isActive} />;
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User section */}
      {user && (
        <div className="mb-2">
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ backgroundColor: 'var(--bg-surface-hover)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #ff5941, #ffaa33)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="block text-[11px] truncate font-medium"
                style={{ color: 'var(--text-primary)' }}
                title={user.email}
              >
                {user.email}
              </span>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {planLabel}
                {isEarlyAdopterPeriod() && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1 py-px rounded text-[8px] font-semibold"
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.12)',
                      color: '#f59e0b',
                    }}
                  >
                    <Sparkles size={7} />
                    Early Adopter
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={signOut}
              className="p-1 rounded transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>

          {/* Credits bar */}
          {credits && (
            <Link
              href="/settings"
              onClick={closeSidebar}
              className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg no-underline transition-opacity hover:opacity-80"
              style={{
                backgroundColor: credits.totalAvailable > 0
                  ? 'rgba(255,170,51,0.06)'
                  : 'rgba(239,68,68,0.06)',
                border: credits.totalAvailable > 0
                  ? isDark ? '1px solid rgba(255,170,51,0.1)' : '1px solid rgba(255,170,51,0.12)'
                  : isDark ? '1px solid rgba(239,68,68,0.12)' : '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <Diamond
                size={12}
                style={{
                  color: credits.totalAvailable > 0 ? '#ffaa33' : '#ef4444',
                  opacity: 0.7,
                }}
              />
              <span
                className="flex-1"
                style={{
                  color: credits.totalAvailable > 0 ? '#ffaa33' : '#ef4444',
                  opacity: 0.8,
                  fontSize: '10px',
                  fontWeight: 500,
                }}
              >
                {credits.totalAvailable > 0
                  ? `${credits.totalAvailable} remaining`
                  : '0 credits — Upgrade'}
              </span>
            </Link>
          )}
        </div>
      )}

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
            Start Session
          </Link>
        </div>
      )}
    </aside>
  );
}
