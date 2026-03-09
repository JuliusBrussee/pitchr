'use client';

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
import { PitchrLogo } from '@/views/components/PitchrLogo';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'session', label: 'Session', icon: Radio },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'arena', label: 'Arena', icon: Swords },
];

const TOOL_ITEMS = [
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface DemoSidebarProps {
  activeNav: 'dashboard' | 'session' | 'results';
}

export function DemoSidebar({ activeNav }: DemoSidebarProps) {
  const { isDark } = useTheme();

  const activeId = activeNav === 'results' ? 'dashboard' : activeNav;

  return (
    <div className="demo-sidebar">
      {/* Logo + Theme icon */}
      <div className="demo-sidebar__logo">
        <div className="demo-sidebar__logo-text">
          <PitchrLogo size={14} />
          <span>Pitchr</span>
        </div>
        <span style={{ color: 'var(--text-secondary)' }}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </span>
      </div>

      {/* Project selector */}
      <div className="demo-sidebar__project">
        <div className="demo-sidebar__project-label">Current project</div>
        <div className="demo-sidebar__project-select">Series A Pitch</div>
      </div>

      {/* Nav items */}
      <nav className="demo-sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <div
              key={item.id}
              className={`demo-sidebar__nav-item${isActive ? ' demo-sidebar__nav-item--active' : ''}`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="demo-sidebar__divider" />

      {/* Tools */}
      <div className="demo-sidebar__tools-label">Tools</div>
      <nav className="demo-sidebar__nav">
        {TOOL_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="demo-sidebar__nav-item">
              <Icon size={17} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="demo-sidebar__spacer" />

      {/* User */}
      <div className="demo-sidebar__user">
        <span className="demo-sidebar__user-email">alex@startup.com</span>
        <span style={{ color: 'var(--text-muted)' }}>
          <LogOut size={13} />
        </span>
      </div>

      {/* Legal */}
      <div className="demo-sidebar__legal">
        <span>Terms</span>
        <span>·</span>
        <span>Privacy</span>
      </div>

      {/* Start Session CTA */}
      <div className="demo-sidebar__cta-wrap">
        <div className="demo-sidebar__cta-glow" />
        <div className="demo-sidebar__cta">
          <Play size={14} fill="currentColor" />
          Start Session
        </div>
      </div>
    </div>
  );
}
