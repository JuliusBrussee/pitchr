'use client';

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { useDeckSlides } from '@/hooks/useDeckSlides';
import { useSTT } from '@/hooks/useSTT';
import { useRecorder } from '@/hooks/useRecorder';
import { uploadRecording } from '@/services/recordingService';
import { usePitchRun } from '@/hooks/usePitchRun';
import { useTheme } from '@/views/components/ThemeProvider';
import { useSidebarSession } from '@/views/components/SidebarContext';
import { useHeadTracking } from '@/lib/headTracking/useHeadTracking';
import type { DeckRecord } from '@/services/deckService';
import type { PitchMode } from '@/types/pitch';
import type { SlideRecord } from '@/services/deckService';

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
          <p style={{ color: 'var(--text-muted)' }}>Loading session...</p>
        </main>
      }
    >
      <SessionPageContent />
    </Suspense>
  );
}

function SessionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const media = useMediaStream();
  const session = useSessionState();
  const stt = useSTT();
  const recorder = useRecorder();
  const { runPitchAnalysis, isAnalyzing, error: runError } = usePitchRun();
  const { setOrbState } = useTheme();
  const trackingVideoRef = useRef<HTMLVideoElement | null>(null);
  const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const deckTextCacheRef = useRef<Record<string, string>>({});
  const autoSubmitLockRef = useRef(false);

  // Deck state
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const modeFromQuery = searchParams.get('mode');
  const pitchMode: PitchMode =
    modeFromQuery === 'elevator' || modeFromQuery === 'vc_pitch'
      ? modeFromQuery
      : 'vc_pitch';

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

  const loadDeckText = useCallback(async (deckId: string): Promise<string | undefined> => {
    if (deckTextCacheRef.current[deckId]) {
      return deckTextCacheRef.current[deckId];
    }
    const response = await fetch(`/api/deck/${deckId}`);
    if (!response.ok) {
      throw new Error('Failed to load selected deck text for analysis.');
    }
    const payload = (await response.json()) as { slides?: SlideRecord[] };
    const deckText = (payload.slides ?? [])
      .map((slide) => slide.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n\n')
      .trim();
    if (deckText) {
      deckTextCacheRef.current[deckId] = deckText;
      return deckText;
    }
    return undefined;
  }, []);

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

  const handleStartSession = useCallback(() => {
    setAnalysisError(null);
    autoSubmitLockRef.current = false;
    session.startSession();
    stt.start();
    if (media.stream) {
      recorder.startRecording(media.stream);
    }
  }, [session, stt, media.stream, recorder]);

  const handleStopSession = useCallback(() => {
    session.stopSession();
    stt.stop();
    recorder.stopRecording(); // fire-and-forget stop; blob captured in auto-submit
  }, [session, stt, recorder]);

  const handleSessionToggle = useCallback(() => {
    if (session.isSessionActive) {
      handleStopSession();
    } else {
      handleStartSession();
    }
  }, [session.isSessionActive, handleStartSession, handleStopSession]);

  // Register session controls with the shared sidebar
  useSidebarSession(handleSessionToggle, session.isSessionActive);

  useEffect(() => {
    if (!stt.saved || autoSubmitLockRef.current) {
      return;
    }

    const transcript = stt.transcriptSegments.join(' ').replace(/\s+/g, ' ').trim();
    if (!transcript) {
      autoSubmitLockRef.current = true;
      setAnalysisError('Transcript was saved but no text was captured for analysis.');
      return;
    }

    autoSubmitLockRef.current = true;
    session.setOrbState('active');

    void (async () => {
      try {
        // Stop recording and upload blob
        let audioUrl: string | undefined;
        try {
          const blob = await recorder.stopRecording();
          if (blob && blob.size > 0) {
            const tempId = crypto.randomUUID();
            audioUrl = await uploadRecording(tempId, blob);
          }
        } catch (uploadErr) {
          console.warn('[session] Recording upload failed, proceeding without:', uploadErr);
        }

        let deckText: string | undefined;
        if (selectedDeckId !== null) {
          try {
            deckText = await loadDeckText(selectedDeckId);
          } catch {
            deckText = undefined;
          }
        }
        const result = await runPitchAnalysis({
          mode: pitchMode,
          inputType: 'audio',
          transcript,
          audioUrl,
          deckText,
        });
        router.push(`/results/${result.runId}`);
      } catch (error) {
        autoSubmitLockRef.current = false;
        setAnalysisError(
          error instanceof Error ? error.message : 'Failed to run pitch analysis.',
        );
        session.setOrbState('idle');
      }
    })();
  }, [
    loadDeckText,
    pitchMode,
    recorder,
    router,
    runPitchAnalysis,
    selectedDeckId,
    session,
    stt.saved,
    stt.transcriptSegments,
  ]);

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
        sttError={analysisError ?? runError ?? stt.error}
        sttSaved={stt.saved && !isAnalyzing}
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
