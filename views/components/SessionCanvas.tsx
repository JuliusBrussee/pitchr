'use client';

import { useState, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, Play, Pause, Square, SkipForward, SkipBack } from 'lucide-react';
import { SiriBubble } from '@/views/components/SiriBubble';
import { OrbState } from '@/views/components/SiriBubble';
import { SpeechBubble } from '@/hooks/useSessionState';

interface SessionCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
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
}

export function SessionCanvas({
  videoRef,
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
          <SlideViewer />
        ) : (
          <CameraView videoRef={videoRef} isFocused />
        )}

        {/* Webcam Overlay (bottom-right) — only when camera is on and slides are focused */}
        {isCameraOn && effectiveFocus === 'slides' && (
          <button
            onClick={() => setFocusMode('camera')}
            className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            aria-label="Focus on camera"
          >
            <CameraView videoRef={videoRef} isFocused={false} />
          </button>
        )}

        {/* Slide overlay (bottom-right) — when camera is focused */}
        {isCameraOn && effectiveFocus === 'camera' && (
          <button
            onClick={() => setFocusMode('slides')}
            className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg transition-transform duration-300 hover:scale-105 cursor-pointer"
            aria-label="Focus on slides"
          >
            <SlideViewerMini />
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
          <ControlButton icon={SkipBack} onClick={() => {}} label="Previous slide" size={16} />
          {isSessionActive ? (
            <ControlButton icon={Pause} onClick={onStopSession} label="Pause session" primary />
          ) : (
            <ControlButton icon={Play} onClick={onStartSession} label="Start session" primary />
          )}
          {isSessionActive && (
            <ControlButton icon={Square} onClick={onStopSession} label="Stop session" danger />
          )}
          <ControlButton icon={SkipForward} onClick={() => {}} label="Next slide" size={16} />
        </div>

        {/* Right: spacer for symmetry */}
        <div className="w-20" />
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
  videoRef,
  isFocused,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isFocused: boolean;
}) {
  return (
    <video
      ref={isFocused ? videoRef : undefined}
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
