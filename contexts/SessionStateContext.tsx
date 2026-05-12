'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface SessionStateContextValue {
  onStartSession?: () => void;
  isSessionActive: boolean;
  isProjectSwitchLocked: boolean;
  registerSession: (controls: {
    onStartSession: () => void;
    isSessionActive: boolean;
    isProjectSwitchLocked?: boolean;
  }) => void;
  unregisterSession: () => void;
}

const SessionStateCtx = createContext<SessionStateContextValue>({
  isSessionActive: false,
  isProjectSwitchLocked: false,
  registerSession: () => {},
  unregisterSession: () => {},
});

export function SessionStateProvider({ children }: { children: ReactNode }) {
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
    <SessionStateCtx.Provider
      value={{
        onStartSession: sessionControls.onStartSession,
        isSessionActive: sessionControls.isSessionActive,
        isProjectSwitchLocked: sessionControls.isProjectSwitchLocked,
        registerSession,
        unregisterSession,
      }}
    >
      {children}
    </SessionStateCtx.Provider>
  );
}

export function useSessionStateContext() {
  return useContext(SessionStateCtx);
}
