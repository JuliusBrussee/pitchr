'use client';

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { SessionCanvas } from '@/views/components/SessionCanvas';
import { MetricsPanel } from '@/views/components/MetricsPanel';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSessionState } from '@/hooks/useSessionState';
import { useTheme } from '@/views/components/ThemeProvider';
import { useSidebarSession } from '@/views/components/SidebarContext';
import { isHeadTrackingDebugEnabled, useHeadTracking } from '@/lib/headTracking/useHeadTracking';

export default function SessionPage() {
  const media = useMediaStream();
  const session = useSessionState();
  const { setOrbState } = useTheme();

  const trackingVideoRef = useRef<HTMLVideoElement | null>(null);
  const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const headTrackingDebugEnabled = useMemo(() => isHeadTrackingDebugEnabled(), []);

  const isTrackingEnabled = session.isSessionActive && media.isCameraOn && !!media.stream;

  const headTracking = useHeadTracking({
    videoRef: trackingVideoRef,
    canvasRef: headTrackingDebugEnabled ? trackingCanvasRef : undefined,
    stream: media.stream,
    enabled: isTrackingEnabled,
    autoStart: true,
    debug: headTrackingDebugEnabled,
  });

  // Sync orb state to ThemeProvider for reactive aura
  useEffect(() => {
    setOrbState(session.orbState);
  }, [session.orbState, setOrbState]);

  const handleSessionToggle = useCallback(() => {
    if (session.isSessionActive) {
      session.stopSession();
    } else {
      session.startSession();
    }
  }, [session.isSessionActive, session.startSession, session.stopSession]);

  // Register session controls with the shared sidebar
  useSidebarSession(handleSessionToggle, session.isSessionActive);

  return (
    <>
      {!headTrackingDebugEnabled ? (
        <video
          ref={trackingVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      <SessionCanvas
        stream={media.stream}
        isCameraOn={media.isCameraOn}
        isMicOn={media.isMicOn}
        toggleCamera={media.toggleCamera}
        toggleMic={media.toggleMic}
        orbState={session.orbState}
        orbIntensity={0.6}
        speechBubbles={session.speechBubbles}
        isSessionActive={session.isSessionActive}
        onStartSession={session.startSession}
        onStopSession={session.stopSession}
        engagementScore={headTracking.engagementScore}
        headTrackingState={headTracking.state}
        showEngagementBubble={isTrackingEnabled}
        headTrackingDebug={
          headTrackingDebugEnabled
            ? {
                enabled: true,
                yaw: headTracking.yaw,
                pitch: headTracking.pitch,
                roll: headTracking.roll,
                facingPct: headTracking.facingPct,
                awayPct: headTracking.awayPct,
                downPct: headTracking.downPct,
                isCalibrated: headTracking.isCalibrated,
                inferenceMs: headTracking.inferenceMs ?? 0,
                effectiveInferIntervalMs: headTracking.effectiveInferIntervalMs ?? 0,
                fps: headTracking.fps ?? 0,
                videoRef: trackingVideoRef,
                canvasRef: trackingCanvasRef,
              }
            : undefined
        }
      />

      <MetricsPanel
        metrics={session.metrics}
        checklist={session.checklist}
        insights={session.insights}
        isSessionActive={session.isSessionActive}
      />
    </>
  );
}
