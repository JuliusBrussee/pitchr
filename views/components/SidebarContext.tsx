'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

interface SidebarContextValue {
  onStartSession?: () => void;
  isSessionActive: boolean;
  isProjectSwitchLocked: boolean;
  registerSession: (controls: {
    onStartSession: () => void;
    isSessionActive: boolean;
    isProjectSwitchLocked?: boolean;
  }) => void;
  unregisterSession: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isSessionActive: false,
  isProjectSwitchLocked: false,
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
    isProjectSwitchLocked: boolean;
  }>({ isSessionActive: false, isProjectSwitchLocked: false });

  const registerSession = useCallback(
    (controls: {
      onStartSession: () => void;
      isSessionActive: boolean;
      isProjectSwitchLocked?: boolean;
    }) => {
      setSessionControls((prev) => {
        const nextLocked = controls.isProjectSwitchLocked === true;
        if (
          prev.onStartSession === controls.onStartSession &&
          prev.isSessionActive === controls.isSessionActive &&
          prev.isProjectSwitchLocked === nextLocked
        ) {
          return prev;
        }
        return {
          ...controls,
          isProjectSwitchLocked: nextLocked,
        };
      });
    },
    [],
  );

  const unregisterSession = useCallback(() => {
    setSessionControls({ isSessionActive: false, isProjectSwitchLocked: false });
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        onStartSession: sessionControls.onStartSession,
        isSessionActive: sessionControls.isSessionActive,
        isProjectSwitchLocked: sessionControls.isProjectSwitchLocked,
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
export function useSidebarSession(
  onStartSession: () => void,
  isSessionActive: boolean,
  isProjectSwitchLocked = false,
) {
  const { registerSession, unregisterSession } = useSidebar();
  const onStartSessionRef = useRef(onStartSession);
  onStartSessionRef.current = onStartSession;

  useEffect(() => {
    registerSession({
      onStartSession: () => onStartSessionRef.current(),
      isSessionActive,
      isProjectSwitchLocked,
    });
  }, [registerSession, isSessionActive, isProjectSwitchLocked]);

  useEffect(() => {
    return () => unregisterSession();
  }, [unregisterSession]);
}
