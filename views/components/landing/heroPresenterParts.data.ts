import type { HeroPresenterPartName } from '@/types/heroPresenterTiles';
import { HERO_PRESENTER_TILE_TUPLES } from '@/views/components/landing/heroPresenterTiles.data';

export const HERO_PRESENTER_PARTS: readonly HeroPresenterPartName[] = [
  'head',
  'torso',
  'leadArm',
  'mic',
  'legs',
  'highlights',
] as const;

const MIC_CENTER = {
  x: 1168,
  y: 360,
  radius: 78,
} as const;

function resolvePart(x: number, y: number, weight: number): HeroPresenterPartName {
  if (y >= 600) {
    return 'legs';
  }

  const micDx = x - MIC_CENTER.x;
  const micDy = y - MIC_CENTER.y;
  if ((micDx * micDx) + (micDy * micDy) <= (MIC_CENTER.radius * MIC_CENTER.radius)) {
    return 'mic';
  }

  if (y <= 260 && x >= 1020 && x <= 1330) {
    return 'head';
  }

  if (x <= 1110 && y >= 230 && y <= 620) {
    return 'leadArm';
  }

  if (weight <= 0.44 && (x >= 1280 || y <= 170 || y >= 640)) {
    return 'highlights';
  }

  return 'torso';
}

export function getHeroPresenterTileSeed(index: number, x: number, y: number) {
  const raw = Math.sin(
    ((index + 1) * 12.9898)
      + (x * 0.01523)
      + (y * 0.00917)
  ) * 43758.5453;

  return raw - Math.floor(raw);
}

export const HERO_PRESENTER_TILE_PARTS = HERO_PRESENTER_TILE_TUPLES.map((tile) =>
  resolvePart(tile[0], tile[1], tile[4])
);

export const HERO_PRESENTER_PART_COUNTS = HERO_PRESENTER_TILE_PARTS.reduce(
  (counts, part) => {
    counts[part] += 1;
    return counts;
  },
  {
    head: 0,
    torso: 0,
    leadArm: 0,
    mic: 0,
    legs: 0,
    highlights: 0,
  } satisfies Record<HeroPresenterPartName, number>
);

export function getHeroPresenterPartByTileIndex(index: number): HeroPresenterPartName {
  return HERO_PRESENTER_TILE_PARTS[index] ?? 'torso';
}
