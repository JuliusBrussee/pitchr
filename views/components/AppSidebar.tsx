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
  LogOut,
  Play,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/views/components/ThemeProvider';
import { useAuth } from '@/views/components/AuthProvider';
import { StartSessionButton } from '@/views/components/StartSessionButton';

interface AppSidebarProps {
  onStartSession?: () => void;
  isSessionActive?: boolean;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'session', label: 'Live Session', icon: Radio, href: '/session' },
  { id: 'history', label: 'History', icon: Clock, href: '/history' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { id: 'progress', label: 'Progress', icon: TrendingUp, href: '/progress' },
];

const TOOL_ITEMS = [
  { id: 'deck', label: 'Deck Manager', icon: FolderOpen, href: '/deck' },
];

export function AppSidebar({ onStartSession, isSessionActive = false }: AppSidebarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const pathname = usePathname();

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
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Pitchr
        </span>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
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
          Tools
        </span>
        {TOOL_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
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
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}

      {/* Legal links */}
      <div className="flex items-center gap-3 px-3 mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <Link href="/terms" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>
          Terms
        </Link>
        <span>·</span>
        <Link href="/privacy" className="no-underline hover:underline" style={{ color: 'var(--text-muted)' }}>
          Privacy
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
            Start Session
          </Link>
        </div>
      )}
    </aside>
  );
}
