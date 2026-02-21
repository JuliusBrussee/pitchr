'use client';

import { useEffect, useCallback } from 'react';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { useTheme } from '@/views/components/ThemeProvider';
import { useSidebarSession } from '@/views/components/SidebarContext';

export default function SessionPage() {
  const media = useMediaStream();
  const session = useSessionState();
  const { setOrbState } = useTheme();

  // Sync orb state to ThemeProvider for reactive aura
  useEffect(() => {
    setOrbState(session.orbState);
  }, [session.orbState, setOrbState]);

  const handleSessionToggle = useCallback(() => {
    if (session.isSessionActive) {
      if (session.isPaused) {
        session.resumeSession();
      } else {
        session.pauseSession();
      }
    } else {
      session.startSession();
    }
  }, [session]);

  // Register session controls with the shared sidebar
  useSidebarSession(handleSessionToggle, session.isSessionActive);

  return (
    <>
      <SessionCanvas
        stream={media.stream}
        isCameraOn={media.isCameraOn}
        isMicOn={media.isMicOn}
        toggleCamera={media.toggleCamera}
        toggleMic={media.toggleMic}
        orbState={session.orbState}
        orbIntensity={0.6}
        speechBubbles={session.speechBubbles}
        isSessionActive={session.isSessionActive}
        isPaused={session.isPaused}
        onStartSession={session.startSession}
        onPauseSession={session.pauseSession}
        onResumeSession={session.resumeSession}
        onStopSession={session.stopSession}
      />
      <MetricsPanel
        metrics={session.metrics}
        checklist={session.checklist}
        insights={session.insights}
        isSessionActive={session.isSessionActive}
      />
    </>
  );
}
