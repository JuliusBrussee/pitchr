'use client';

import { Video, VideoOff, SkipBack, SkipForward, Play, Pause, Square } from 'lucide-react';

interface MobileControlBarProps {
  isCameraOn: boolean;
  toggleCamera: () => void;
  isSessionActive: boolean;
  canStopSession: boolean;
  canStartSession?: boolean;
  onStartSession: () => void;
  onPauseSession: () => void;
  onStopSession: () => void;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  elapsedSeconds?: number;
}

function formatTimer(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MobileControlBar({
  isCameraOn,
  toggleCamera,
  isSessionActive,
  canStopSession,
  canStartSession = true,
  onStartSession,
  onPauseSession,
  onStopSession,
  onNextSlide,
  onPrevSlide,
  elapsedSeconds = 0,
}: MobileControlBarProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 px-3 py-2.5 mx-3 mb-3 rounded-xl border flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Camera toggle */}
      <ControlBtn
        icon={isCameraOn ? Video : VideoOff}
        onClick={toggleCamera}
        active={isCameraOn}
        label={isCameraOn ? 'Camera on' : 'Camera off'}
      />

      {/* Playback controls */}
      <div className="flex items-center gap-1">
        <ControlBtn icon={SkipBack} onClick={() => onPrevSlide?.()} label="Previous slide" />
        {isSessionActive ? (
          <ControlBtn icon={Pause} onClick={onPauseSession} label="Pause" primary />
        ) : (
          <ControlBtn
            icon={Play}
            onClick={onStartSession}
            label="Start"
            primary
            disabled={!canStartSession}
          />
        )}
        {canStopSession && (
          <ControlBtn icon={Square} onClick={onStopSession} label="Stop" danger />
        )}
        <ControlBtn icon={SkipForward} onClick={() => onNextSlide?.()} label="Next slide" />
      </div>

      {/* Timer */}
      <span
        className="text-xs font-medium tabular-nums min-w-[3rem] text-center"
        style={{ color: 'var(--text-secondary)' }}
      >
        {formatTimer(elapsedSeconds)}
      </span>
    </div>
  );
}

function ControlBtn({
  icon: Icon,
  onClick,
  label,
  primary,
  danger,
  active,
  disabled,
}: {
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  label: string;
  primary?: boolean;
  danger?: boolean;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex items-center justify-center rounded-full border"
      style={{
        width: primary ? 40 : 34,
        height: primary ? 40 : 34,
        backgroundColor: primary
          ? 'var(--text-primary)'
          : 'transparent',
        borderColor: danger
          ? 'rgba(239,68,68,0.4)'
          : primary
            ? 'transparent'
            : 'var(--border-color)',
        color: danger
          ? '#ef4444'
          : primary
            ? 'var(--bg-primary)'
            : active
              ? 'var(--text-primary)'
              : 'var(--text-secondary)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Icon size={primary ? 18 : 16} />
    </button>
  );
}
