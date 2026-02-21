'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { usePitchRun } from '@/hooks/usePitchRun';
import { useSTT } from '@/hooks/useSTT';
import { useTheme } from '@/views/components/ThemeProvider';
import { useSidebarSession } from '@/views/components/SidebarContext';
import type { SpeechBubble } from '@/hooks/useSessionState';
import type { PitchMode } from '@/types/pitch';

const DEFAULT_MODE: PitchMode = 'vc_pitch';

export default function SessionPage() {
  const router = useRouter();
  const media = useMediaStream();
  const session = useSessionState();
  const pitchRun = usePitchRun();
  const stt = useSTT();
  const { setOrbState } = useTheme();
  const analysisTriggeredRef = useRef(false);
  const [hasSessionStarted, setHasSessionStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setOrbState(session.orbState);
  }, [session.orbState, setOrbState]);

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
    if (pitchRun.isAnalyzing) return;
    const resume = isPaused;
    analysisTriggeredRef.current = false;
    session.startSession();
    setHasSessionStarted(true);
    setIsPaused(false);
    void stt.start({ resume }).catch(() => {
      session.stopSession();
      setHasSessionStarted(false);
      setIsPaused(false);
    });
  }, [isPaused, pitchRun.isAnalyzing, session, stt]);

  const handlePauseSession = useCallback(() => {
    if (pitchRun.isAnalyzing || !hasSessionStarted) return;
    stt.pause();
    session.stopSession();
    session.setOrbState('neutral');
    setIsPaused(true);
  }, [hasSessionStarted, pitchRun.isAnalyzing, session, stt]);

  const handleEndSession = useCallback(() => {
    if (pitchRun.isAnalyzing || !hasSessionStarted) return;
    stt.stop();
    session.stopSession();
    setIsPaused(false);
    setHasSessionStarted(false);
  }, [hasSessionStarted, pitchRun.isAnalyzing, session, stt]);

  const handleSessionToggle = useCallback(() => {
    if (pitchRun.isAnalyzing) return;

    if (!hasSessionStarted || isPaused) {
      handleStartSession();
    } else {
      handlePauseSession();
    }
  }, [pitchRun.isAnalyzing, hasSessionStarted, isPaused, handleStartSession, handlePauseSession]);

  useEffect(() => {
    if (!stt.saved) {
      analysisTriggeredRef.current = false;
    }
  }, [stt.saved]);

  useEffect(() => {
    if (!stt.saved || analysisTriggeredRef.current || pitchRun.isAnalyzing) {
      return;
    }

    const transcript = stt.transcriptSegments.join(' ').replace(/\s+/g, ' ').trim();
    if (!transcript) return;

    analysisTriggeredRef.current = true;
    session.setOrbState('neutral');

    void pitchRun
      .runPitchAnalysis({
        mode: DEFAULT_MODE,
        transcript,
        inputType: 'audio',
      })
      .then(({ runId }) => {
        session.setOrbState('positive');
        router.push(`/review/${runId}`);
      })
      .catch(() => {
        session.setOrbState('negative');
        analysisTriggeredRef.current = false;
      });
  }, [
    stt.saved,
    stt.transcriptSegments,
    pitchRun,
    router,
    session,
  ]);

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
        hasSessionStarted={hasSessionStarted}
        isPaused={isPaused}
        isAnalyzing={pitchRun.isAnalyzing}
        onStartSession={handleStartSession}
        onPauseSession={handlePauseSession}
        onEndSession={handleEndSession}
      />
      <MetricsPanel
        metrics={session.metrics}
        checklist={session.checklist}
        insights={session.insights}
        isSessionActive={session.isSessionActive}
        sttError={stt.error ?? pitchRun.error}
        sttSaved={stt.saved}
      />
    </>
  );
}
