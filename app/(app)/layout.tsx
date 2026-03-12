'use client';

import { useEffect, useRef } from 'react';
import { AuthProvider } from '@/views/components/AuthProvider';
import { TutorialProvider } from '@/views/components/TutorialProvider';
import { ToastProvider, useToast } from '@/views/components/Toast';
import { AppSidebar } from '@/views/components/AppSidebar';
import { SidebarProvider, useSidebar } from '@/views/components/SidebarContext';
import { ProjectProvider } from '@/views/components/ProjectProvider';
import { Menu, X } from 'lucide-react';
import { useEarlyAdopter, EarlyAdopterProvider } from '@/hooks/useEarlyAdopter';

function EarlyAdopterClaimer() {
  const { justClaimed } = useEarlyAdopter();
  const { toast } = useToast();
  const toasted = useRef(false);

  useEffect(() => {
    if (justClaimed && !toasted.current) {
      // Prevent repeat toasts across navigations within same session
      if (sessionStorage.getItem('pitchr_ea_toasted')) return;
      toasted.current = true;
      sessionStorage.setItem('pitchr_ea_toasted', '1');
      toast('success', 'Welcome, Early Adopter! 20 bonus credits added.');
    }
  }, [justClaimed, toast]);

  return null;
}

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const {
    onStartSession,
    isSessionActive,
    isProjectSwitchLocked,
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
  } = useSidebar();

  return (
    <div className="flex h-screen p-3 md:p-4 gap-4 overflow-hidden relative">
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-5 left-5 z-50 p-2 rounded-xl border md:hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop overlay on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar: hidden on mobile by default, shown as overlay when open */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 p-4 transition-transform duration-300 ease-in-out
          md:relative md:inset-auto md:z-auto md:p-0 md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <AppSidebar
          onStartSession={onStartSession}
          isSessionActive={isSessionActive}
          isProjectSwitchLocked={isProjectSwitchLocked}
        />
      </div>

      {/* Early adopter auto-claim (renderless) */}
      <EarlyAdopterClaimer />

      {/* Main content — add left padding on mobile for hamburger */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col md:pl-0 pt-12 md:pt-0">
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TutorialProvider>
        <ToastProvider>
          <SidebarProvider>
            <ProjectProvider>
              <EarlyAdopterProvider>
                <AppLayoutInner>{children}</AppLayoutInner>
              </EarlyAdopterProvider>
            </ProjectProvider>
          </SidebarProvider>
        </ToastProvider>
      </TutorialProvider>
    </AuthProvider>
  );
}
