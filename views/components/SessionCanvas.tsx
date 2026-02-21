'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Video, VideoOff, Mic, MicOff, Monitor, Play, Pause, Square, SkipForward, SkipBack } from 'lucide-react';
import { SiriBubble } from '@/views/components/SiriBubble';
import type { OrbState } from '@/views/components/SiriBubble';
import type { SpeechBubble } from '@/hooks/useSessionState';

interface SessionCanvasProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  toggleMic: () => void;
  orbState: OrbState;
  orbIntensity: number;
  speechBubbles: SpeechBubble[];
  isSessionActive: boolean;
  onStartSession: () => void;
  onStopSession: () => void;
  pdfUrl?: string | null;
  currentSlide?: number;
  slideCount?: number;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  renderSlideToCanvas?: (canvas: HTMLCanvasElement) => Promise<void>;
  decks?: Array<{ id: string; name: string; slide_count: number }>;
  selectedDeckId?: string | null;
  onSelectDeck?: (deckId: string | null) => void;
  isLoadingDecks?: boolean;
}

export function SessionCanvas({
  stream,
  isCameraOn,
  isMicOn,
  toggleCamera,
  toggleMic,
  orbState,
  orbIntensity,
  speechBubbles,
  isSessionActive,
  onStartSession,
  onStopSession,
  pdfUrl,
  currentSlide = 1,
  slideCount = 0,
  onNextSlide,
  onPrevSlide,
  renderSlideToCanvas,
  decks,
  selectedDeckId,
  onSelectDeck,
  isLoadingDecks,
}: SessionCanvasProps) {
  const [focusMode, setFocusMode] = useState<'slides' | 'camera'>('slides');

  // In mic-only mode (camera off), always show slides as primary
  const effectiveFocus = !isCameraOn ? 'slides' : focusMode;

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0 min-h-0">
      {/* Main Canvas Area */}
      <div
        className="relative flex-1 rounded-2xl overflow-hidden border min-h-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: `blur(var(--blur-strength))`,
          WebkitBackdropFilter: `blur(var(--blur-strength))`,
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Primary View */}
        {effectiveFocus === 'slides' ? (
          <SlideViewer
            pdfUrl={pdfUrl}
            renderSlideToCanvas={renderSlideToCanvas}
            currentSlide={currentSlide}
            slideCount={slideCount}
            decks={decks}
            selectedDeckId={selectedDeckId}
            onSelectDeck={onSelectDeck}
            isLoadingDecks={isLoadingDecks}
          />
        ) : (
          <CameraView stream={stream} isFocused />
        )}

        {/* Webcam Overlay (bottom-right) — only when camera is on and slides are focused */}
        {isCameraOn && effectiveFocus === 'slides' && (
          <button
            onClick={() => setFocusMode('camera')}
            className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            aria-label="Focus on camera"
          >
            <CameraView stream={stream} isFocused={false} />
          </button>
        )}

        {/* Slide overlay (bottom-right) — when camera is focused */}
        {isCameraOn && effectiveFocus === 'camera' && (
          <button
            onClick={() => setFocusMode('slides')}
            className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            aria-label="Focus on slides"
          >
            <SlideViewerMini pdfUrl={pdfUrl} renderSlideToCanvas={renderSlideToCanvas} currentSlide={currentSlide} />
          </button>
        )}

        {/* SiriBubble (top-right) */}
        {isSessionActive && (
          <div className="absolute top-4 right-4 z-10">
            <SiriBubble state={orbState} intensity={orbIntensity} size="sm" />
          </div>
        )}

        {/* Speech Bubbles */}
        <div className="absolute top-4 right-20 z-10 flex flex-col gap-2 max-w-xs">
          {speechBubbles.map(bubble => (
            <SpeechBubbleChip key={bubble.id} text={bubble.text} />
          ))}
        </div>
      </div>

      {/* Playback & Media Controls Bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-xl border flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: `blur(var(--blur-strength))`,
          WebkitBackdropFilter: `blur(var(--blur-strength))`,
          borderColor: 'var(--border-color)',
        }}
      >
        {/* Left: Media toggles */}
        <div className="flex items-center gap-2">
          <MediaToggle
            icon={isCameraOn ? Video : VideoOff}
            isActive={isCameraOn}
            onClick={toggleCamera}
            label="Camera"
          />
          <MediaToggle
            icon={isMicOn ? Mic : MicOff}
            isActive={isMicOn}
            onClick={toggleMic}
            label="Microphone"
          />
        </div>

        {/* Center: Playback controls */}
        <div className="flex items-center gap-1">
          <ControlButton icon={SkipBack} onClick={() => onPrevSlide?.()} label="Previous slide" size={16} />
          {isSessionActive ? (
            <ControlButton icon={Pause} onClick={onStopSession} label="Pause session" primary />
          ) : (
            <ControlButton icon={Play} onClick={onStartSession} label="Start session" primary />
          )}
          {isSessionActive && (
            <ControlButton icon={Square} onClick={onStopSession} label="Stop session" danger />
          )}
          <ControlButton icon={SkipForward} onClick={() => onNextSlide?.()} label="Next slide" size={16} />
        </div>

        {/* Right: Deck picker or spacer */}
        <div className="flex items-center justify-end" style={{ minWidth: '5rem' }}>
          {decks && decks.length > 0 && onSelectDeck ? (
            <DeckDropdown
              decks={decks}
              selectedDeckId={selectedDeckId ?? null}
              onSelectDeck={onSelectDeck}
              compact
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components --- */

function MediaToggle({
  icon: Icon,
  isActive,
  onClick,
  label,
}: {
  icon: React.ComponentType<{ size?: number }>;
  isActive: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg transition-all duration-200 border"
      style={{
        backgroundColor: isActive ? 'var(--bg-surface)' : 'rgba(239,68,68,0.15)',
        borderColor: isActive ? 'var(--border-color)' : 'rgba(239,68,68,0.3)',
        color: isActive ? 'var(--text-primary)' : '#ef4444',
        backdropFilter: `blur(var(--blur-strength))`,
      }}
      aria-label={label}
    >
      <Icon size={18} />
    </button>
  );
}

function ControlButton({
  icon: Icon,
  onClick,
  label,
  primary,
  danger,
  size = 18,
}: {
  icon: React.ComponentType<{ size?: number; fill?: string }>;
  onClick: () => void;
  label: string;
  primary?: boolean;
  danger?: boolean;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full transition-all duration-200 flex items-center justify-center ${
        primary ? 'p-3' : danger ? 'p-2' : 'p-2'
      }`}
      style={{
        backgroundColor: primary
          ? 'var(--text-primary)'
          : danger
            ? 'rgba(239,68,68,0.15)'
            : 'transparent',
        color: primary
          ? 'var(--bg-primary)'
          : danger
            ? '#ef4444'
            : 'var(--text-secondary)',
      }}
      aria-label={label}
    >
      <Icon size={size} fill={primary ? 'currentColor' : 'none'} />
    </button>
  );
}

function SlideViewer({
  pdfUrl,
  renderSlideToCanvas,
  currentSlide,
  slideCount,
  decks,
  selectedDeckId,
  onSelectDeck,
  isLoadingDecks,
}: {
  pdfUrl?: string | null;
  renderSlideToCanvas?: (canvas: HTMLCanvasElement) => Promise<void>;
  currentSlide: number;
  slideCount: number;
  decks?: Array<{ id: string; name: string; slide_count: number }>;
  selectedDeckId?: string | null;
  onSelectDeck?: (deckId: string | null) => void;
  isLoadingDecks?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !renderSlideToCanvas) return;
    renderSlideToCanvas(canvasRef.current);
  }, [renderSlideToCanvas, currentSlide]);

  if (!pdfUrl) {
    const hasDecks = decks && decks.length > 0;
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Monitor size={48} style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {hasDecks ? 'Select a deck to display' : 'Upload or generate your deck'}
          </p>
          {hasDecks && onSelectDeck ? (
            <DeckDropdown
              decks={decks}
              selectedDeckId={selectedDeckId ?? null}
              onSelectDeck={onSelectDeck}
              isLoading={isLoadingDecks}
            />
          ) : (
            <Link
              href="/deck"
              className="px-4 py-2 rounded-lg text-xs font-medium border transition-colors"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              Upload Slides
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
      {slideCount > 0 && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          {currentSlide} / {slideCount}
        </div>
      )}
    </div>
  );
}

function SlideViewerMini({
  pdfUrl,
  renderSlideToCanvas,
  currentSlide,
}: {
  pdfUrl?: string | null;
  renderSlideToCanvas?: (canvas: HTMLCanvasElement) => Promise<void>;
  currentSlide?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !renderSlideToCanvas) return;
    renderSlideToCanvas(canvasRef.current);
  }, [renderSlideToCanvas, currentSlide]);

  if (!pdfUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Monitor size={24} style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
}

function DeckDropdown({
  decks,
  selectedDeckId,
  onSelectDeck,
  compact,
  isLoading,
}: {
  decks: Array<{ id: string; name: string; slide_count: number }>;
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string | null) => void;
  compact?: boolean;
  isLoading?: boolean;
}) {
  return (
    <select
      value={selectedDeckId ?? ''}
      onChange={(e) => onSelectDeck(e.target.value || null)}
      disabled={isLoading}
      className={`rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
        compact ? 'px-2 py-1 max-w-[8rem] truncate' : 'px-3 py-2'
      }`}
      style={{
        borderColor: 'var(--border-color)',
        color: 'var(--text-secondary)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <option value="">{isLoading ? 'Loading\u2026' : 'No deck'}</option>
      {decks.map((deck) => (
        <option key={deck.id} value={deck.id}>
          {compact
            ? deck.name
            : `${deck.name} (${deck.slide_count} slide${deck.slide_count !== 1 ? 's' : ''})`}
        </option>
      ))}
    </select>
  );
}

function CameraView({
  stream,
  isFocused,
}: {
  stream: MediaStream | null;
  isFocused: boolean;
}) {
  const localRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = localRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {
      // Browser blocked autoplay — will retry on user interaction
    });
  }, [stream]);

  return (
    <video
      ref={localRef}
      autoPlay
      muted
      playsInline
      className={`${isFocused ? 'absolute inset-0' : ''} w-full h-full object-cover`}
      style={{ transform: 'scaleX(-1)' }}
    />
  );
}

function SpeechBubbleChip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className="px-3 py-2 rounded-full text-xs font-medium border transition-all duration-500"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: `blur(var(--blur-strength))`,
        WebkitBackdropFilter: `blur(var(--blur-strength))`,
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
      }}
    >
      {text}
    </div>
  );
}
