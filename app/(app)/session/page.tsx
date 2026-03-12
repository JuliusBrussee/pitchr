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
import { ConfirmDialog } from '@/views/components/ui';
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';
import { useSidebarSession } from '@/views/components/SidebarContext';
import { useProject } from '@/views/components/ProjectProvider';
import { useHeadTracking } from '@/lib/headTracking/useHeadTracking';
import { PITCH_MODE_CONFIG, OVERTIME_LIMIT_SECONDS } from '@/config/modes';
import { PreSessionConfig } from '@/views/components/PreSessionConfig';
import { computeLiveSessionFeedback } from '@/lib/liveFeedback';
import type { DeckRecord, SlideRecord } from '@/services/deckService';
import type { PitchMode } from '@/types/pitch';
import { useTutorial } from '@/hooks/useTutorial';

const STT_SETUP_GUIDANCE =
  'Speech recording is unavailable. Set ASSEMBLYAI_API_KEY in .env.local and restart yarn dev.';

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
  const isSttUnavailable = stt.isSttAvailable === false;
  const sttGuardrailMessage = stt.sttAvailabilityMessage ?? STT_SETUP_GUIDANCE;
  const { runPitchAnalysis, error: runError, isRateLimited: isPitchRateLimited, secondsRemaining: pitchCooldownSeconds } = usePitchRun();
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
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const deckTextCacheRef = useRef<Record<string, string>>({});
  const autoSubmitLockRef = useRef(false);
  const hasStartedRef = useRef(false);
  const lockedProjectIdRef = useRef<string | null>(null);
  const [isProjectSwitchLocked, setIsProjectSwitchLocked] = useState(false);
  const { setChecklist: setSessionChecklist, resetChecklist: resetSessionChecklist } = session;

  // Pre-session config state (deterministic defaults for SSR; stored preference applied in useEffect)
  const [selectedMode, setSelectedMode] = useState<PitchMode>('vc_pitch');
  const [selectedDuration, setSelectedDuration] = useState(
    () => PITCH_MODE_CONFIG['vc_pitch'].defaultDurationSeconds,
  );
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);

  // Default session mode from the active project's defaultMode
  useEffect(() => {
    if (!activeProject?.defaultMode) return;
    const mode = activeProject.defaultMode;
    if (mode === 'elevator' || mode === 'vc_pitch' || mode === 'hackathon' || mode === 'final_year') {
      setSelectedMode(mode);
      setSelectedDuration(PITCH_MODE_CONFIG[mode].defaultDurationSeconds);
    }
  }, [activeProject?.defaultMode]);


  // Deck state
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [deckLoadError, setDeckLoadError] = useState<string | null>(null);
  const [deckReloadKey, setDeckReloadKey] = useState(0);
  const pitchMode = selectedMode;
  const modeConfig = PITCH_MODE_CONFIG[pitchMode];
  const liveSessionFeedback = useMemo(
    () =>
      computeLiveSessionFeedback({
        mode: pitchMode,
        checklist: session.checklist,
        metrics: session.metrics,
        targetDurationSeconds: modeConfig.targetDurationSeconds,
        targetWpm: modeConfig.targetWpm,
      }),
    [
      pitchMode,
      session.checklist,
      session.metrics,
      modeConfig.targetDurationSeconds,
      modeConfig.targetWpm,
    ],
  );

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
      setDeckLoadError(null);
      return;
    }
    setIsLoadingDecks(true);
    setDeckLoadError(null);
    (async () => {
      try {
        const res = await fetchEdge('deck-list', {
          params: { projectId: sessionProjectId },
        });
        if (!res.ok) throw new Error('Failed to load decks');
        const data = await res.json();
        setDecks(data);
        setDeckLoadError(null);
      } catch {
        setDeckLoadError('Could not load decks. Please retry.');
      } finally {
        setIsLoadingDecks(false);
      }
    })();
  }, [sessionProjectId, deckReloadKey]);

  const handleRetryDeckLoad = useCallback(() => {
    setDeckReloadKey((value) => value + 1);
  }, []);

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
    if (isSttUnavailable) {
      setAnalysisError(sttGuardrailMessage);
      return;
    }
    if (!sessionProjectId) {
      setAnalysisError('Select a project before starting a session.');
      return;
    }
    setAnalysisError(null);
    setShowAnalyzing(false);
    autoSubmitLockRef.current = false;
    setIsPaused(false);
    setIsConfigCollapsed(true);

    const isFirstStart = !hasStartedRef.current;
    if (isFirstStart) {
      hasStartedRef.current = true;
      lockedProjectIdRef.current = sessionProjectId;
      setIsProjectSwitchLocked(true);
      session.startSession(pitchMode);
      stt.start({ mode: pitchMode });
      if (media.stream) {
        recorder.startRecording(media.stream);
      }
      return;
    }

    session.resumeSession();
    stt.start({ mode: pitchMode, resume: true });
  }, [isSttUnavailable, media.stream, pitchMode, recorder, session, sessionProjectId, stt, sttGuardrailMessage]);

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

  const handleDiscardSession = useCallback(() => {
    setShowDiscardConfirm(true);
  }, []);

  const handleConfirmDiscard = useCallback(() => {
    session.resetSession(pitchMode);
    stt.discard();
    void recorder.stopRecording(); // ignore blob; stt.saved never set so auto-submit won't run
    setShowAnalyzing(false);
    setAnalysisError(null);
    setIsPaused(false);
    hasStartedRef.current = false;
    lockedProjectIdRef.current = null;
    setIsProjectSwitchLocked(false);
    setShowDiscardConfirm(false);
  }, [session, stt, recorder, pitchMode]);

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
  useSidebarSession(handleSessionToggle, session.isSessionActive, isProjectSwitchLocked);

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
    const lockedProjectId = lockedProjectIdRef.current ?? sessionProjectId;
    if (!lockedProjectId) {
      autoSubmitLockRef.current = false;
      setShowAnalyzing(false);
      setAnalysisError('Select a project before running analysis.');
      return;
    }

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
            autoSubmitLockRef.current = false;
            setShowAnalyzing(false);
            setAnalysisError('Could not load selected deck context. Please retry.');
            session.setOrbState('idle');
            return;
          }
        }
        const result = await runPitchAnalysis({
          projectId: lockedProjectId,
          mode: pitchMode,
          inputType: 'audio',
          transcript,
          audioUrl,
          deckId: selectedDeckId ?? undefined,
          deckText,
          transcriptSegments: stt.transcriptSegments,
          targetDurationSeconds: selectedDuration,
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
        <PreSessionConfig
          duration={selectedDuration}
          onDurationChange={setSelectedDuration}
          isCollapsed={isConfigCollapsed}
          disabled={hasStartedRef.current}
        />
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
          onDiscardSession={handleDiscardSession}
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
          targetSeconds={selectedDuration}
          overtimeLimit={OVERTIME_LIMIT_SECONDS}
          canStartSession={!isSttUnavailable}
        />
        {isSttUnavailable && (
          <div
            role="alert"
            className="rounded-lg border px-3 py-2 text-xs"
            style={{
              color: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.2)',
            }}
          >
            {sttGuardrailMessage}
          </div>
        )}
        {deckLoadError && (
          <div
            role="alert"
            className="rounded-lg border px-3 py-2 text-xs flex items-center justify-between gap-3"
            style={{
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <span>{deckLoadError}</span>
            <button
              type="button"
              onClick={handleRetryDeckLoad}
              className="px-2 py-1 rounded-md font-semibold text-[11px]"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
      <div data-tour="tour-session-metrics">
        <MetricsPanel
          metrics={session.metrics}
          targetDurationSeconds={selectedDuration}
          checklist={session.checklist}
          liveRubric={liveSessionFeedback.liveRubric}
          beatProgress={liveSessionFeedback.beatProgress}
          isSessionActive={session.isSessionActive}
          hasStarted={hasStartedRef.current}
          engagementBand={engagementBand}
          isCameraOn={media.isCameraOn}
          checklistSource={stt.checklistSource}
          checklistNextHint={stt.checklistNextHint}
          checklistError={stt.checklistError}
          sttError={
            (isPitchRateLimited ? `Too many requests. Try again in ${pitchCooldownSeconds}s.` : null)
            ?? analysisError
            ?? runError
            ?? (isSttUnavailable ? sttGuardrailMessage : null)
            ?? stt.error
            ?? (!isProjectLoading && !sessionProjectId ? 'Select a project before starting a session.' : null)
          }
          sttSaved={stt.saved && !showAnalyzing}
          isAnalyzing={showAnalyzing}
          analysisError={
            (isPitchRateLimited ? `Too many requests. Try again in ${pitchCooldownSeconds}s.` : null)
            ?? analysisError
            ?? runError
          }
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
      <ConfirmDialog
        open={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        title="Discard this recording?"
        description="It cannot be recovered."
        confirmLabel="Discard"
        variant="danger"
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
