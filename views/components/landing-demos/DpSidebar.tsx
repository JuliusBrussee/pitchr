'use client';

import {
  LayoutDashboard,
  Radio,
  Clock,
  TrendingUp,
  Play,
} from 'lucide-react';
import { PitchrLogo } from '@/views/components/PitchrLogo';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'session', label: 'Session', icon: Radio },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
];

export function DpSidebar({ active }: { active: string }) {
  return (
    <div className="dp-sidebar">
      <div className="dp-sidebar-logo">
        <PitchrLogo size={11} />
        <span>Pitchr</span>
      </div>
      <nav className="dp-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`dp-sidebar-item${item.id === active ? ' dp-sidebar-item--active' : ''}`}
            >
              <Icon size={13} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <div className="dp-sidebar-cta">
        <Play size={11} fill="currentColor" />
        Start Session
      </div>
    </div>
  );
}
