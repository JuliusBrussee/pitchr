'use client';

import { useState } from 'react';
import { BottomTabBar } from './BottomTabBar';
import { MobileHeader } from './MobileHeader';
import { MoreSheet } from './MoreSheet';
import { MobileScrollProvider } from './MobileScrollContext';

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <MobileScrollProvider>
      <div className="flex flex-col h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <MobileHeader />
        <main
          className="flex-1 overflow-y-auto min-h-0"
          style={{
            paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {children}
        </main>
        <BottomTabBar onMoreTap={() => setIsMoreOpen(true)} />
        <MoreSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
      </div>
    </MobileScrollProvider>
  );
}
