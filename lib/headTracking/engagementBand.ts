export type EngagementTrackingState = 'facing' | 'away' | 'down' | 'no_face';

export type HeadTrackingEngagementBand =
  | 'good'
  | 'could_improve'
  | 'bad'
  | 'no_face';

export interface EngagementBandSample {
  ts: number;
  state: EngagementTrackingState;
}

export interface ClassifyEngagementBandInput {
  now: number;
  state: EngagementTrackingState;
  yaw: number;
  pitch: number;
  samples: EngagementBandSample[];
  previousBand: HeadTrackingEngagementBand;
  pendingBand: HeadTrackingEngagementBand | null;
  pendingSince: number;
  extremePoseSince: number | null;
  windowMs?: number;
}

export interface ClassifyEngagementBandResult {
  band: HeadTrackingEngagementBand;
  pendingBand: HeadTrackingEngagementBand | null;
  pendingSince: number;
  extremePoseSince: number | null;
  poseAttention: number;
  rollingAttention: number;
  blendedAttention: number;
}

export const BAND_WINDOW_MS = 4_000;
export const BAND_DWELL_MS = 180;

const BAD_ENTER = 45;
const BAD_EXIT = 52;
const COULD_IMPROVE_ENTER = 72;
const COULD_IMPROVE_EXIT = 78;

const YAW_STRONG_START = 8;
const YAW_STRONG_MAX = 22;
const DOWN_STRONG_START = 10;
const DOWN_STRONG_MAX = 24;
const UP_STRONG_START = 10;
const UP_STRONG_MAX = 22;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isExtremePose(yaw: number, pitch: number) {
  return Math.abs(yaw) >= YAW_STRONG_MAX || pitch >= DOWN_STRONG_MAX || pitch <= -UP_STRONG_MAX;
}

function getDesiredBand(blendedAttention: number, previousBand: HeadTrackingEngagementBand) {
  if (previousBand === 'bad') {
    if (blendedAttention <= BAD_EXIT) return 'bad';
    if (blendedAttention < COULD_IMPROVE_ENTER) return 'could_improve';
    return 'good';
  }

  if (previousBand === 'could_improve') {
    if (blendedAttention < BAD_ENTER) return 'bad';
    if (blendedAttention <= COULD_IMPROVE_EXIT) return 'could_improve';
    return 'good';
  }

  if (blendedAttention < BAD_ENTER) return 'bad';
  if (blendedAttention < COULD_IMPROVE_ENTER) return 'could_improve';
  return 'good';
}

export function computePoseAttention(yaw: number, pitch: number) {
  const absYaw = Math.abs(yaw);

  const yawPenalty = clamp(
    (absYaw - YAW_STRONG_START) / Math.max(1, YAW_STRONG_MAX - YAW_STRONG_START),
    0,
    1
  );
  const downPenalty = clamp(
    (pitch - DOWN_STRONG_START) / Math.max(1, DOWN_STRONG_MAX - DOWN_STRONG_START),
    0,
    1
  );
  const upPenalty = clamp(
    ((-pitch) - UP_STRONG_START) / Math.max(1, UP_STRONG_MAX - UP_STRONG_START),
    0,
    1
  );

  const penalty = Math.max(yawPenalty, downPenalty, upPenalty);
  return (1 - penalty) * 100;
}

export function computeRollingAttention(samples: EngagementBandSample[], now: number, windowMs = BAND_WINDOW_MS) {
  const windowStart = now - windowMs;
  let facing = 0;
  let away = 0;
  let down = 0;

  for (const sample of samples) {
    if (sample.ts < windowStart) continue;

    if (sample.state === 'facing') {
      facing += 1;
    } else if (sample.state === 'away') {
      away += 1;
    } else if (sample.state === 'down') {
      down += 1;
    }
  }

  const denom = facing + away + down;
  if (!denom) return 100;

  return (facing / denom) * 100;
}

export function classifyEngagementBand(
  input: ClassifyEngagementBandInput
): ClassifyEngagementBandResult {
  const poseAttention = computePoseAttention(input.yaw, input.pitch);
  const rollingAttention = computeRollingAttention(input.samples, input.now, input.windowMs ?? BAND_WINDOW_MS);
  const blendedAttention = rollingAttention * 0.6 + poseAttention * 0.4;

  if (input.state === 'no_face') {
    return {
      band: 'no_face',
      pendingBand: null,
      pendingSince: 0,
      extremePoseSince: null,
      poseAttention,
      rollingAttention,
      blendedAttention,
    };
  }

  const extremeNow = isExtremePose(input.yaw, input.pitch);
  const nextExtremeSince = extremeNow
    ? (input.extremePoseSince ?? input.now)
    : null;

  const forcedBad =
    nextExtremeSince != null &&
    input.now - nextExtremeSince >= BAND_DWELL_MS;

  let desiredBand: HeadTrackingEngagementBand;
  if (forcedBad) {
    desiredBand = 'bad';
  } else {
    desiredBand = getDesiredBand(blendedAttention, input.previousBand);
  }

  if (desiredBand === input.previousBand) {
    return {
      band: input.previousBand,
      pendingBand: null,
      pendingSince: 0,
      extremePoseSince: nextExtremeSince,
      poseAttention,
      rollingAttention,
      blendedAttention,
    };
  }

  if (forcedBad && desiredBand === 'bad') {
    return {
      band: 'bad',
      pendingBand: null,
      pendingSince: 0,
      extremePoseSince: nextExtremeSince,
      poseAttention,
      rollingAttention,
      blendedAttention,
    };
  }

  if (input.pendingBand !== desiredBand) {
    return {
      band: input.previousBand,
      pendingBand: desiredBand,
      pendingSince: input.now,
      extremePoseSince: nextExtremeSince,
      poseAttention,
      rollingAttention,
      blendedAttention,
    };
  }

  if (input.now - input.pendingSince >= BAND_DWELL_MS) {
    return {
      band: desiredBand,
      pendingBand: null,
      pendingSince: 0,
      extremePoseSince: nextExtremeSince,
      poseAttention,
      rollingAttention,
      blendedAttention,
    };
  }

  return {
    band: input.previousBand,
    pendingBand: input.pendingBand,
    pendingSince: input.pendingSince,
    extremePoseSince: nextExtremeSince,
    poseAttention,
    rollingAttention,
    blendedAttention,
  };
}
