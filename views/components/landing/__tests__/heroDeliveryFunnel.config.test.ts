import { describe, expect, it } from 'vitest';
import {
  DEFAULT_POWER_MAPPING,
  DELIVERY_WAVE_BARS,
  FUNNEL_PHASES,
  mapDeliveryPower,
  resolveTileDensityTier,
} from '@/views/components/landing/heroDeliveryFunnel.config';

describe('heroDeliveryFunnel.config', () => {
  it('keeps phase boundaries ordered and clamped', () => {
    const ranges = Object.values(FUNNEL_PHASES);
    expect(ranges[0].start).toBe(0);
    expect(ranges[ranges.length - 1].end).toBe(1);
    for (const range of ranges) {
      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeLessThanOrEqual(1);
      expect(range.start).toBeLessThan(range.end);
    }
  });

  it('keeps the waveform bar definitions stable', () => {
    expect(DELIVERY_WAVE_BARS).toHaveLength(18);
    for (const bar of DELIVERY_WAVE_BARS) {
      expect(bar.x).toBeGreaterThanOrEqual(0);
      expect(bar.y).toBeGreaterThanOrEqual(0);
      expect(bar.h).toBeGreaterThan(0);
    }
  });

  it('uses the full tile set on high-end desktop', () => {
    const density = resolveTileDensityTier({
      tileCount: 1201,
      viewportWidth: 1366,
      deviceMemory: 16,
      hardwareConcurrency: 12,
    });

    expect(density.tier).toBe('max');
    expect(density.targetCount).toBe(1201);
  });

  it('caps tile count on constrained desktop and mobile', () => {
    const desktop = resolveTileDensityTier({
      tileCount: 1201,
      viewportWidth: 1280,
      deviceMemory: 4,
      hardwareConcurrency: 4,
    });
    expect(desktop.tier).toBe('balanced');
    expect(desktop.targetCount).toBe(820);

    const mobile = resolveTileDensityTier({
      tileCount: 1201,
      viewportWidth: 430,
      deviceMemory: 4,
      hardwareConcurrency: 4,
    });
    expect(mobile.tier).toBe('mobile');
    expect(mobile.targetCount).toBe(320);
  });

  it('maps delivery power from 0 to 1', () => {
    const start = mapDeliveryPower(0);
    const mid = mapDeliveryPower(0.5);
    const end = mapDeliveryPower(1);

    expect(start.power).toBe(0);
    expect(end.power).toBe(1);
    expect(mid.power).toBeCloseTo(0.5, 6);
    expect(end.amp).toBeCloseTo(
      DEFAULT_POWER_MAPPING.ampBase + DEFAULT_POWER_MAPPING.ampSpan,
      6
    );
    expect(end.amp).toBeLessThanOrEqual(0.85);
    expect(end.amp).toBeCloseTo(0.82, 6);
    expect(start.speed).toBeCloseTo(1.15, 6);
    expect(end.speed).toBeCloseTo(0.9, 6);
  });
});
