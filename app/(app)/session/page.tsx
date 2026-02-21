'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { useDeckSlides } from '@/hooks/useDeckSlides';
import { useSTT } from '@/hooks/useSTT';
import { useTheme } from '@/views/components/ThemeProvider';
import { useSidebarSession } from '@/views/components/SidebarContext';
import type { SpeechBubble } from '@/hooks/useSessionState';
import type { DeckRecord } from '@/services/deckService';

export default function SessionPage() {
  const media = useMediaStream();
  const session = useSessionState();
  const stt = useSTT();
  const { setOrbState } = useTheme();

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
        sttError={stt.error}
        sttSaved={stt.saved}
      />
    </>
  );
}
