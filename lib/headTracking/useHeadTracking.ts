"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  DrawingUtils,
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
  type Matrix,
} from "@mediapipe/tasks-vision";
import {
  BAND_WINDOW_MS,
  classifyEngagementBand,
  type EngagementBandSample,
  type HeadTrackingEngagementBand,
} from "@/lib/headTracking/engagementBand";

export type HeadTrackingState = "facing" | "away" | "down" | "no_face";

export interface HeadTrackingMetrics {
  state: HeadTrackingState;
  yaw: number;
  pitch: number;
  roll: number;
  facingPct: number;
  awayPct: number;
  downPct: number;
  engagementBand: HeadTrackingEngagementBand;
  engagementScore: number;
  isCalibrated: boolean;
  inferenceMs?: number;
  effectiveInferIntervalMs?: number;
  fps?: number;
}

export interface UseHeadTrackingOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef?: RefObject<HTMLCanvasElement | null>;
  debug?: boolean;
  autoStart?: boolean;
  stream?: MediaStream | null;
  enabled?: boolean;
}

interface RollingSample {
  ts: number;
  state: HeadTrackingState;
}

interface PoseEstimate {
  yaw: number;
  pitch: number;
  roll: number;
}

interface FrameBiasEstimate {
  yawBias: number;
  pitchBias: number;
}

interface CalibrationState {
  startTs: number;
  sampleCount: number;
  sumYaw: number;
  sumPitch: number;
  sumRoll: number;
  yaw0: number;
  pitch0: number;
  roll0: number;
  isCalibrated: boolean;
}

interface YawBalanceState {
  positiveMeanAbsYaw: number;
  negativeMeanAbsYaw: number;
  positiveSamples: number;
  negativeSamples: number;
}

interface EngagementBandState {
  band: HeadTrackingEngagementBand;
  pendingBand: HeadTrackingEngagementBand | null;
  pendingSince: number;
  extremePoseSince: number | null;
}

interface PerformanceState {
  inferenceMs: number;
  fps: number;
  prevVideoTsMs: number;
}

interface RollingWindowState {
  samples: RollingSample[];
  head: number;
  counts: Record<HeadTrackingState, number>;
}

const TRACKING_WINDOW_MS = 60_000;
const CALIBRATION_DURATION_MS = 2_000;
const CALIBRATION_TIMEOUT_MS = 4_000;
const MIN_CALIBRATION_SAMPLES = 20;

const INFER_INTERVAL_DEFAULT_MS = 14;
const INFER_INTERVAL_MAX_MS = 33;
const INFER_INTERVAL_STEP_MS = 3;
const INFER_SAMPLES_WINDOW = 20;
const SLOW_INFER_MS = 14;
const RECOVER_INFER_MS = 9;

const UI_INTERVAL_MS = 60;
const METRIC_EPS = 0.002;
const MIN_VIDEO_TIME_STEP_MS = 0.5;
const NO_FACE_GRACE_MS = 220;
const STATE_DWELL_MS = 120;
const YAW_BALANCE_MIN_SAMPLE_DEG = 5;
const YAW_BALANCE_MIN_SIDE_SAMPLES = 14;
const YAW_BALANCE_ALPHA = 0.14;
const YAW_BALANCE_SCALE_MIN = 0.82;
const YAW_BALANCE_SCALE_MAX = 1.22;
const FRAME_BIAS_MAX_DEG = 8;
const FRAME_BIAS_MIN_FACE_WIDTH = 0.08;
const FRAME_BIAS_EYE_Y_CENTER = 0.42;
const FRAME_BIAS_YAW_FACTOR = 2.2;
const FRAME_BIAS_PITCH_FACTOR = 2.6;

const IGNORABLE_INFERENCE_MESSAGES = [
  "created tensorflow lite xnnpack delegate for cpu",
  "info: created tensorflow lite xnnpack delegate for cpu",
];

const THRESH = {
  AWAY_ENTER_DEG: 14,
  AWAY_EXIT_DEG: 10,
  DOWN_ENTER_DEG: 16,
  DOWN_EXIT_DEG: 11,
  UP_ENTER_DEG: 14,
  UP_EXIT_DEG: 10,
  POSE_EMA_ALPHA: 0.45,
  ENGAGEMENT_ALPHA: 0.45,
};

const INITIAL_METRICS: HeadTrackingMetrics = {
  state: "no_face",
  yaw: 0,
  pitch: 0,
  roll: 0,
  facingPct: 0,
  awayPct: 0,
  downPct: 0,
  engagementBand: "no_face",
  engagementScore: 100,
  isCalibrated: false,
  inferenceMs: 0,
  effectiveInferIntervalMs: INFER_INTERVAL_DEFAULT_MS,
  fps: 0,
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clampScore(value: number) {
  return clamp(value, 0, 100);
}

function radToDeg(value: number) {
  return (value * 180) / Math.PI;
}

function newCalibrationState(): CalibrationState {
  return {
    startTs: 0,
    sampleCount: 0,
    sumYaw: 0,
    sumPitch: 0,
    sumRoll: 0,
    yaw0: 0,
    pitch0: 0,
    roll0: 0,
    isCalibrated: false,
  };
}

function newRollingWindowState(): RollingWindowState {
  return {
    samples: [],
    head: 0,
    counts: {
      facing: 0,
      away: 0,
      down: 0,
      no_face: 0,
    },
  };
}

function newYawBalanceState(): YawBalanceState {
  return {
    positiveMeanAbsYaw: 0,
    negativeMeanAbsYaw: 0,
    positiveSamples: 0,
    negativeSamples: 0,
  };
}

function newEngagementBandState(): EngagementBandState {
  return {
    band: "no_face",
    pendingBand: null,
    pendingSince: 0,
    extremePoseSince: null,
  };
}

function resetRollingWindowState(state: RollingWindowState) {
  state.samples = [];
  state.head = 0;
  state.counts.facing = 0;
  state.counts.away = 0;
  state.counts.down = 0;
  state.counts.no_face = 0;
}

function pushRollingSample(window: RollingWindowState, sample: RollingSample) {
  window.samples.push(sample);
  window.counts[sample.state] += 1;
}

function evictOldRollingSamples(window: RollingWindowState, now: number, windowMs = TRACKING_WINDOW_MS) {
  const windowStart = now - windowMs;

  while (window.head < window.samples.length && window.samples[window.head].ts < windowStart) {
    const expired = window.samples[window.head];
    window.counts[expired.state] = Math.max(0, window.counts[expired.state] - 1);
    window.head += 1;
  }

  if (window.head > 1024 && window.head * 2 > window.samples.length) {
    window.samples = window.samples.slice(window.head);
    window.head = 0;
  }
}

function rollingPercentages(window: RollingWindowState) {
  const denom = window.counts.facing + window.counts.away + window.counts.down;
  if (!denom) return { facingPct: 0, awayPct: 0, downPct: 0 };

  return {
    facingPct: Math.round((window.counts.facing / denom) * 100),
    awayPct: Math.round((window.counts.away / denom) * 100),
    downPct: Math.round((window.counts.down / denom) * 100),
  };
}

function approxSameMetrics(a: HeadTrackingMetrics, b: HeadTrackingMetrics) {
  return (
    a.state === b.state &&
    a.isCalibrated === b.isCalibrated &&
    Math.abs(a.yaw - b.yaw) < METRIC_EPS &&
    Math.abs(a.pitch - b.pitch) < METRIC_EPS &&
    Math.abs(a.roll - b.roll) < METRIC_EPS &&
    a.engagementBand === b.engagementBand &&
    a.facingPct === b.facingPct &&
    a.awayPct === b.awayPct &&
    a.downPct === b.downPct &&
    Math.abs(a.engagementScore - b.engagementScore) < 1 &&
    Math.abs((a.inferenceMs ?? 0) - (b.inferenceMs ?? 0)) < 1 &&
    Math.abs((a.fps ?? 0) - (b.fps ?? 0)) < 0.8 &&
    Math.abs((a.effectiveInferIntervalMs ?? 0) - (b.effectiveInferIntervalMs ?? 0)) < 1
  );
}

function matrixToPoseDegrees(matrix: Matrix | undefined): PoseEstimate | null {
  if (!matrix || matrix.data.length < 12) return null;

  const m = matrix.data;
  const r00 = m[0];
  const r01 = m[1];
  const r02 = m[2];
  const r20 = m[8];
  const r21 = m[9];
  const r22 = m[10];

  const pitch = Math.asin(clamp(-r21, -1, 1));

  let yaw: number;
  let roll: number;

  if (Math.abs(r21) < 0.99999) {
    yaw = Math.atan2(r20, r22);
    roll = Math.atan2(r01, r00);
  } else {
    yaw = Math.atan2(-r02, r00);
    roll = 0;
  }

  return {
    yaw: radToDeg(yaw),
    pitch: radToDeg(pitch),
    roll: radToDeg(roll),
  };
}

function heuristicPoseDegrees(result: FaceLandmarkerResult): PoseEstimate | null {
  const lm = result.faceLandmarks?.[0];
  if (!lm || lm.length < 264) return null;

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

  const rollRad = Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x);

  return {
    yaw: yawProxy * 58,
    pitch: pitchProxy * 72,
    roll: -radToDeg(rollRad),
  };
}

function bestPoseEstimate(result: FaceLandmarkerResult): PoseEstimate | null {
  const fromMatrix = matrixToPoseDegrees(result.facialTransformationMatrixes?.[0]);
  const fromHeuristic = heuristicPoseDegrees(result);

  if (fromMatrix && fromHeuristic) {
    const blendedYaw = fromMatrix.yaw * 0.45 + fromHeuristic.yaw * 0.55;
    const blendedPitch = fromMatrix.pitch * 0.35 + fromHeuristic.pitch * 0.65;
    const blendedRoll = fromMatrix.roll * 0.6 + fromHeuristic.roll * 0.4;
    return {
      yaw: blendedYaw,
      pitch: blendedPitch,
      roll: blendedRoll,
    };
  }

  return fromMatrix ?? fromHeuristic;
}

function classifyTargetState(yawDeg: number, pitchDeg: number, currentState: HeadTrackingState): HeadTrackingState {
  const absYaw = Math.abs(yawDeg);
  const upEnter = pitchDeg <= -THRESH.UP_ENTER_DEG;
  const upExit = pitchDeg <= -THRESH.UP_EXIT_DEG;

  if (currentState === "no_face" || currentState === "facing") {
    if (pitchDeg >= THRESH.DOWN_ENTER_DEG) return "down";
    if (upEnter) return "away";
    if (absYaw >= THRESH.AWAY_ENTER_DEG) return "away";
    return "facing";
  }

  if (currentState === "down") {
    if (pitchDeg >= THRESH.DOWN_EXIT_DEG) return "down";
    if (upEnter) return "away";
    if (absYaw >= THRESH.AWAY_ENTER_DEG) return "away";
    return "facing";
  }

  if (pitchDeg >= THRESH.DOWN_ENTER_DEG) return "down";
  if (upExit) return "away";
  if (absYaw >= THRESH.AWAY_EXIT_DEG) return "away";
  return "facing";
}

function instantPoseScore(yawDeg: number, pitchDeg: number) {
  const absYaw = Math.abs(yawDeg);
  const yawPenalty = clamp((absYaw - 2) / 10, 0, 1);
  const downPenalty = clamp((pitchDeg - 1.5) / 9, 0, 1);
  const upPenalty = clamp((Math.abs(Math.min(pitchDeg, 0)) - 1.5) / 8, 0, 1);
  const penalty = Math.max(yawPenalty, downPenalty, upPenalty);
  const shapedPenalty = Math.pow(penalty, 1.15);
  return clampScore((1 - shapedPenalty) * 100);
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function isIgnorableRuntimeMessage(message: string) {
  const normalized = message.trim().toLowerCase();
  return IGNORABLE_INFERENCE_MESSAGES.some((needle) => normalized.includes(needle));
}

function stringifyConsoleArg(arg: unknown): string {
  if (typeof arg === "string") return arg;
  if (arg instanceof Error) return arg.message;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function applyYawBalance(rawYaw: number, state: YawBalanceState) {
  const absYaw = Math.abs(rawYaw);
  if (absYaw < YAW_BALANCE_MIN_SAMPLE_DEG) return rawYaw;

  if (rawYaw >= 0) {
    state.positiveSamples += 1;
    if (state.positiveMeanAbsYaw === 0) {
      state.positiveMeanAbsYaw = absYaw;
    } else {
      state.positiveMeanAbsYaw += YAW_BALANCE_ALPHA * (absYaw - state.positiveMeanAbsYaw);
    }
  } else {
    state.negativeSamples += 1;
    if (state.negativeMeanAbsYaw === 0) {
      state.negativeMeanAbsYaw = absYaw;
    } else {
      state.negativeMeanAbsYaw += YAW_BALANCE_ALPHA * (absYaw - state.negativeMeanAbsYaw);
    }
  }

  if (state.positiveSamples < YAW_BALANCE_MIN_SIDE_SAMPLES || state.negativeSamples < YAW_BALANCE_MIN_SIDE_SAMPLES) {
    return rawYaw;
  }

  const targetMean = (state.positiveMeanAbsYaw + state.negativeMeanAbsYaw) / 2;
  if (targetMean <= 0) return rawYaw;

  const positiveScale = clamp(
    targetMean / Math.max(state.positiveMeanAbsYaw, 1e-4),
    YAW_BALANCE_SCALE_MIN,
    YAW_BALANCE_SCALE_MAX
  );
  const negativeScale = clamp(
    targetMean / Math.max(state.negativeMeanAbsYaw, 1e-4),
    YAW_BALANCE_SCALE_MIN,
    YAW_BALANCE_SCALE_MAX
  );

  return rawYaw >= 0 ? rawYaw * positiveScale : rawYaw * negativeScale;
}

function estimateFrameBias(result: FaceLandmarkerResult): FrameBiasEstimate | null {
  const lm = result.faceLandmarks?.[0];
  if (!lm || lm.length < 264) return null;

  const leftEyeOuter = lm[33];
  const rightEyeOuter = lm[263];
  const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;
  const faceWidth = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
  const normalizedWidth = Math.max(faceWidth, FRAME_BIAS_MIN_FACE_WIDTH);

  const offCenterX = (eyeMidX - 0.5) / normalizedWidth;
  const offCenterY = (eyeMidY - FRAME_BIAS_EYE_Y_CENTER) / normalizedWidth;

  return {
    yawBias: clamp(offCenterX * FRAME_BIAS_YAW_FACTOR, -FRAME_BIAS_MAX_DEG, FRAME_BIAS_MAX_DEG),
    pitchBias: clamp(offCenterY * FRAME_BIAS_PITCH_FACTOR, -FRAME_BIAS_MAX_DEG, FRAME_BIAS_MAX_DEG),
  };
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

async function createFaceLandmarkerWithFallback(filesetResolver: Awaited<ReturnType<typeof getFilesetResolver>>) {
  const baseOptions = {
    modelAssetPath:
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
  };

  const commonOptions = {
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true,
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

async function waitForVideoReady(video: HTMLVideoElement) {
  await new Promise<void>((resolve) => {
    if (video.readyState >= 1) {
      resolve();
      return;
    }

    const onLoadedMetadata = () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      resolve();
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
  });

  try {
    await video.play();
  } catch {
    // Ignore autoplay blocks; frame loop will retry once browser allows playback.
  }

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
}

export function useHeadTracking(options: UseHeadTrackingOptions) {
  const {
    videoRef,
    canvasRef,
    autoStart = true,
    debug: debugOption,
    stream: externalStream,
    enabled = true,
  } = options;

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
  const ownsStreamRef = useRef(false);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);

  const poseEmaRef = useRef({ yaw: 0, pitch: 0, roll: 0, hasPose: false });
  const yawBalanceRef = useRef<YawBalanceState>(newYawBalanceState());
  const engagementEmaRef = useRef({ value: 100, hasValue: false });
  const inferIntervalMsRef = useRef(INFER_INTERVAL_DEFAULT_MS);
  const lastInferTsRef = useRef(0);
  const lastVideoTsMsRef = useRef(-1);
  const inferSamplesRef = useRef<number[]>([]);
  const lastResultsRef = useRef<FaceLandmarkerResult | null>(null);
  const hasFreshResultsRef = useRef(false);
  const lastInferenceErrorRef = useRef<string | null>(null);
  const originalConsoleErrorRef = useRef<typeof console.error | null>(null);

  const performanceRef = useRef<PerformanceState>({
    inferenceMs: 0,
    fps: 0,
    prevVideoTsMs: -1,
  });

  const calibrationRef = useRef<CalibrationState>(newCalibrationState());
  const rollingWindowRef = useRef<RollingWindowState>(newRollingWindowState());
  const bandWindowRef = useRef<RollingWindowState>(newRollingWindowState());
  const engagementBandStateRef = useRef<EngagementBandState>(newEngagementBandState());
  const lastUiUpdateTsRef = useRef(0);
  const lastPublishedRef = useRef<HeadTrackingMetrics>(INITIAL_METRICS);

  const committedStateRef = useRef<HeadTrackingState>("no_face");
  const pendingTransitionRef = useRef<{ state: HeadTrackingState | null; since: number }>({
    state: null,
    since: 0,
  });
  const lastFaceSeenTsRef = useRef(-Infinity);

  const removeConsoleErrorFilter = useCallback(() => {
    if (!originalConsoleErrorRef.current) return;
    console.error = originalConsoleErrorRef.current;
    originalConsoleErrorRef.current = null;
  }, []);

  const installConsoleErrorFilter = useCallback(() => {
    if (originalConsoleErrorRef.current) return;

    const baseConsoleError = console.error;
    originalConsoleErrorRef.current = baseConsoleError;

    console.error = (...args: unknown[]) => {
      const message = args.map(stringifyConsoleArg).join(" ");
      if (isIgnorableRuntimeMessage(message)) {
        if (debugEnabled) {
          console.debug("[headTracking] Suppressed benign MediaPipe console error:", message);
        }
        return;
      }
      baseConsoleError(...args);
    };
  }, [debugEnabled]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    removeConsoleErrorFilter();

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }

    if (streamRef.current && ownsStreamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
    ownsStreamRef.current = false;

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
    lastInferTsRef.current = 0;
    inferIntervalMsRef.current = INFER_INTERVAL_DEFAULT_MS;

    performanceRef.current = {
      inferenceMs: 0,
      fps: 0,
      prevVideoTsMs: -1,
    };

    calibrationRef.current = newCalibrationState();
    resetRollingWindowState(rollingWindowRef.current);
    resetRollingWindowState(bandWindowRef.current);

    poseEmaRef.current = { yaw: 0, pitch: 0, roll: 0, hasPose: false };
    yawBalanceRef.current = newYawBalanceState();
    engagementEmaRef.current = { value: 100, hasValue: false };
    engagementBandStateRef.current = newEngagementBandState();
    committedStateRef.current = "no_face";
    pendingTransitionRef.current = { state: null, since: 0 };
    lastFaceSeenTsRef.current = -Infinity;
    lastInferenceErrorRef.current = null;

    setMetrics(INITIAL_METRICS);
    lastPublishedRef.current = INITIAL_METRICS;
  }, [canvasRef, removeConsoleErrorFilter]);

  const publishMetrics = useCallback((now: number, next: HeadTrackingMetrics) => {
    const last = lastPublishedRef.current;
    const forced = next.state !== last.state || next.isCalibrated !== last.isCalibrated;

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

  const applyStateDwell = useCallback((targetState: HeadTrackingState, now: number) => {
    const currentState = committedStateRef.current;
    if (targetState === currentState) {
      pendingTransitionRef.current = { state: null, since: 0 };
      return currentState;
    }

    if (pendingTransitionRef.current.state !== targetState) {
      pendingTransitionRef.current = { state: targetState, since: now };
      return currentState;
    }

    if (now - pendingTransitionRef.current.since >= STATE_DWELL_MS) {
      committedStateRef.current = targetState;
      pendingTransitionRef.current = { state: null, since: 0 };
      return targetState;
    }

    return currentState;
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
      let streamToUse: MediaStream | null = externalStream ?? null;
      let ownsStream = false;

      if (!streamToUse) {
        streamToUse = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        ownsStream = true;
      }

      if (!streamToUse) {
        setError("No video stream available for head tracking");
        return;
      }

      if (runningRef.current) {
        if (ownsStream) {
          streamToUse.getTracks().forEach((track) => track.stop());
        }
        return;
      }

      streamRef.current = streamToUse;
      ownsStreamRef.current = ownsStream;

      if (video.srcObject !== streamToUse) {
        video.srcObject = streamToUse;
      }

      await waitForVideoReady(video);

      if (debugEnabled && canvasRef?.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctxRef.current = ctx;
          drawingUtilsRef.current = new DrawingUtils(ctx);
        }
      }

      installConsoleErrorFilter();

      const filesetResolver = await getFilesetResolver();
      const landmarker = await createFaceLandmarkerWithFallback(filesetResolver);

      if (runningRef.current) {
        landmarker.close();
        if (ownsStream) {
          streamToUse.getTracks().forEach((track) => track.stop());
        }
        return;
      }

      landmarkerRef.current = landmarker;
      runningRef.current = true;
      setIsRunning(true);

      inferIntervalMsRef.current = INFER_INTERVAL_DEFAULT_MS;
      lastInferTsRef.current = 0;
      lastVideoTsMsRef.current = -1;
      inferSamplesRef.current = [];

      performanceRef.current = {
        inferenceMs: 0,
        fps: 0,
        prevVideoTsMs: -1,
      };

      calibrationRef.current = newCalibrationState();
      resetRollingWindowState(rollingWindowRef.current);
      resetRollingWindowState(bandWindowRef.current);
      poseEmaRef.current = { yaw: 0, pitch: 0, roll: 0, hasPose: false };
      yawBalanceRef.current = newYawBalanceState();
      engagementEmaRef.current = { value: 100, hasValue: false };
      engagementBandStateRef.current = newEngagementBandState();
      committedStateRef.current = "no_face";
      pendingTransitionRef.current = { state: null, since: 0 };
      lastFaceSeenTsRef.current = -Infinity;

      lastUiUpdateTsRef.current = 0;
      lastResultsRef.current = null;
      hasFreshResultsRef.current = false;
      lastInferenceErrorRef.current = null;
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

          const perf = performanceRef.current;
          if (perf.prevVideoTsMs > 0) {
            const frameDelta = Math.max(1, videoTsMs - perf.prevVideoTsMs);
            const instantaneousFps = 1000 / frameDelta;
            perf.fps = perf.fps > 0 ? perf.fps * 0.65 + instantaneousFps * 0.35 : instantaneousFps;
          }
          perf.prevVideoTsMs = videoTsMs;

          lastVideoTsMsRef.current = videoTsMs;
          const inferStart = performance.now();
          try {
            lastResultsRef.current = activeLandmarker.detectForVideo(activeVideo, videoTsMs);
            perf.inferenceMs = performance.now() - inferStart;
            hasFreshResultsRef.current = true;
            updateAdaptiveInferInterval(perf.inferenceMs);

            if (lastInferenceErrorRef.current !== null) {
              lastInferenceErrorRef.current = null;
              setError(null);
            }
          } catch (inferErr) {
            perf.inferenceMs = performance.now() - inferStart;
            hasFreshResultsRef.current = true;
            lastResultsRef.current = null;

            const message = getErrorMessage(inferErr);
            if (isIgnorableRuntimeMessage(message)) {
              if (debugEnabled && lastInferenceErrorRef.current !== "IGNORABLE") {
                console.debug("[headTracking] Ignored MediaPipe runtime message:", message);
              }
              lastInferenceErrorRef.current = "IGNORABLE";
            } else if (lastInferenceErrorRef.current !== message) {
              lastInferenceErrorRef.current = message;
              setError(`Face tracking runtime warning: ${message}`);
              if (debugEnabled) {
                console.warn("[headTracking] Runtime inference warning:", message);
              }
            }
          }
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

        let yawOut = poseEmaRef.current.yaw;
        let pitchOut = poseEmaRef.current.pitch;
        let rollOut = poseEmaRef.current.roll;
        let nextState = committedStateRef.current;
        let isCalibrated = calibrationRef.current.isCalibrated;

        if (results?.faceLandmarks?.length) {
          lastFaceSeenTsRef.current = now;

          const rawPose = bestPoseEstimate(results);
          if (rawPose) {
            const calibration = calibrationRef.current;

            if (!calibration.isCalibrated) {
              if (calibration.sampleCount === 0) {
                calibration.startTs = now;
              }

              // Accept realistic head poses during calibration; avoid overfitting to extreme outliers.
              const reasonablePose = Math.abs(rawPose.yaw) <= 65 && Math.abs(rawPose.pitch) <= 50;
              if (reasonablePose) {
                calibration.sampleCount += 1;
                calibration.sumYaw += rawPose.yaw;
                calibration.sumPitch += rawPose.pitch;
                calibration.sumRoll += rawPose.roll;

                calibration.yaw0 = calibration.sumYaw / calibration.sampleCount;
                calibration.pitch0 = calibration.sumPitch / calibration.sampleCount;
                calibration.roll0 = calibration.sumRoll / calibration.sampleCount;
              }

              const elapsed = now - calibration.startTs;
              if (elapsed >= CALIBRATION_DURATION_MS && calibration.sampleCount >= MIN_CALIBRATION_SAMPLES) {
                calibration.isCalibrated = true;
              } else if (elapsed >= CALIBRATION_TIMEOUT_MS && calibration.sampleCount >= 6) {
                calibration.isCalibrated = true;
              }
            }

            const adjustedYaw = rawPose.yaw - calibration.yaw0;
            const adjustedPitch = rawPose.pitch - calibration.pitch0;
            const adjustedRoll = rawPose.roll - calibration.roll0;
            const frameBias = estimateFrameBias(results);
            const compensatedYaw = frameBias ? adjustedYaw - frameBias.yawBias : adjustedYaw;
            const compensatedPitch = frameBias ? adjustedPitch - frameBias.pitchBias : adjustedPitch;
            const balancedYaw = applyYawBalance(compensatedYaw, yawBalanceRef.current);

            const poseEma = poseEmaRef.current;
            if (!poseEma.hasPose) {
              poseEma.yaw = balancedYaw;
              poseEma.pitch = compensatedPitch;
              poseEma.roll = adjustedRoll;
              poseEma.hasPose = true;
            } else {
              poseEma.yaw = THRESH.POSE_EMA_ALPHA * balancedYaw + (1 - THRESH.POSE_EMA_ALPHA) * poseEma.yaw;
              poseEma.pitch = THRESH.POSE_EMA_ALPHA * compensatedPitch + (1 - THRESH.POSE_EMA_ALPHA) * poseEma.pitch;
              poseEma.roll = THRESH.POSE_EMA_ALPHA * adjustedRoll + (1 - THRESH.POSE_EMA_ALPHA) * poseEma.roll;
            }

            yawOut = poseEma.yaw;
            pitchOut = poseEma.pitch;
            rollOut = poseEma.roll;
            isCalibrated = calibration.isCalibrated;

            const targetState = classifyTargetState(yawOut, pitchOut, committedStateRef.current);
            nextState = applyStateDwell(targetState, now);
          }

          if (shouldDraw && drawingUtils) {
            drawingUtils.drawConnectors(results.faceLandmarks[0], FaceLandmarker.FACE_LANDMARKS_TESSELATION, { lineWidth: 1 });
          }
        } else {
          const sinceFaceMs = now - lastFaceSeenTsRef.current;
          if (sinceFaceMs > NO_FACE_GRACE_MS) {
            committedStateRef.current = "no_face";
            pendingTransitionRef.current = { state: null, since: 0 };
            nextState = "no_face";
          }
        }

        if (shouldInfer) {
          pushRollingSample(rollingWindowRef.current, { ts: now, state: nextState });
          pushRollingSample(bandWindowRef.current, { ts: now, state: nextState });
          evictOldRollingSamples(rollingWindowRef.current, now, TRACKING_WINDOW_MS);
          evictOldRollingSamples(bandWindowRef.current, now, BAND_WINDOW_MS);
          const rolling = rollingPercentages(rollingWindowRef.current);
          const shortWindowSamples = bandWindowRef.current.samples.slice(
            bandWindowRef.current.head
          ) as EngagementBandSample[];

          const bandState = engagementBandStateRef.current;
          const bandResult = classifyEngagementBand({
            now,
            state: nextState,
            yaw: yawOut,
            pitch: pitchOut,
            samples: shortWindowSamples,
            previousBand: bandState.band,
            pendingBand: bandState.pendingBand,
            pendingSince: bandState.pendingSince,
            extremePoseSince: bandState.extremePoseSince,
            windowMs: BAND_WINDOW_MS,
          });

          engagementBandStateRef.current = {
            band: bandResult.band,
            pendingBand: bandResult.pendingBand,
            pendingSince: bandResult.pendingSince,
            extremePoseSince: bandResult.extremePoseSince,
          };

          const poseScore = instantPoseScore(yawOut, pitchOut);
          const windowScore = rolling.facingPct;
          const targetEngagement =
            nextState === "no_face"
              ? engagementEmaRef.current.value
              : clampScore(poseScore * 0.4 + windowScore * 0.3 + bandResult.blendedAttention * 0.3);

          const engagementEma = engagementEmaRef.current;
          if (!engagementEma.hasValue) {
            engagementEma.value = targetEngagement;
            engagementEma.hasValue = true;
          } else {
            engagementEma.value =
              THRESH.ENGAGEMENT_ALPHA * targetEngagement + (1 - THRESH.ENGAGEMENT_ALPHA) * engagementEma.value;
          }

          publishMetrics(now, {
            state: nextState,
            yaw: yawOut,
            pitch: pitchOut,
            roll: rollOut,
            facingPct: rolling.facingPct,
            awayPct: rolling.awayPct,
            downPct: rolling.downPct,
            engagementBand: bandResult.band,
            engagementScore: Math.round(clampScore(engagementEma.value)),
            isCalibrated,
            inferenceMs: performanceRef.current.inferenceMs,
            effectiveInferIntervalMs: inferIntervalMsRef.current,
            fps: performanceRef.current.fps,
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
  }, [
    applyStateDwell,
    canvasRef,
    debugEnabled,
    externalStream,
    installConsoleErrorFilter,
    publishMetrics,
    stop,
    updateAdaptiveInferInterval,
    videoRef,
  ]);

  useEffect(() => {
    if (!autoStart) return;

    if (enabled) {
      void start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [autoStart, enabled, start, stop]);

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
