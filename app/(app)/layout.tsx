'use client';

import { AppSidebar } from '@/views/components/AppSidebar';
import { SidebarProvider, useSidebar } from '@/views/components/SidebarContext';

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const { onStartSession, isSessionActive } = useSidebar();

  return (
    <div className="flex h-screen p-4 gap-4">
      <AppSidebar
        onStartSession={onStartSession}
        isSessionActive={isSessionActive}
      />
      {children}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </SidebarProvider>
  );
}
