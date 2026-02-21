'use client';

import {
  LayoutDashboard,
  Radio,
  Clock,
  BarChart3,
  FolderOpen,
  Settings,
  Play,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/views/components/ThemeProvider';

interface AppSidebarProps {
  activePage: string;
  onStartSession: () => void;
  isSessionActive: boolean;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'session', label: 'Live Session', icon: Radio },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const TOOL_ITEMS = [
  { id: 'deck', label: 'Deck Manager', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppSidebar({ activePage, onStartSession, isSessionActive }: AppSidebarProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <aside
      className="flex flex-col h-full w-60 rounded-2xl p-4 border"
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
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backdropFilter: isActive ? `blur(var(--blur-strength))` : undefined,
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
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
          return (
            <button
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Start Session CTA */}
      <button
        onClick={onStartSession}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 ${
          isSessionActive
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 animate-pulse-glow'
        }`}
        style={{
          boxShadow: isSessionActive
            ? '0 0 20px rgba(239,68,68,0.3)'
            : undefined,
        }}
      >
        <Play size={16} fill="currentColor" />
        {isSessionActive ? 'End Session' : 'Start Session'}
      </button>
    </aside>
  );
}
