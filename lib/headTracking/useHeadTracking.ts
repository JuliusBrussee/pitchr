"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  DrawingUtils,
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

export type HeadTrackingState = "facing" | "away" | "down" | "no_face";

export interface HeadTrackingMetrics {
  state: HeadTrackingState;
  yaw: number;
  pitch: number;
  facingPct: number;
  awayPct: number;
  downPct: number;
  engagementScore: number;
}

export interface UseHeadTrackingOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef?: RefObject<HTMLCanvasElement | null>;
  debug?: boolean;
  autoStart?: boolean;
}

interface RollingSample {
  ts: number;
  state: HeadTrackingState;
}

const TRACKING_WINDOW_MS = 60_000;
const INFER_INTERVAL_DEFAULT_MS = 33;
const INFER_INTERVAL_MAX_MS = 50;
const INFER_INTERVAL_STEP_MS = 5;
const INFER_SAMPLES_WINDOW = 20;
const SLOW_INFER_MS = 28;
const RECOVER_INFER_MS = 20;
const UI_INTERVAL_MS = 120;
const METRIC_EPS = 0.002;
const MIN_VIDEO_TIME_STEP_MS = 0.5;

const THRESH = {
  YAW_AWAY: 0.18,
  PITCH_DOWN: 0.12,
  EMA_ALPHA: 0.25,
  ENGAGEMENT_ALPHA: 0.2,
};

const INITIAL_METRICS: HeadTrackingMetrics = {
  state: "no_face",
  yaw: 0,
  pitch: 0,
  facingPct: 0,
  awayPct: 0,
  downPct: 0,
  engagementScore: 100,
};

let filesetResolverPromise: ReturnType<typeof FilesetResolver.forVisionTasks> | null = null;

function getFilesetResolver() {
  if (!filesetResolverPromise) {
    filesetResolverPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
  }
  return filesetResolverPromise;
}

function resolveHeadTrackingDebugFlag() {
  const envDebug =
    process.env.NEXT_PUBLIC_HEAD_TRACKING_DEBUG === "1" ||
    process.env.NEXT_PUBLIC_HEAD_TRACKING_DEBUG === "true";

  if (typeof window === "undefined") return envDebug;

  const query = new URLSearchParams(window.location.search).get("debug");
  if (query === "1" || query === "true") return true;

  return envDebug;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

async function createFaceLandmarkerWithFallback(filesetResolver: Awaited<ReturnType<typeof getFilesetResolver>>) {
  const baseOptions = {
    modelAssetPath:
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
  };

  const commonOptions = {
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    runningMode: "VIDEO" as const,
    numFaces: 1,
    minFaceDetectionConfidence: 0.35,
    minFacePresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,
  };

  try {
    return await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: { ...baseOptions, delegate: "GPU" },
      ...commonOptions,
    });
  } catch {
    return FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: { ...baseOptions, delegate: "CPU" },
      ...commonOptions,
    });
  }
}

function ensureCanvasSize(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
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

function approxSameMetrics(a: HeadTrackingMetrics, b: HeadTrackingMetrics) {
  return (
    a.state === b.state &&
    Math.abs(a.yaw - b.yaw) < METRIC_EPS &&
    Math.abs(a.pitch - b.pitch) < METRIC_EPS &&
    a.facingPct === b.facingPct &&
    a.awayPct === b.awayPct &&
    a.downPct === b.downPct &&
    Math.abs(a.engagementScore - b.engagementScore) < 1
  );
}

function getRollingPercentages(samples: RollingSample[], now: number) {
  // Keep only the last 60 seconds to compute true rolling percentages.
  const windowStart = now - TRACKING_WINDOW_MS;
  while (samples.length && samples[0].ts < windowStart) {
    samples.shift();
  }

  let facing = 0;
  let away = 0;
  let down = 0;

  for (const sample of samples) {
    if (sample.state === "facing") facing += 1;
    if (sample.state === "away") away += 1;
    if (sample.state === "down") down += 1;
  }

  const denom = facing + away + down;
  if (!denom) return { facingPct: 0, awayPct: 0, downPct: 0 };

  return {
    facingPct: Math.round((facing / denom) * 100),
    awayPct: Math.round((away / denom) * 100),
    downPct: Math.round((down / denom) * 100),
  };
}

export function useHeadTracking(options: UseHeadTrackingOptions) {
  const { videoRef, canvasRef, autoStart = true, debug: debugOption } = options;

  const debugEnabled = useMemo(
    () => (typeof debugOption === "boolean" ? debugOption : resolveHeadTrackingDebugFlag()),
    [debugOption]
  );

  const [metrics, setMetrics] = useState<HeadTrackingMetrics>(INITIAL_METRICS);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);

  const emaRef = useRef({ yaw: 0, pitch: 0, engagement: 100, hasPose: false, hasEngagement: false });
  const inferIntervalMsRef = useRef(INFER_INTERVAL_DEFAULT_MS);
  const lastInferTsRef = useRef(0);
  const lastVideoTsMsRef = useRef(-1);
  const inferSamplesRef = useRef<number[]>([]);
  const lastResultsRef = useRef<FaceLandmarkerResult | null>(null);
  const hasFreshResultsRef = useRef(false);

  const lastUiUpdateTsRef = useRef(0);
  const lastPublishedRef = useRef<HeadTrackingMetrics>(INITIAL_METRICS);
  const rollingSamplesRef = useRef<RollingSample[]>([]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const canvas = canvasRef?.current;
    if (canvas && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctxRef.current = null;
    drawingUtilsRef.current = null;
    lastResultsRef.current = null;
    hasFreshResultsRef.current = false;
    inferSamplesRef.current = [];
    lastVideoTsMsRef.current = -1;
    rollingSamplesRef.current = [];
    emaRef.current = { yaw: 0, pitch: 0, engagement: 100, hasPose: false, hasEngagement: false };
    setMetrics(INITIAL_METRICS);
    lastPublishedRef.current = INITIAL_METRICS;
  }, [canvasRef]);

  const publishMetrics = useCallback((now: number, next: HeadTrackingMetrics) => {
    const last = lastPublishedRef.current;
    const forced = next.state !== last.state;

    if (!forced && now - lastUiUpdateTsRef.current < UI_INTERVAL_MS) return;
    if (!forced && approxSameMetrics(last, next)) return;

    lastUiUpdateTsRef.current = now;
    lastPublishedRef.current = next;
    setMetrics(next);
  }, []);

  const updateAdaptiveInferInterval = useCallback((sampleMs: number) => {
    const samples = inferSamplesRef.current;
    samples.push(sampleMs);
    if (samples.length > INFER_SAMPLES_WINDOW) samples.shift();

    const avg = samples.reduce((sum, value) => sum + value, 0) / samples.length;

    if (avg > SLOW_INFER_MS && inferIntervalMsRef.current < INFER_INTERVAL_MAX_MS) {
      inferIntervalMsRef.current = Math.min(INFER_INTERVAL_MAX_MS, inferIntervalMsRef.current + INFER_INTERVAL_STEP_MS);
    } else if (avg < RECOVER_INFER_MS && inferIntervalMsRef.current > INFER_INTERVAL_DEFAULT_MS) {
      inferIntervalMsRef.current = Math.max(INFER_INTERVAL_DEFAULT_MS, inferIntervalMsRef.current - INFER_INTERVAL_STEP_MS);
    }
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;

    const video = videoRef.current;
    if (!video) {
      setError("videoRef is not attached to a <video> element");
      return;
    }

    setError(null);
    setMetrics(INITIAL_METRICS);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (runningRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) {
          resolve();
          return;
        }
        video.onloadedmetadata = () => resolve();
      });
      await video.play();

      await new Promise<void>((resolve) => {
        const waitForDimensions = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            resolve();
            return;
          }
          requestAnimationFrame(waitForDimensions);
        };
        waitForDimensions();
      });

      if (debugEnabled && canvasRef?.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctxRef.current = ctx;
          drawingUtilsRef.current = new DrawingUtils(ctx);
        }
      }

      const filesetResolver = await getFilesetResolver();
      const landmarker = await createFaceLandmarkerWithFallback(filesetResolver);

      if (runningRef.current) {
        landmarker.close();
        return;
      }

      landmarkerRef.current = landmarker;
      runningRef.current = true;
      setIsRunning(true);

      inferIntervalMsRef.current = INFER_INTERVAL_DEFAULT_MS;
      lastInferTsRef.current = 0;
      lastVideoTsMsRef.current = -1;
      lastUiUpdateTsRef.current = 0;
      inferSamplesRef.current = [];
      rollingSamplesRef.current = [];
      lastResultsRef.current = null;
      hasFreshResultsRef.current = false;
      emaRef.current = { yaw: 0, pitch: 0, engagement: 100, hasPose: false, hasEngagement: false };
      lastPublishedRef.current = INITIAL_METRICS;

      const frameLoop = () => {
        if (!runningRef.current) return;

        const activeVideo = videoRef.current;
        const activeLandmarker = landmarkerRef.current;
        if (!activeVideo || !activeLandmarker) {
          rafRef.current = requestAnimationFrame(frameLoop);
          return;
        }

        if (activeVideo.readyState < 2) {
          rafRef.current = requestAnimationFrame(frameLoop);
          return;
        }

        const now = performance.now();
        const videoTsMs = activeVideo.currentTime * 1000;
        const hasNewVideoFrame = videoTsMs - lastVideoTsMsRef.current > MIN_VIDEO_TIME_STEP_MS;
        const shouldInfer = hasNewVideoFrame && now - lastInferTsRef.current >= inferIntervalMsRef.current;

        if (shouldInfer) {
          lastInferTsRef.current = now;
          lastVideoTsMsRef.current = videoTsMs;
          const inferStart = performance.now();
          lastResultsRef.current = activeLandmarker.detectForVideo(activeVideo, videoTsMs);
          hasFreshResultsRef.current = true;
          updateAdaptiveInferInterval(performance.now() - inferStart);
        }

        const results = lastResultsRef.current;

        const canvas = canvasRef?.current ?? null;
        const ctx = ctxRef.current;
        const drawingUtils = drawingUtilsRef.current;
        const resized = debugEnabled && canvas ? ensureCanvasSize(activeVideo, canvas) : false;
        const shouldDraw = debugEnabled && !!canvas && !!ctx && !!drawingUtils && (resized || hasFreshResultsRef.current);

        if (shouldDraw && ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        let nextState: HeadTrackingState = "no_face";
        let nextYaw = emaRef.current.yaw;
        let nextPitch = emaRef.current.pitch;

        if (results?.faceLandmarks?.length) {
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
          if (!ema.hasPose) {
            ema.yaw = yawProxy;
            ema.pitch = pitchProxy;
            ema.hasPose = true;
          } else {
            ema.yaw = THRESH.EMA_ALPHA * yawProxy + (1 - THRESH.EMA_ALPHA) * ema.yaw;
            ema.pitch = THRESH.EMA_ALPHA * pitchProxy + (1 - THRESH.EMA_ALPHA) * ema.pitch;
          }

          nextYaw = ema.yaw;
          nextPitch = ema.pitch;
          nextState = nextPitch > THRESH.PITCH_DOWN ? "down" : Math.abs(nextYaw) > THRESH.YAW_AWAY ? "away" : "facing";

          if (shouldDraw && drawingUtils) {
            drawingUtils.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { lineWidth: 1 });
          }
        }

        if (shouldInfer) {
          rollingSamplesRef.current.push({ ts: now, state: nextState });
          const rolling = getRollingPercentages(rollingSamplesRef.current, now);

          // Penalize "away" and "down" time to derive a simple engagement score.
          const rawEngagement = clampScore(100 - rolling.awayPct * 0.7 - rolling.downPct);
          const ema = emaRef.current;
          if (!ema.hasEngagement) {
            ema.engagement = rawEngagement;
            ema.hasEngagement = true;
          } else {
            ema.engagement = THRESH.ENGAGEMENT_ALPHA * rawEngagement + (1 - THRESH.ENGAGEMENT_ALPHA) * ema.engagement;
          }

          publishMetrics(now, {
            state: nextState,
            yaw: nextYaw,
            pitch: nextPitch,
            facingPct: rolling.facingPct,
            awayPct: rolling.awayPct,
            downPct: rolling.downPct,
            engagementScore: Math.round(clampScore(ema.engagement)),
          });
        }

        hasFreshResultsRef.current = false;
        rafRef.current = requestAnimationFrame(frameLoop);
      };

      rafRef.current = requestAnimationFrame(frameLoop);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      stop();
    }
  }, [canvasRef, debugEnabled, publishMetrics, stop, updateAdaptiveInferInterval, videoRef]);

  useEffect(() => {
    if (!autoStart) return;
    void start();

    return () => {
      stop();
    };
  }, [autoStart, start, stop]);

  return {
    ...metrics,
    debugEnabled,
    isRunning,
    error,
    start,
    stop,
  };
}

export function isHeadTrackingDebugEnabled() {
  return resolveHeadTrackingDebugFlag();
}
