'use client';

import { useEffect } from 'react';
import { AppSidebar } from '@/views/components/AppSidebar';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { useTheme } from '@/views/components/ThemeProvider';

export default function SessionPage() {
  const media = useMediaStream();
  const session = useSessionState();
  const { setOrbState } = useTheme();

  // Sync orb state to ThemeProvider for reactive aura
  useEffect(() => {
    setOrbState(session.orbState);
  }, [session.orbState, setOrbState]);

  const handleSessionToggle = () => {
    if (session.isSessionActive) {
      session.stopSession();
    } else {
      session.startSession();
    }
  };

  return (
    <div className="flex h-screen p-4 gap-4">
      <AppSidebar
        activePage="session"
        onStartSession={handleSessionToggle}
        isSessionActive={session.isSessionActive}
      />
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
        onStartSession={session.startSession}
        onStopSession={session.stopSession}
      />
      <MetricsPanel
        metrics={session.metrics}
        checklist={session.checklist}
        insights={session.insights}
        isSessionActive={session.isSessionActive}
      />
    </div>
  );
}
