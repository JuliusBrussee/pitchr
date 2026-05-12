'use client';

import { useRef, useEffect } from 'react';

interface MobileRecordTabProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
  isSessionActive: boolean;
  elapsedSeconds: number;
  currentSlide?: number;
  slideCount?: number;
}

function formatTimer(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MobileRecordTab({
  stream,
  isCameraOn,
  isSessionActive,
  elapsedSeconds,
  currentSlide,
  slideCount,
}: MobileRecordTabProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className="flex-1 rounded-2xl overflow-hidden border relative min-h-0"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        background: isCameraOn
          ? undefined
          : 'linear-gradient(145deg, #0f1724, #111827)',
      }}
    >
      {/* Camera feed */}
      {isCameraOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              background: 'rgba(255,255,255,0.03)',
              border: '1.5px solid rgba(255,255,255,0.08)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
        </div>
      )}

      {/* Floating overlays */}
      {isSessionActive && (
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
          {/* Recording indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{
              color: '#ff5941',
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,89,65,0.2)',
            }}
          >
            <span
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: '#ff5941',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            {formatTimer(elapsedSeconds)}
          </div>

          {/* Slide counter */}
          {slideCount && slideCount > 0 && (
            <div
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                color: 'rgba(255,255,255,0.7)',
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {currentSlide} / {slideCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
