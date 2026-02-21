'use client';

import { useState, useEffect, useRef, type ComponentType } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
} from 'lucide-react';
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
  hasSessionStarted: boolean;
  isPaused: boolean;
  isAnalyzing?: boolean;
  onStartSession: () => void;
  onPauseSession: () => void;
  onEndSession: () => void;
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
  hasSessionStarted,
  isPaused,
  isAnalyzing = false,
  onStartSession,
  onPauseSession,
  onEndSession,
}: SessionCanvasProps) {
  const [focusMode, setFocusMode] = useState<'slides' | 'camera'>('slides');

  const effectiveFocus = !isCameraOn ? 'slides' : focusMode;

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0 min-h-0">
      <div
        className="relative flex-1 rounded-2xl overflow-hidden border min-h-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
        }}
      >
        {effectiveFocus === 'slides' ? <SlideViewer /> : <CameraView stream={stream} isFocused />}

        {isCameraOn && effectiveFocus === 'slides' && (
          <button
            onClick={() => setFocusMode('camera')}
            className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            aria-label="Focus on camera"
          >
            <CameraView stream={stream} isFocused={false} />
          </button>
        )}

        {isCameraOn && effectiveFocus === 'camera' && (
          <button
            onClick={() => setFocusMode('slides')}
            className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            aria-label="Focus on slides"
          >
            <SlideViewerMini />
          </button>
        )}

        {(isSessionActive || isAnalyzing) && (
          <div className="absolute top-4 right-4 z-10">
            <SiriBubble state={orbState} intensity={orbIntensity} size="sm" />
          </div>
        )}

        <div className="absolute top-4 right-20 z-10 flex flex-col gap-2 max-w-xs">
          {speechBubbles.map((bubble) => (
            <SpeechBubbleChip key={bubble.id} text={bubble.text} />
          ))}
        </div>
      </div>

      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-xl border flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: 'blur(var(--blur-strength))',
          WebkitBackdropFilter: 'blur(var(--blur-strength))',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-2">
          <MediaToggle
            icon={isCameraOn ? Video : VideoOff}
            isActive={isCameraOn}
            onClick={toggleCamera}
            label="Camera"
            disabled={isAnalyzing}
          />
          <MediaToggle
            icon={isMicOn ? Mic : MicOff}
            isActive={isMicOn}
            onClick={toggleMic}
            label="Microphone"
            disabled={isAnalyzing}
          />
        </div>

        <div className="flex items-center gap-1">
          <ControlButton
            icon={SkipBack}
            onClick={() => {}}
            label="Previous slide"
            size={16}
            disabled={isAnalyzing}
          />
          {isSessionActive ? (
            <ControlButton
              icon={Pause}
              onClick={onPauseSession}
              label="Pause session"
              primary
              disabled={isAnalyzing}
            />
          ) : (
            <ControlButton
              icon={Play}
              onClick={onStartSession}
              label={isAnalyzing ? 'Analyzing pitch' : isPaused ? 'Resume session' : 'Start session'}
              primary
              disabled={isAnalyzing}
            />
          )}
          {hasSessionStarted && (
            <ControlButton
              icon={Square}
              onClick={onEndSession}
              label="End session"
              danger
              disabled={isAnalyzing}
            />
          )}
          <ControlButton
            icon={SkipForward}
            onClick={() => {}}
            label="Next slide"
            size={16}
            disabled={isAnalyzing}
          />
        </div>

        <div className="w-20" />
      </div>
    </div>
  );
}

function MediaToggle({
  icon: Icon,
  isActive,
  onClick,
  label,
  disabled,
}: {
  icon: ComponentType<{ size?: number }>;
  isActive: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-lg transition-all duration-200 border"
      style={{
        backgroundColor: isActive ? 'var(--bg-surface)' : 'rgba(239,68,68,0.15)',
        borderColor: isActive ? 'var(--border-color)' : 'rgba(239,68,68,0.3)',
        color: isActive ? 'var(--text-primary)' : '#ef4444',
        backdropFilter: 'blur(var(--blur-strength))',
        opacity: disabled ? 0.6 : 1,
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
  disabled,
}: {
  icon: ComponentType<{ size?: number; fill?: string }>;
  onClick: () => void;
  label: string;
  primary?: boolean;
  danger?: boolean;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full transition-all duration-200 flex items-center justify-center ${
        primary ? 'p-3' : danger ? 'p-2' : 'p-2'
      }`}
      style={{
        backgroundColor: primary
          ? 'var(--text-primary)'
          : danger
            ? 'rgba(239,68,68,0.15)'
            : 'transparent',
        color: primary ? 'var(--bg-primary)' : danger ? '#ef4444' : 'var(--text-secondary)',
        opacity: disabled ? 0.6 : 1,
      }}
      aria-label={label}
    >
      <Icon size={size} fill={primary ? 'currentColor' : 'none'} />
    </button>
  );
}

function SlideViewer() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Monitor size={48} style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          Upload or generate your deck
        </p>
        <button
          className="px-4 py-2 rounded-lg text-xs font-medium border transition-colors"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          Upload Slides
        </button>
      </div>
    </div>
  );
}

function SlideViewerMini() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Monitor size={24} style={{ color: 'var(--text-muted)' }} />
    </div>
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
      // Browser blocked autoplay, retry on next interaction.
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
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
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
