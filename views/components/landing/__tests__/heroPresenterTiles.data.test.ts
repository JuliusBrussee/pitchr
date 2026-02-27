import { describe, expect, it } from 'vitest';
import {
  HERO_PRESENTER_SOURCE_HEIGHT,
  HERO_PRESENTER_SOURCE_WIDTH,
  HERO_PRESENTER_TILE_SIZE,
  HERO_PRESENTER_TILE_TUPLES,
} from '@/views/components/landing/heroPresenterTiles.data';

describe('heroPresenterTiles.data', () => {
  it('contains the expected tile count', () => {
    expect(HERO_PRESENTER_TILE_TUPLES).toHaveLength(1201);
  });

  it('has unique tile coordinates', () => {
    const keys = HERO_PRESENTER_TILE_TUPLES.map(([x, y]) => `${x},${y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps each tile inside source bounds', () => {
    for (const [x, y] of HERO_PRESENTER_TILE_TUPLES) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + HERO_PRESENTER_TILE_SIZE).toBeLessThanOrEqual(HERO_PRESENTER_SOURCE_WIDTH);
      expect(y + HERO_PRESENTER_TILE_SIZE).toBeLessThanOrEqual(HERO_PRESENTER_SOURCE_HEIGHT);
    }
  });

  it('stores light and dark hex colors for every tile', () => {
    const hexColor = /^#[0-9a-f]{6}$/i;
    for (const [, , lightFill, darkFill, weight] of HERO_PRESENTER_TILE_TUPLES) {
      expect(hexColor.test(lightFill)).toBe(true);
      expect(hexColor.test(darkFill)).toBe(true);
      expect(weight).toBeGreaterThan(0);
      expect(weight).toBeLessThanOrEqual(1);
    }
  });
});
