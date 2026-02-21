'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface SidebarContextValue {
  onStartSession?: () => void;
  isSessionActive: boolean;
  registerSession: (controls: { onStartSession: () => void; isSessionActive: boolean }) => void;
  unregisterSession: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isSessionActive: false,
  registerSession: () => {},
  unregisterSession: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sessionControls, setSessionControls] = useState<{
    onStartSession?: () => void;
    isSessionActive: boolean;
  }>({ isSessionActive: false });

  const registerSession = useCallback(
    (controls: { onStartSession: () => void; isSessionActive: boolean }) => {
      setSessionControls(controls);
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

  useEffect(() => {
    registerSession({ onStartSession, isSessionActive });
  }, [registerSession, onStartSession, isSessionActive]);

  useEffect(() => {
    return () => unregisterSession();
  }, [unregisterSession]);
}
