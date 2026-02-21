import { describe, it, expect } from 'vitest';
import { COLOR_MAP, ANIMATION_MAP, SIZE_MAP, DEFAULTS } from '../constants';
import { OrbState } from '../types';

const ALL_STATES: OrbState[] = ['idle', 'active', 'positive', 'negative', 'neutral'];

describe('COLOR_MAP', () => {
  it('has entries for all orb states', () => {
    ALL_STATES.forEach((state) => {
      expect(COLOR_MAP[state]).toBeDefined();
      expect(COLOR_MAP[state].primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(COLOR_MAP[state].secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('has distinct colors per state', () => {
    const primaries = ALL_STATES.map((s) => COLOR_MAP[s].primary);
    expect(new Set(primaries).size).toBe(ALL_STATES.length);
  });
});

describe('ANIMATION_MAP', () => {
  it('has entries for all orb states', () => {
    ALL_STATES.forEach((state) => {
      expect(ANIMATION_MAP[state]).toBeDefined();
      expect(ANIMATION_MAP[state].speed).toBeGreaterThan(0);
      expect(ANIMATION_MAP[state].displacement).toBeGreaterThan(0);
    });
  });

  it('idle is the slowest state', () => {
    const idleSpeed = ANIMATION_MAP.idle.speed;
    ALL_STATES.filter((s) => s !== 'idle').forEach((state) => {
      expect(ANIMATION_MAP[state].speed).toBeGreaterThanOrEqual(idleSpeed);
    });
  });
});

describe('SIZE_MAP', () => {
  it('has expected size presets', () => {
    expect(SIZE_MAP.sm).toBe(64);
    expect(SIZE_MAP.md).toBe(128);
    expect(SIZE_MAP.lg).toBe(256);
    expect(SIZE_MAP.xl).toBe(512);
  });

  it('sizes are in ascending order', () => {
    expect(SIZE_MAP.sm).toBeLessThan(SIZE_MAP.md);
    expect(SIZE_MAP.md).toBeLessThan(SIZE_MAP.lg);
    expect(SIZE_MAP.lg).toBeLessThan(SIZE_MAP.xl);
  });
});

describe('DEFAULTS', () => {
  it('intensity is between 0 and 1', () => {
    expect(DEFAULTS.intensity).toBeGreaterThanOrEqual(0);
    expect(DEFAULTS.intensity).toBeLessThanOrEqual(1);
  });

  it('opacity is between 0 and 1', () => {
    expect(DEFAULTS.opacity).toBeGreaterThanOrEqual(0);
    expect(DEFAULTS.opacity).toBeLessThanOrEqual(1);
  });

  it('breatheAmplitude is small (under 10%)', () => {
    expect(DEFAULTS.breatheAmplitude).toBeLessThan(0.1);
  });
});
