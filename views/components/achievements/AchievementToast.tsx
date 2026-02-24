'use client';

import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import type { NewUnlock } from '@/hooks/useAchievements';

interface AchievementToastProps {
  unlocks: NewUnlock[];
  onDismiss: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  sessions: '#3b82f6',
  scores: '#22c55e',
  streaks: '#f97316',
  mastery: '#a78bfa',
  improvement: '#06b6d4',
  special: '#eab308',
};

function getIcon(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComp = (Icons as any)[name];
  return IconComp ?? Icons.Award;
}

function Toast({ unlock, onDismiss }: { unlock: NewUnlock; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 50);

    // Auto-dismiss after 4s
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const color = CATEGORY_COLORS[unlock.def.category] ?? '#6b7280';
  const Icon = getIcon(unlock.def.icon);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: `${color}33`,
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        maxWidth: 320,
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}1a` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
          Achievement Unlocked
        </div>
        <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {unlock.def.name}
        </div>
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {unlock.def.description}
        </div>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="p-1 rounded-md hover:opacity-80 flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      >
        <Icons.X size={14} />
      </button>
    </div>
  );
}

export function AchievementToastContainer({ unlocks, onDismiss }: AchievementToastProps) {
  if (unlocks.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {unlocks.map((unlock) => (
        <Toast
          key={unlock.id}
          unlock={unlock}
          onDismiss={() => onDismiss(unlock.id)}
        />
      ))}
    </div>
  );
}
