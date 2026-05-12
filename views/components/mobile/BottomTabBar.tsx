// views/components/mobile/BottomTabBar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Video, Clock, FolderOpen, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useSessionStateContext } from '@/contexts/SessionStateContext';

interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}

const PRIMARY_TABS: TabItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/session', label: 'Session', icon: Video, primary: true },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
];

const MORE_ROUTES = ['/settings', '/insights', '/progress', '/arena', '/qa', '/upload'];

interface BottomTabBarProps {
  onMoreTap: () => void;
}

export function BottomTabBar({ onMoreTap }: BottomTabBarProps) {
  const pathname = usePathname() ?? '';
  const { isSessionActive } = useSessionStateContext();

  // Hide during active recording session
  if (isSessionActive) return null;

  const isMoreActive = MORE_ROUTES.some(r => pathname.startsWith(r));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {PRIMARY_TABS.map(({ href, label, icon: Icon, primary }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
              style={{ minWidth: 0 }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: primary ? 36 : 28,
                  height: primary ? 36 : 28,
                  backgroundColor: primary && isActive ? 'rgba(255, 89, 65, 0.12)' : 'transparent',
                  border: primary ? '1.5px solid' : 'none',
                  borderColor: primary
                    ? isActive ? 'rgba(255, 89, 65, 0.4)' : 'var(--border-color)'
                    : 'transparent',
                }}
              >
                <Icon
                  size={primary ? 18 : 20}
                  style={{
                    color: isActive ? 'var(--accent, #ff5941)' : 'var(--text-muted)',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-medium leading-tight"
                style={{
                  color: isActive ? 'var(--accent, #ff5941)' : 'var(--text-muted)',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
        {/* More tab */}
        <button
          onClick={onMoreTap}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
          style={{ minWidth: 0 }}
        >
          <MoreHorizontal
            size={20}
            style={{
              color: isMoreActive ? 'var(--accent, #ff5941)' : 'var(--text-muted)',
            }}
          />
          <span
            className="text-[10px] font-medium leading-tight"
            style={{
              color: isMoreActive ? 'var(--accent, #ff5941)' : 'var(--text-muted)',
            }}
          >
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
