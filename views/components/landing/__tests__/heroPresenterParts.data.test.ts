import { describe, expect, it } from 'vitest';
import type { HeroPresenterPartName } from '@/types/heroPresenterTiles';
import { HERO_PRESENTER_TILE_TUPLES } from '@/views/components/landing/heroPresenterTiles.data';
import {
  HERO_PRESENTER_PARTS,
  HERO_PRESENTER_PART_COUNTS,
  HERO_PRESENTER_TILE_PARTS,
  getHeroPresenterPartByTileIndex,
  getHeroPresenterTileSeed,
} from '@/views/components/landing/heroPresenterParts.data';

describe('heroPresenterParts.data', () => {
  it('maps every presenter tile to one semantic part', () => {
    expect(HERO_PRESENTER_TILE_PARTS).toHaveLength(HERO_PRESENTER_TILE_TUPLES.length);

    const allowed = new Set(HERO_PRESENTER_PARTS);
    for (const part of HERO_PRESENTER_TILE_PARTS) {
      expect(allowed.has(part)).toBe(true);
    }
  });

  it('covers all six semantic groups with stable counts', () => {
    for (const part of HERO_PRESENTER_PARTS) {
      expect(HERO_PRESENTER_PART_COUNTS[part]).toBeGreaterThan(0);
    }

    expect(HERO_PRESENTER_PART_COUNTS.head).toBeGreaterThanOrEqual(150);
    expect(HERO_PRESENTER_PART_COUNTS.torso).toBeGreaterThanOrEqual(350);
    expect(HERO_PRESENTER_PART_COUNTS.leadArm).toBeGreaterThanOrEqual(200);
    expect(HERO_PRESENTER_PART_COUNTS.mic).toBeGreaterThanOrEqual(80);
    expect(HERO_PRESENTER_PART_COUNTS.legs).toBeGreaterThanOrEqual(120);
    expect(HERO_PRESENTER_PART_COUNTS.highlights).toBeGreaterThanOrEqual(20);
  });

  it('returns a deterministic seed for every tile', () => {
    for (let index = 0; index < HERO_PRESENTER_TILE_TUPLES.length; index += 1) {
      const [x, y] = HERO_PRESENTER_TILE_TUPLES[index];
      const seedA = getHeroPresenterTileSeed(index, x, y);
      const seedB = getHeroPresenterTileSeed(index, x, y);
      expect(seedA).toBe(seedB);
      expect(seedA).toBeGreaterThanOrEqual(0);
      expect(seedA).toBeLessThan(1);
    }
  });

  it('falls back to torso for out-of-range tile indices', () => {
    expect(getHeroPresenterPartByTileIndex(0)).toBeTypeOf('string');
    expect(getHeroPresenterPartByTileIndex(HERO_PRESENTER_TILE_PARTS.length + 5)).toBe(
      'torso' satisfies HeroPresenterPartName
    );
  });
});
