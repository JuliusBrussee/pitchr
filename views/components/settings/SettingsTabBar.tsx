'use client';

import { Sliders, CreditCard, Award } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export type SettingsTab = 'general' | 'billing' | 'rewards';

export function SettingsTabBar({
  active,
  onChange,
}: {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}) {
  const { t } = useTranslation();

  const TABS: { key: SettingsTab; label: string; icon: typeof Sliders }[] = [
    { key: 'general', label: t.settings.tabs.general, icon: Sliders },
    { key: 'billing', label: t.settings.tabs.billing, icon: CreditCard },
    { key: 'rewards', label: t.settings.tabs.rewards, icon: Award },
  ];

  return (
    <div
      className="inline-flex items-center rounded-full p-1 gap-0.5 animate-fade-in-up"
      style={{
        backgroundColor: 'var(--bg-surface-hover)',
        border: '1px solid var(--border-color)',
        animationDelay: '40ms',
        animationFillMode: 'backwards',
      }}
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              backgroundColor: isActive ? '#ff5941' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-muted)',
              boxShadow: isActive ? '0 2px 8px rgba(255, 89, 65, 0.3)' : 'none',
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
