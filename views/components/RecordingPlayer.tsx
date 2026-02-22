'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Play, Video } from 'lucide-react';

export interface RecordingPlayerHandle {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
}

interface RecordingPlayerProps {
  recordingUrl?: string;
  compact?: boolean;
  seekToSec?: number | null;
  onTimeUpdate?: (seconds: number) => void;
}

export const RecordingPlayer = forwardRef<RecordingPlayerHandle, RecordingPlayerProps>(
  function RecordingPlayer(
    { recordingUrl, compact = false, seekToSec, onTimeUpdate }: RecordingPlayerProps,
    ref,
  ) {
    const [expanded, setExpanded] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const seekTo = (seconds: number) => {
      if (!videoRef.current || !Number.isFinite(seconds) || seconds < 0) return;
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    };

    useImperativeHandle(
      ref,
      () => ({
        seekTo,
        getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      }),
      [],
    );

    useEffect(() => {
      if (seekToSec === null || seekToSec === undefined) return;
      seekTo(seekToSec);
    }, [seekToSec]);

    if (!recordingUrl) return null;

    if (compact) {
      return (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors"
            style={{
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-color)',
              backgroundColor: expanded ? 'var(--bg-surface-hover)' : 'transparent',
            }}
          >
            <Play size={10} fill="currentColor" />
            Recording
          </button>
          {expanded && (
            <div
              className="mt-2 rounded-xl overflow-hidden border"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <video
                ref={videoRef}
                src={recordingUrl}
                controls
                className="w-full max-h-48"
                style={{ backgroundColor: '#000' }}
                onTimeUpdate={() => {
                  if (!videoRef.current || !onTimeUpdate) return;
                  onTimeUpdate(videoRef.current.currentTime);
                }}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <section
        className="rounded-2xl border p-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Video size={14} style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Recording
          </h3>
        </div>
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
          <video
            ref={videoRef}
            src={recordingUrl}
            controls
            className="w-full"
            style={{ backgroundColor: '#000', maxHeight: '400px' }}
            onTimeUpdate={() => {
              if (!videoRef.current || !onTimeUpdate) return;
              onTimeUpdate(videoRef.current.currentTime);
            }}
          />
        </div>
      </section>
    );
  },
);
