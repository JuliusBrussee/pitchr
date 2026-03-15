'use client';

import { useEffect, useRef } from 'react';
import { useSessionStateContext } from '@/contexts/SessionStateContext';

/** Hook for the session page to register its controls (replaces useSidebarSession) */
export function useSessionControl(
  onStartSession: () => void,
  isSessionActive: boolean,
  isProjectSwitchLocked = false,
) {
  const { registerSession, unregisterSession } = useSessionStateContext();
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
