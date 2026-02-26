'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

interface SidebarContextValue {
  onStartSession?: () => void;
  isSessionActive: boolean;
  registerSession: (controls: { onStartSession: () => void; isSessionActive: boolean }) => void;
  unregisterSession: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isSessionActive: false,
  registerSession: () => {},
  unregisterSession: () => {},
  isSidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((p) => !p), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const [sessionControls, setSessionControls] = useState<{
    onStartSession?: () => void;
    isSessionActive: boolean;
  }>({ isSessionActive: false });

  const registerSession = useCallback(
    (controls: { onStartSession: () => void; isSessionActive: boolean }) => {
      setSessionControls((prev) => {
        if (
          prev.onStartSession === controls.onStartSession &&
          prev.isSessionActive === controls.isSessionActive
        ) {
          return prev;
        }
        return controls;
      });
    },
    [],
  );

  const unregisterSession = useCallback(() => {
    setSessionControls({ isSessionActive: false });
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        onStartSession: sessionControls.onStartSession,
        isSessionActive: sessionControls.isSessionActive,
        registerSession,
        unregisterSession,
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

/** Hook for the session page to register its controls with the sidebar */
export function useSidebarSession(onStartSession: () => void, isSessionActive: boolean) {
  const { registerSession, unregisterSession } = useSidebar();
  const onStartSessionRef = useRef(onStartSession);
  onStartSessionRef.current = onStartSession;

  useEffect(() => {
    registerSession({
      onStartSession: () => onStartSessionRef.current(),
      isSessionActive,
    });
  }, [registerSession, isSessionActive]);

  useEffect(() => {
    return () => unregisterSession();
  }, [unregisterSession]);
}
