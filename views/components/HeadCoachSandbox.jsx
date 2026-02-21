"use client";

import React, { useRef } from "react";
import { useHeadTracking } from "@/lib/headTracking/useHeadTracking";

function toLabel(state) {
  if (state === "facing") return "Facing";
  if (state === "away") return "Away";
  if (state === "down") return "Down";
  return "No face";
}

export default function HeadCoachSandbox() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    state,
    engagementScore,
    yaw,
    pitch,
    facingPct,
    awayPct,
    downPct,
    debugEnabled,
    isRunning,
    error,
    start,
    stop,
  } = useHeadTracking({
    videoRef,
    canvasRef,
    autoStart: true,
  });

  return (
    <div style={{ padding: 16, maxWidth: 860, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ marginBottom: 8 }}>Head Tracking Engine Example</h2>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Current state: <strong>{toLabel(state)}</strong>
      </p>

      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Engagement Score</div>
        <div style={{ fontSize: 32, lineHeight: 1 }}>{engagementScore}</div>
      </div>

      {!isRunning ? (
        <button type="button" onClick={start} style={{ marginRight: 8 }}>
          Start Tracking
        </button>
      ) : null}

      {isRunning ? (
        <button type="button" onClick={stop} style={{ marginRight: 8 }}>
          Stop Tracking
        </button>
      ) : null}

      {error ? (
        <div style={{ marginTop: 8, color: "#b91c1c" }}>
          Tracking error: {error}
        </div>
      ) : null}

      {debugEnabled ? (
        <>
          <p style={{ marginTop: 16, marginBottom: 8, opacity: 0.8 }}>
            Debug mode enabled (`?debug=1` or `NEXT_PUBLIC_HEAD_TRACKING_DEBUG=1`)
          </p>

          <div style={{ position: "relative", width: "100%", maxWidth: 820, marginBottom: 12 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", borderRadius: 12, background: "#111" }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
          </div>

          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <div>yaw: {yaw.toFixed(3)}</div>
            <div>pitch: {pitch.toFixed(3)}</div>
            <div>facingPct (60s): {facingPct}%</div>
            <div>awayPct (60s): {awayPct}%</div>
            <div>downPct (60s): {downPct}%</div>
          </div>
        </>
      ) : (
        // Tracking still needs an attached video element when debug visuals are off.
        <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", left: -9999, width: 1, height: 1 }} />
      )}
    </div>
  );
}
