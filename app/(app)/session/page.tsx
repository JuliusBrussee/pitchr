'use client';

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { useDeckSlides } from '@/hooks/useDeckSlides';
import { useSTT } from '@/hooks/useSTT';
import { useRecorder } from '@/hooks/useRecorder';
import { createClient } from '@/lib/supabase/client';
import { uploadRecording } from '@/services/recordingService';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import { usePitchRun } from '@/hooks/usePitchRun';
import { useTheme } from '@/views/components/ThemeProvider';
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';
import { useSidebarSession } from '@/views/components/SidebarContext';
import { useProject } from '@/views/components/ProjectProvider';
import { useHeadTracking } from '@/lib/headTracking/useHeadTracking';
import { useProjectDocuments } from '@/hooks/useProjectDocuments';
import { ContextDocPicker } from '@/views/components/ContextDocPicker';
import { PITCH_MODE_CONFIG } from '@/config/modes';
import type { DeckRecord, SlideRecord } from '@/services/deckService';
import type { PitchMode } from '@/types/pitch';
import { useTutorial } from '@/hooks/useTutorial';

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
  const media = useMediaStream();
  const session = useSessionState();
  const stt = useSTT();
  const recorder = useRecorder();
  const { runPitchAnalysis, error: runError } = usePitchRun();
  const {
    activeProject,
    isLoading: isProjectLoading,
  } = useProject();
  const sessionProject = activeProject && !activeProject.isArchived ? activeProject : null;
  const sessionProjectId = sessionProject?.id ?? null;
  const { setOrbState } = useTheme();
  const { registerPage } = useTutorial('session');
  const trackingVideoRef = useRef<HTMLVideoElement | null>(null);
  const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAnalyzing, setShowAnalyzing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const deckTextCacheRef = useRef<Record<string, string>>({});
  const autoSubmitLockRef = useRef(false);
  const hasStartedRef = useRef(false);
  const { setChecklist: setSessionChecklist, resetChecklist: resetSessionChecklist } = session;

  // Context documents state
  const { documents: contextDocs, isLoading: isLoadingDocs } = useProjectDocuments(sessionProjectId);
  const [contextDocumentIds, setContextDocumentIds] = useState<string[] | undefined>(undefined);

  // Deck state
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const pitchMode: PitchMode = sessionProject?.workflowMode
    ?? 'vc_pitch';
  const modeConfig = PITCH_MODE_CONFIG[pitchMode];

  useEffect(() => {
    if (isProjectLoading) return;
    if (sessionProjectId) return;
    router.replace('/session/select-project?returnTo=/session');
  }, [sessionProjectId, isProjectLoading, router]);

  // Fetch available decks for the active project
  useEffect(() => {
    if (!sessionProjectId) {
      setDecks([]);
      setSelectedDeckId(null);
      setIsLoadingDecks(false);
      return;
    }
    setIsLoadingDecks(true);
    (async () => {
      try {
        const res = await fetchEdge('deck-list', {
          params: { projectId: sessionProjectId },
        });
        if (!res.ok) throw new Error('Failed to load decks');
        const data = await res.json();
        setDecks(data);
      } catch {
        // Silently fail — deck picker just won't show decks
      } finally {
        setIsLoadingDecks(false);
      }
    })();
  }, [sessionProjectId]);

  const selectedDeck = useMemo(
    () => decks.find((d) => d.id === selectedDeckId) ?? null,
    [decks, selectedDeckId],
  );

  const loadDeckText = useCallback(async (deckId: string): Promise<string | undefined> => {
    if (deckTextCacheRef.current[deckId]) {
      return deckTextCacheRef.current[deckId];
    }
    const response = await fetchEdge('deck-detail', { params: { deckId } });
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

  useEffect(() => {
    registerPage('session');
  }, [registerPage]);

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

  // Sync realtime checklist from STT to session state
  useEffect(() => {
    setSessionChecklist(stt.realtimeChecklist);
  }, [setSessionChecklist, stt.realtimeChecklist]);

  // Sync transcript data to session metrics (WPM, filler words, etc.)
  useEffect(() => {
    const committedText = stt.transcriptSegments
      .map((segment) => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const fullText = [...stt.transcriptSegments.map((segment) => segment.text), stt.liveText]
      .filter(Boolean)
      .join(' ')
      .trim();
    session.updateTranscript(fullText, committedText);
  }, [stt.transcriptSegments, stt.liveText, session.updateTranscript]);

  useEffect(() => {
    if (session.isSessionActive) return;
    resetSessionChecklist(pitchMode);
  }, [pitchMode, session.isSessionActive, resetSessionChecklist]);

  const handleStartSession = useCallback(() => {
    setAnalysisError(null);
    setShowAnalyzing(false);
    autoSubmitLockRef.current = false;
    setIsPaused(false);

    const isFirstStart = !hasStartedRef.current;
    if (isFirstStart) {
      hasStartedRef.current = true;
      session.startSession(pitchMode);
      stt.start({ mode: pitchMode });
      if (media.stream) {
        recorder.startRecording(media.stream);
      }
      return;
    }

    session.resumeSession();
    stt.start({ mode: pitchMode, resume: true });
  }, [media.stream, pitchMode, recorder, session, stt]);

  const handlePauseSession = useCallback(() => {
    if (!session.isSessionActive) {
      return;
    }
    session.stopSession();
    stt.pause();
    setShowAnalyzing(false);
    setIsPaused(true);
  }, [session, stt]);

  const handleStopSession = useCallback(() => {
    session.stopSession();
    stt.stop();
    setShowAnalyzing(true);
    setIsPaused(false);
    // Do NOT stop the recorder here — the auto-submit effect handles stopping
    // and capturing the blob for upload. Stopping here causes a race condition
    // where the blob is lost before the effect can retrieve it.
  }, [session, stt]);

  // Warn before navigating away during analysis
  useEffect(() => {
    if (!showAnalyzing) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [showAnalyzing]);

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

    const transcript = stt.transcriptSegments
      .map((segment) => segment.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!transcript) {
      autoSubmitLockRef.current = true;
      setShowAnalyzing(false);
      setAnalysisError('Transcript was saved but no text was captured for analysis.');
      return;
    }
    const MAX_TRANSCRIPT_CHARS = 50_000;
    if (transcript.length > MAX_TRANSCRIPT_CHARS) {
      autoSubmitLockRef.current = true;
      setShowAnalyzing(false);
      setAnalysisError(`Transcript is too long (${transcript.length.toLocaleString()} chars). Maximum is ${MAX_TRANSCRIPT_CHARS.toLocaleString()} characters.`);
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
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            const tempId = crypto.randomUUID();
            audioUrl = await uploadRecording(supabase, user?.id ?? 'anonymous', tempId, blob);
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
          projectId: sessionProjectId ?? undefined,
          mode: pitchMode,
          inputType: 'audio',
          transcript,
          audioUrl,
          deckId: selectedDeckId ?? undefined,
          deckText,
          contextDocumentIds,
          transcriptSegments: stt.transcriptSegments,
        });
        router.push(`/results/${result.runId}`);
      } catch (error) {
        autoSubmitLockRef.current = false;
        setShowAnalyzing(false);
        setAnalysisError(
          error instanceof Error ? error.message : 'Failed to run pitch analysis.',
        );
        session.setOrbState('idle');
      }
    })();
  }, [
    sessionProjectId,
    contextDocumentIds,
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
    <div className="flex gap-4 h-full min-h-0">
      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-2">
        <SessionCanvas
          stream={media.stream}
          isCameraOn={media.isCameraOn}
          isMicOn={media.isMicOn}
          toggleCamera={media.toggleCamera}
          toggleMic={media.toggleMic}
          isSessionActive={session.isSessionActive}
          canStopSession={hasStartedRef.current}
          onStartSession={handleStartSession}
          onPauseSession={handlePauseSession}
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
          elapsedSeconds={session.metrics.durationSecs}
          targetSeconds={modeConfig.targetDurationSeconds}
        />
        {!session.isSessionActive && contextDocs.length > 0 ? (
          <div className="flex items-center gap-2">
            <ContextDocPicker
              documents={contextDocs}
              isLoading={isLoadingDocs}
              selectedIds={contextDocumentIds}
              onChange={setContextDocumentIds}
            />
          </div>
        ) : null}
      </div>
      <div data-tour="tour-session-metrics">
        <MetricsPanel
          metrics={session.metrics}
          targetDurationSeconds={modeConfig.targetDurationSeconds}
          checklist={session.checklist}
          isSessionActive={session.isSessionActive}
          hasStarted={hasStartedRef.current}
          engagementBand={engagementBand}
          isCameraOn={media.isCameraOn}
          checklistSource={stt.checklistSource}
          checklistNextHint={stt.checklistNextHint}
          checklistError={stt.checklistError}
          sttError={
            analysisError
            ?? runError
            ?? stt.error
            ?? (!isProjectLoading && !sessionProjectId ? 'Select a project before starting a session.' : null)
          }
          sttSaved={stt.saved && !showAnalyzing}
          isAnalyzing={showAnalyzing}
          analysisError={analysisError ?? runError}
        />
      </div>
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
      <AnalyzingOverlay isVisible={showAnalyzing} />
    </div>
  );
}
