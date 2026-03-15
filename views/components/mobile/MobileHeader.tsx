// views/components/mobile/MobileHeader.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useProject } from '@/views/components/ProjectProvider';
import { ChevronDown } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/session': 'Session',
  '/history': 'History',
  '/projects': 'Projects',
  '/settings': 'Settings',
  '/insights': 'Insights',
  '/progress': 'Progress',
  '/arena': 'Arena',
  '/qa': 'Q&A',
  '/upload': 'Upload',
};

interface MobileHeaderProps {
  onProjectTap?: () => void;
}

export function MobileHeader({ onProjectTap }: MobileHeaderProps) {
  const pathname = usePathname() ?? '';
  const { activeProject } = useProject();

  // Find matching title (handle dynamic segments)
  const title = Object.entries(PAGE_TITLES).find(([route]) =>
    pathname.startsWith(route)
  )?.[1] || '';

  // Hide on results pages (they have their own header with back button)
  if (pathname.startsWith('/results/') || pathname.startsWith('/review/')) return null;

  return (
    <header
      className="flex items-center justify-between px-4 flex-shrink-0"
      style={{
        height: 48,
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
      }}
    >
      <h1
        className="text-base font-semibold truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>
      {activeProject && onProjectTap && (
        <button
          onClick={onProjectTap}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium truncate max-w-[140px]"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <span className="truncate">{activeProject.name}</span>
          <ChevronDown size={12} className="flex-shrink-0" />
        </button>
      )}
    </header>
  );
}
