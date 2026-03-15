'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useSessionStateContext } from '@/contexts/SessionStateContext';

interface SidebarContextValue {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isSidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((p) => !p), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{ isSidebarOpen, toggleSidebar, closeSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Returns combined sidebar UI state + session state.
 * Session state comes from SessionStateContext (shared between desktop and mobile shells).
 * Sidebar UI state is desktop-only.
 */
export function useSidebar() {
  const sidebarCtx = useContext(SidebarContext);
  const sessionCtx = useSessionStateContext();
  return {
    ...sidebarCtx,
    ...sessionCtx,
  };
}

/** @deprecated Use useSessionControl() from hooks/useSessionControl.ts instead */
export { useSessionControl as useSidebarSession } from '@/hooks/useSessionControl';
