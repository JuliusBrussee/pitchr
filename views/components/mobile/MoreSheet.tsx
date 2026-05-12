// views/components/mobile/MoreSheet.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, TrendingUp, Target, Swords, MessageCircleQuestion, Upload, Sun, Moon, X
} from 'lucide-react';

const MORE_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/insights', label: 'Insights', icon: TrendingUp },
  { href: '/progress', label: 'Progress', icon: Target },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/qa', label: 'Q&A', icon: MessageCircleQuestion },
  { href: '/upload', label: 'Upload', icon: Upload },
] as const;

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreSheet({ isOpen, onClose }: MoreSheetProps) {
  const router = useRouter();

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleNav(href: string) {
    onClose();
    router.push(href);
  }

  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('pitchr-theme', isDark ? 'dark' : 'light');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderColor: 'var(--border-color)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          maxHeight: '70vh',
          animation: 'mobileSheetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="rounded-full"
            style={{
              width: 32,
              height: 4,
              backgroundColor: 'var(--text-muted)',
              opacity: 0.4,
            }}
          />
        </div>

        {/* Nav items */}
        <div className="px-4 pb-4 flex flex-col gap-1">
          {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              onClick={() => handleNav(href)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left"
              style={{
                color: 'var(--text-primary)',
                backgroundColor: 'transparent',
              }}
            >
              <Icon size={20} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left border-t mt-2 pt-4"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <Sun size={20} className="dark:hidden" style={{ color: 'var(--text-secondary)' }} />
            <Moon size={20} className="hidden dark:block" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-sm font-medium">Toggle Theme</span>
          </button>
        </div>
      </div>
    </>
  );
}
