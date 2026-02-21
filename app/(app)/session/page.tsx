'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { useSTT } from '@/hooks/useSTT';
import { useTheme } from '@/views/components/ThemeProvider';
import { useSidebarSession } from '@/views/components/SidebarContext';
import type { SpeechBubble } from '@/hooks/useSessionState';

export default function SessionPage() {
  const media = useMediaStream();
  const session = useSessionState();
  const stt = useSTT();
  const { setOrbState } = useTheme();

  // Sync orb state to ThemeProvider for reactive aura
  useEffect(() => {
    setOrbState(session.orbState);
  }, [session.orbState, setOrbState]);

  // Build speech bubbles from real STT transcript when recording, otherwise mock bubbles
  const speechBubbles: SpeechBubble[] = useMemo(() => {
    if (stt.isRecording) {
      const segments = stt.transcriptSegments.map((text, i) => ({
        id: `stt-${i}`,
        text,
        expiresAt: Number.MAX_SAFE_INTEGER,
      }));
      if (stt.liveText.trim()) {
        segments.push({
          id: 'stt-live',
          text: stt.liveText,
          expiresAt: Number.MAX_SAFE_INTEGER,
        });
      }
      return segments;
    }
    return session.speechBubbles;
  }, [stt.isRecording, stt.transcriptSegments, stt.liveText, session.speechBubbles]);

  const handleStartSession = useCallback(() => {
    session.startSession();
    stt.start();
  }, [session, stt]);

  const handleStopSession = useCallback(() => {
    session.stopSession();
    stt.stop();
  }, [session, stt]);

  const handleSessionToggle = useCallback(() => {
    if (session.isSessionActive) {
      handleStopSession();
    } else {
      handleStartSession();
    }
  }, [session.isSessionActive, handleStartSession, handleStopSession]);

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
        speechBubbles={speechBubbles}
        isSessionActive={session.isSessionActive}
        onStartSession={handleStartSession}
        onStopSession={handleStopSession}
      />
      <MetricsPanel
        metrics={session.metrics}
        checklist={session.checklist}
        insights={session.insights}
        isSessionActive={session.isSessionActive}
        sttError={stt.error}
        sttSaved={stt.saved}
      />
    </>
  );
}
