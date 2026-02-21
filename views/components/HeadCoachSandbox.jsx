"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

const THRESH = {
  YAW_OK: 0.1,
  YAW_AWAY: 0.18,
  PITCH_DOWN: 0.12,
  EMA_ALPHA: 0.25,
  MIN_FACE: 1,
};

const LABELS = {
  facing: "Facing camera",
  away: "Looking away",
  down: "Looking down",
  noFace: "No face detected (check lighting / camera)",
};

const INFER_INTERVAL_DEFAULT_MS = 33;
const INFER_INTERVAL_MAX_MS = 50;
const INFER_INTERVAL_STEP_MS = 5;
const UI_INTERVAL_MS = 250;
const INFER_SAMPLES_WINDOW = 20;
const SLOW_INFER_MS = 28;
const RECOVER_INFER_MS = 20;
const METRIC_EPS = 0.002;

function areMetricsClose(a, b) {
  return (
    Math.abs(a.yaw - b.yaw) < METRIC_EPS &&
    Math.abs(a.pitch - b.pitch) < METRIC_EPS &&
    a.seconds === b.seconds &&
    a.facingPct === b.facingPct &&
    a.awayPct === b.awayPct &&
    a.downPct === b.downPct
  );
}

export default function HeadCoachSandbox() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  const ctxRef = useRef(null);
  const drawingUtilsRef = useRef(null);

  const emaRef = useRef({ yaw: 0, pitch: 0, hasInit: false });

  const [status, setStatus] = useState("Initializing...");
  const [metrics, setMetrics] = useState({
    yaw: 0,
    pitch: 0,
    facingPct: 0,
    awayPct: 0,
    downPct: 0,
    seconds: 0,
  });

  const sessionRef = useRef({
    startTs: null,
    facing: 0,
    away: 0,
    down: 0,
    total: 0,
  });

  const lastInferTsRef = useRef(0);
  const lastDrawTsRef = useRef(0);
  const inferIntervalMsRef = useRef(INFER_INTERVAL_DEFAULT_MS);
  const lastResultsRef = useRef(null);
  const hasFreshResultsRef = useRef(false);

  const inferSamplesRef = useRef([]);

  const lastUiUpdateTsRef = useRef(0);
  const lastStatusRef = useRef("Initializing...");
  const lastMetricsRef = useRef(metrics);

  useEffect(() => {
    let cancelled = false;

    function setStatusIfChanged(nextStatus) {
      if (lastStatusRef.current !== nextStatus) {
        lastStatusRef.current = nextStatus;
        setStatus(nextStatus);
      }
    }

    function updateAdaptiveInferInterval(sampleMs) {
      const samples = inferSamplesRef.current;
      samples.push(sampleMs);
      if (samples.length > INFER_SAMPLES_WINDOW) samples.shift();
      const avg = samples.reduce((sum, x) => sum + x, 0) / samples.length;

      if (avg > SLOW_INFER_MS && inferIntervalMsRef.current < INFER_INTERVAL_MAX_MS) {
        inferIntervalMsRef.current = Math.min(
          INFER_INTERVAL_MAX_MS,
          inferIntervalMsRef.current + INFER_INTERVAL_STEP_MS
        );
      } else if (avg < RECOVER_INFER_MS && inferIntervalMsRef.current > INFER_INTERVAL_DEFAULT_MS) {
        inferIntervalMsRef.current = Math.max(
          INFER_INTERVAL_DEFAULT_MS,
          inferIntervalMsRef.current - INFER_INTERVAL_STEP_MS
        );
      }
    }

    function maybeUpdateUi(now, nextMetrics) {
      if (now - lastUiUpdateTsRef.current < UI_INTERVAL_MS) return;
      lastUiUpdateTsRef.current = now;

      if (!areMetricsClose(lastMetricsRef.current, nextMetrics)) {
        lastMetricsRef.current = nextMetrics;
        setMetrics(nextMetrics);
      }
    }

    function ensureCanvasSize(video, canvas) {
      const targetW = video.videoWidth;
      const targetH = video.videoHeight;
      if (!targetW || !targetH) return false;

      let resized = false;
      if (canvas.width !== targetW) {
        canvas.width = targetW;
        resized = true;
      }
      if (canvas.height !== targetH) {
        canvas.height = targetH;
        resized = true;
      }
      return resized;
    }

    function loop() {
      if (cancelled) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      const ctx = ctxRef.current;
      const drawingUtils = drawingUtilsRef.current;
      if (!video || !canvas || !landmarker || !ctx || !drawingUtils) return;

      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      const resized = ensureCanvasSize(video, canvas);

      const shouldInfer = now - lastInferTsRef.current >= inferIntervalMsRef.current;
      if (shouldInfer) {
        lastInferTsRef.current = now;
        const inferStart = performance.now();
        lastResultsRef.current = landmarker.detectForVideo(video, now);
        hasFreshResultsRef.current = true;
        updateAdaptiveInferInterval(performance.now() - inferStart);
      }

      const results = lastResultsRef.current;
      const shouldDraw =
        resized ||
        (hasFreshResultsRef.current && now - lastDrawTsRef.current >= inferIntervalMsRef.current);

      if (shouldDraw) {
        lastDrawTsRef.current = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      let label = LABELS.noFace;

      if (results?.faceLandmarks?.length >= THRESH.MIN_FACE) {
        const lm = results.faceLandmarks[0];
        const nose = lm[1];
        const leftEyeOuter = lm[33];
        const rightEyeOuter = lm[263];
        const chin = lm[152];
        const forehead = lm[10];

        const dLeft = Math.abs(nose.x - leftEyeOuter.x);
        const dRight = Math.abs(rightEyeOuter.x - nose.x);
        const denom = dLeft + dRight + 1e-6;
        const yawProxy = (dRight - dLeft) / denom;

        const faceHeight = Math.abs(chin.y - forehead.y) + 1e-6;
        const noseRel = (nose.y - forehead.y) / faceHeight;
        const pitchProxy = noseRel - 0.52;

        const ema = emaRef.current;
        if (!ema.hasInit) {
          ema.yaw = yawProxy;
          ema.pitch = pitchProxy;
          ema.hasInit = true;
        } else {
          const a = THRESH.EMA_ALPHA;
          ema.yaw = a * yawProxy + (1 - a) * ema.yaw;
          ema.pitch = a * pitchProxy + (1 - a) * ema.pitch;
        }

        const yaw = ema.yaw;
        const pitch = ema.pitch;
        const absYaw = Math.abs(yaw);

        const state = pitch > THRESH.PITCH_DOWN ? "down" : absYaw > THRESH.YAW_AWAY ? "away" : "facing";
        label = LABELS[state];

        const s = sessionRef.current;
        s.total += 1;
        if (state === "facing") s.facing += 1;
        if (state === "away") s.away += 1;
        if (state === "down") s.down += 1;

        if (shouldDraw) {
          drawingUtils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { lineWidth: 1 });
        }

        const elapsedSec = Math.floor((now - s.startTs) / 1000);
        const total = s.total || 1;
        maybeUpdateUi(now, {
          yaw,
          pitch,
          seconds: elapsedSec,
          facingPct: Math.round((s.facing / total) * 100),
          awayPct: Math.round((s.away / total) * 100),
          downPct: Math.round((s.down / total) * 100),
        });
      } else {
        if (shouldDraw && !resized) {
          // clear stale overlay when face disappears between inferences
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      setStatusIfChanged(label);
      hasFreshResultsRef.current = false;
      rafRef.current = requestAnimationFrame(loop);
    }

    async function setup() {
      try {
        setStatusIfChanged("Requesting webcam...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) return;

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => resolve();
        });
        if (cancelled) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) {
          throw new Error("Canvas 2D context unavailable");
        }
        ctxRef.current = ctx;
        drawingUtilsRef.current = new DrawingUtils(ctx);

        setStatusIfChanged("Loading face model...");
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (cancelled) return;
        landmarkerRef.current = faceLandmarker;

        sessionRef.current.startTs = performance.now();
        lastInferTsRef.current = 0;
        lastDrawTsRef.current = 0;
        lastUiUpdateTsRef.current = 0;
        inferIntervalMsRef.current = INFER_INTERVAL_DEFAULT_MS;
        inferSamplesRef.current = [];

        setStatusIfChanged("Running...");
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error(err);
        setStatusIfChanged("Error: " + (err?.message ?? String(err)));
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      lastResultsRef.current = null;
      drawingUtilsRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ marginBottom: 8 }}>Head Coach Sandbox (MVP)</h2>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Live webcam head tracking using MediaPipe Face Landmarker. This is an isolated test component.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 900 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Live Status</div>
            <div style={{ fontSize: 18 }}>{status}</div>
            <div style={{ marginTop: 8, opacity: 0.8, fontSize: 13 }}>
              yaw(proxy): {metrics.yaw.toFixed(3)} | pitch(proxy): {metrics.pitch.toFixed(3)} | time: {metrics.seconds}s
            </div>
          </div>

          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Session Stats</div>
            <div>Facing: {metrics.facingPct}%</div>
            <div>Looking away: {metrics.awayPct}%</div>
            <div>Looking down: {metrics.downPct}%</div>
            <div style={{ marginTop: 8, opacity: 0.8, fontSize: 13 }}>
              (Counts update continuously; you can make this a fixed 60s window later.)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
