import { describe, expect, it } from 'vitest';
import {
  BAND_DWELL_MS,
  BAND_WINDOW_MS,
  classifyEngagementBand,
  computePoseAttention,
  computeRollingAttention,
  type EngagementBandSample,
} from '@/lib/headTracking/engagementBand';

function makeSamples(
  now: number,
  counts: { facing: number; away: number; down?: number }
): EngagementBandSample[] {
  const samples: EngagementBandSample[] = [];
  const downCount = counts.down ?? 0;
  const total = counts.facing + counts.away + downCount;
  const step = Math.max(1, Math.floor(BAND_WINDOW_MS / Math.max(1, total)));
  let ts = now - BAND_WINDOW_MS + step;

  for (let i = 0; i < counts.facing; i += 1) {
    samples.push({ ts, state: 'facing' });
    ts += step;
  }
  for (let i = 0; i < counts.away; i += 1) {
    samples.push({ ts, state: 'away' });
    ts += step;
  }
  for (let i = 0; i < downCount; i += 1) {
    samples.push({ ts, state: 'down' });
    ts += step;
  }

  return samples;
}

describe('engagementBand classifier', () => {
  it('returns good for centered facing posture', () => {
    const now = 10_000;
    const samples = makeSamples(now, { facing: 18, away: 2 });

    const result = classifyEngagementBand({
      now,
      state: 'facing',
      yaw: 1,
      pitch: 1,
      samples,
      previousBand: 'good',
      pendingBand: null,
      pendingSince: 0,
      extremePoseSince: null,
    });

    expect(result.band).toBe('good');
    expect(result.poseAttention).toBeGreaterThan(90);
    expect(result.rollingAttention).toBeGreaterThan(85);
  });

  it('transitions to could_improve after dwell on moderate sustained turn', () => {
    const now = 20_000;
    const samples = makeSamples(now, { facing: 13, away: 7 });

    const first = classifyEngagementBand({
      now,
      state: 'facing',
      yaw: 12,
      pitch: 0,
      samples,
      previousBand: 'good',
      pendingBand: null,
      pendingSince: 0,
      extremePoseSince: null,
    });

    expect(first.band).toBe('good');
    expect(first.pendingBand).toBe('could_improve');

    const second = classifyEngagementBand({
      now: now + BAND_DWELL_MS + 1,
      state: 'facing',
      yaw: 12,
      pitch: 0,
      samples,
      previousBand: first.band,
      pendingBand: first.pendingBand,
      pendingSince: first.pendingSince,
      extremePoseSince: first.extremePoseSince,
    });

    expect(second.band).toBe('could_improve');
  });

  it('forces bad for sustained extreme yaw', () => {
    const now = 30_000;
    const samples = makeSamples(now, { facing: 19, away: 1 });

    const first = classifyEngagementBand({
      now,
      state: 'facing',
      yaw: 23,
      pitch: 0,
      samples,
      previousBand: 'could_improve',
      pendingBand: null,
      pendingSince: 0,
      extremePoseSince: null,
    });

    expect(first.band).toBe('could_improve');
    expect(first.extremePoseSince).toBe(now);

    const second = classifyEngagementBand({
      now: now + BAND_DWELL_MS + 1,
      state: 'facing',
      yaw: 23,
      pitch: 0,
      samples,
      previousBand: first.band,
      pendingBand: first.pendingBand,
      pendingSince: first.pendingSince,
      extremePoseSince: first.extremePoseSince,
    });

    expect(second.band).toBe('bad');
    expect(second.pendingBand).toBeNull();
  });

  it('prioritizes no_face over previous band', () => {
    const now = 40_000;
    const samples = makeSamples(now, { facing: 20, away: 0 });

    const result = classifyEngagementBand({
      now,
      state: 'no_face',
      yaw: 0,
      pitch: 0,
      samples,
      previousBand: 'good',
      pendingBand: 'bad',
      pendingSince: now - 100,
      extremePoseSince: now - 200,
    });

    expect(result.band).toBe('no_face');
    expect(result.pendingBand).toBeNull();
    expect(result.extremePoseSince).toBeNull();
  });

  it('holds could_improve inside hysteresis band and avoids flicker', () => {
    const now = 50_000;
    const samples = makeSamples(now, { facing: 16, away: 4 });

    const result = classifyEngagementBand({
      now,
      state: 'facing',
      yaw: 12,
      pitch: 0,
      samples,
      previousBand: 'could_improve',
      pendingBand: null,
      pendingSince: 0,
      extremePoseSince: null,
    });

    expect(result.band).toBe('could_improve');
    expect(result.blendedAttention).toBeGreaterThanOrEqual(72);
    expect(result.blendedAttention).toBeLessThanOrEqual(78);
  });
});

describe('engagementBand helpers', () => {
  it('computes rolling attention from facing ratio', () => {
    const now = 60_000;
    const samples = makeSamples(now, { facing: 15, away: 5, down: 0 });
    expect(Math.round(computeRollingAttention(samples, now))).toBe(75);
  });

  it('drops pose attention for strong up/down/away poses', () => {
    const centered = computePoseAttention(0, 0);
    const away = computePoseAttention(22, 0);
    const up = computePoseAttention(0, -22);
    const down = computePoseAttention(0, 24);

    expect(centered).toBeGreaterThan(95);
    expect(away).toBe(0);
    expect(up).toBe(0);
    expect(down).toBe(0);
  });
});
