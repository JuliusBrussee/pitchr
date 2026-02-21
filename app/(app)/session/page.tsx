'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { useDeckSlides } from '@/hooks/useDeckSlides';
import { useSTT } from '@/hooks/useSTT';
import { usePitchRun } from '@/hooks/usePitchRun';
import { useTheme } from '@/views/components/ThemeProvider';
import { useSidebarSession } from '@/views/components/SidebarContext';
import { useHeadTracking } from '@/lib/headTracking/useHeadTracking';
import type { DeckRecord } from '@/services/deckService';
import type { PitchMode } from '@/types/pitch';

export default function SessionPage() {
  const router = useRouter();
  const media = useMediaStream();
  const session = useSessionState();
  const stt = useSTT();
  const pitchRun = usePitchRun();
  const { setOrbState } = useTheme();
  const trackingVideoRef = useRef<HTMLVideoElement | null>(null);
  const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasTriggeredAnalysis = useRef(false);
  const runModeRef = useRef<PitchMode>('elevator');
  const [selectedMode, setSelectedMode] = useState<PitchMode>('elevator');
  const { setChecklist: setSessionChecklist, resetChecklist: resetSessionChecklist } = session;

  // Deck state
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);

  // Fetch available decks on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/deck');
        if (!res.ok) throw new Error('Failed to load decks');
        const data = await res.json();
        setDecks(data);
      } catch {
        // Silently fail — deck picker just won't show decks
      } finally {
        setIsLoadingDecks(false);
      }
    })();
  }, []);

  const selectedDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) ?? null,
    [decks, selectedDeckId],
  );

  const {
    currentSlide,
    slideCount,
    nextSlide,
    prevSlide,
    renderSlideToCanvas,
    isLoading: isLoadingPdf,
    error: pdfError,
  } = useDeckSlides(selectedDeck?.pdf_url ?? null);

  // Keyboard shortcuts for slide navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') nextSlide();
      else if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [nextSlide, prevSlide]);

  // Sync orb state to ThemeProvider for reactive aura
  useEffect(() => {
    setOrbState(session.orbState);
  }, [session.orbState, setOrbState]);

  const {
    engagementBand,
    state: headState,
    error: headTrackingError,
    debugEnabled: headTrackingDebugEnabled,
  } = useHeadTracking({
    videoRef: trackingVideoRef,
    canvasRef: trackingCanvasRef,
    stream: media.stream,
    autoStart: true,
    enabled: session.isSessionActive && media.isCameraOn,
  });

  useEffect(() => {
    if (!headTrackingDebugEnabled) return;
    if (!session.isSessionActive || !media.isCameraOn) return;
    if (headTrackingError) {
      console.warn('[headTracking] initialization or runtime error', headTrackingError);
      return;
    }
    console.debug('[headTracking] initialized');
  }, [
    headTrackingDebugEnabled,
    session.isSessionActive,
    media.isCameraOn,
    headTrackingError,
  ]);

  useEffect(() => {
    if (!headTrackingDebugEnabled) return;
    if (!session.isSessionActive || !media.isCameraOn) return;
    console.debug('[headTracking] state transition', headState);
  }, [headTrackingDebugEnabled, session.isSessionActive, media.isCameraOn, headState]);

  useEffect(() => {
    setSessionChecklist(stt.realtimeChecklist);
  }, [setSessionChecklist, stt.realtimeChecklist]);

  useEffect(() => {
    if (session.isSessionActive) return;
    resetSessionChecklist(selectedMode);
  }, [selectedMode, session.isSessionActive, resetSessionChecklist]);

  // When STT confirms transcript saved, trigger analysis and save to Supabase
  useEffect(() => {
    if (!stt.saved || hasTriggeredAnalysis.current) return;
    const transcript = stt.transcriptSegments.join(' ').trim();
    if (!transcript) return;

    hasTriggeredAnalysis.current = true;

    pitchRun
      .runPitchAnalysis({
        mode: runModeRef.current,
        inputType: 'audio',
        transcript,
      })
      .then((result) => {
        router.push(`/results/${result.runId}`);
      })
      .catch(() => {
        // Error state is set in pitchRun.error
      });
  }, [stt.saved, stt.transcriptSegments, pitchRun, router]);

  const handleStartSession = useCallback(() => {
    hasTriggeredAnalysis.current = false;
    runModeRef.current = selectedMode;
    session.startSession(runModeRef.current);
    stt.start({ mode: runModeRef.current });
  }, [selectedMode, session, stt]);

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
        engagementBand={engagementBand}
        headState={headState}
        showEngagement={session.isSessionActive && media.isCameraOn}
        headTrackingError={headTrackingError}
        isSessionActive={session.isSessionActive}
        onStartSession={handleStartSession}
        onStopSession={handleStopSession}
        pdfUrl={selectedDeck?.pdf_url ?? null}
        currentSlide={currentSlide}
        slideCount={slideCount}
        onNextSlide={nextSlide}
        onPrevSlide={prevSlide}
        renderSlideToCanvas={renderSlideToCanvas}
        decks={decks}
        selectedDeckId={selectedDeckId}
        onSelectDeck={setSelectedDeckId}
        isLoadingDecks={isLoadingDecks}
        isLoadingPdf={isLoadingPdf}
        pdfError={pdfError}
      />
      <MetricsPanel
        metrics={session.metrics}
        checklist={session.checklist}
        insights={session.insights}
        isSessionActive={session.isSessionActive}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        checklistSource={stt.checklistSource}
        checklistNextHint={stt.checklistNextHint}
        checklistError={stt.checklistError}
        sttError={stt.error}
        sttSaved={stt.saved}
        isAnalyzing={pitchRun.isAnalyzing}
        analysisError={pitchRun.error}
      />
      <video
        ref={trackingVideoRef}
        autoPlay
        playsInline
        muted
        className="sr-only"
        aria-hidden="true"
      />
      <canvas
        ref={trackingCanvasRef}
        className="sr-only"
        aria-hidden="true"
      />
    </>
  );
}
