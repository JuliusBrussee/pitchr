'use client';

import { useState, useEffect, useRef, type RefObject } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, Play, Pause, Square, SkipForward, SkipBack } from 'lucide-react';
import { SiriBubble, type OrbState } from '@/views/components/SiriBubble';
import { SpeechBubble } from '@/hooks/useSessionState';
import { EngagementBubble } from '@/views/components/EngagementBubble';
import type { HeadTrackingState } from '@/lib/headTracking/useHeadTracking';

interface HeadTrackingDebugData {
  enabled: boolean;
  yaw: number;
  pitch: number;
  roll: number;
  facingPct: number;
  awayPct: number;
  downPct: number;
  isCalibrated: boolean;
  inferenceMs: number;
  effectiveInferIntervalMs: number;
  fps: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

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
  engagementScore: number;
  headTrackingState: HeadTrackingState;
  showEngagementBubble: boolean;
  headTrackingDebug?: HeadTrackingDebugData;
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
  engagementScore,
  headTrackingState,
  showEngagementBubble,
  headTrackingDebug,
}: SessionCanvasProps) {
  const [focusMode, setFocusMode] = useState<'slides' | 'camera'>('slides');

  // In mic-only mode (camera off), always show slides as primary
  const effectiveFocus = !isCameraOn ? 'slides' : focusMode;

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0 min-h-0">
      <div
        className="relative flex-1 rounded-2xl overflow-hidden border min-h-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: `blur(var(--blur-strength))`,
          WebkitBackdropFilter: `blur(var(--blur-strength))`,
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

        <div className="absolute top-4 right-4 z-10 flex max-w-xs flex-col items-end gap-2">
          {isSessionActive ? (
            <div className="flex items-center gap-2">
              <SiriBubble state={orbState} intensity={orbIntensity} size="sm" />
              <EngagementBubble
                score={engagementScore}
                state={headTrackingState}
                visible={showEngagementBubble}
              />
            </div>
          ) : null}

          {speechBubbles.length > 0 ? (
            <div className="flex flex-col items-end gap-2">
              {speechBubbles.map((bubble) => (
                <SpeechBubbleChip key={bubble.id} text={bubble.text} />
              ))}
            </div>
          ) : null}
        </div>

        {headTrackingDebug?.enabled ? (
          <div
            className="absolute left-4 top-4 z-10 w-56 rounded-xl border p-2"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              backdropFilter: `blur(var(--blur-strength))`,
              WebkitBackdropFilter: `blur(var(--blur-strength))`,
            }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Head Tracking Debug
            </div>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
              <video
                ref={headTrackingDebug.videoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas
                ref={headTrackingDebug.canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              <span>calibrated:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.isCalibrated ? 'yes' : 'no'}</span>
              <span>yaw:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.yaw.toFixed(3)}</span>
              <span>pitch:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.pitch.toFixed(3)}</span>
              <span>roll:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.roll.toFixed(3)}</span>
              <span>facing:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.facingPct}%</span>
              <span>away:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.awayPct}%</span>
              <span>down:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.downPct}%</span>
              <span>infer ms:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.inferenceMs.toFixed(1)}</span>
              <span>interval:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.effectiveInferIntervalMs.toFixed(1)}ms</span>
              <span>fps:</span>
              <span className="tabular-nums text-right">{headTrackingDebug.fps.toFixed(1)}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-xl border flex-shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          backdropFilter: `blur(var(--blur-strength))`,
          WebkitBackdropFilter: `blur(var(--blur-strength))`,
          borderColor: 'var(--border-color)',
        }}
      >
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
      // Browser blocked autoplay; will retry on interaction.
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
