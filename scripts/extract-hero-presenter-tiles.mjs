#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const lightPath = path.join(repoRoot, 'public', 'hero-bg-light.png');
const darkPath = path.join(repoRoot, 'public', 'hero-bg.png');
const outputPath = path.join(repoRoot, 'views', 'components', 'landing', 'heroPresenterTiles.data.ts');

if (!existsSync(lightPath) || !existsSync(darkPath)) {
  throw new Error('Expected hero background files at public/hero-bg-light.png and public/hero-bg.png.');
}

const pythonProgram = `
import json
import sys
from PIL import Image
import numpy as np

light = np.array(Image.open(sys.argv[1]).convert('RGB'))
dark = np.array(Image.open(sys.argv[2]).convert('RGB'))

step = 10
tile_size = 7
offset_x = 0
offset_y = 4
x_min, x_max = 830, 1410
y_min, y_max = 80, 840
occupancy_threshold = 0.34

r = light[:, :, 0].astype(float)
g = light[:, :, 1].astype(float)
b = light[:, :, 2].astype(float)
mx = np.maximum.reduce([r, g, b])
mn = np.minimum.reduce([r, g, b])
saturation = (mx - mn) / (mx + 1e-6)

orange = (
    (r > 220) &
    (g > 100) &
    (g < 230) &
    (b < 140) &
    (saturation > 0.25)
)

start_x = offset_x + ((x_min - offset_x + step - 1) // step) * step
start_y = offset_y + ((y_min - offset_y + step - 1) // step) * step

def to_hex(rgb):
    return '#%02x%02x%02x' % tuple(int(round(v)) for v in rgb)

tiles = []

for y in range(start_y, y_max - tile_size + 1, step):
    for x in range(start_x, x_max - tile_size + 1, step):
        occupancy = float(orange[y:y + tile_size, x:x + tile_size].mean())
        if occupancy <= occupancy_threshold:
            continue
        light_patch = light[y:y + tile_size, x:x + tile_size].reshape(-1, 3).mean(axis=0)
        dark_patch = dark[y:y + tile_size, x:x + tile_size].reshape(-1, 3).mean(axis=0)
        tiles.append([int(x), int(y), to_hex(light_patch), to_hex(dark_patch), round(occupancy, 3)])

tiles.sort(key=lambda tile: (tile[1], tile[0]))

print(json.dumps({
    'sourceWidth': int(light.shape[1]),
    'sourceHeight': int(light.shape[0]),
    'tileSize': tile_size,
    'step': step,
    'offsetX': offset_x,
    'offsetY': offset_y,
    'presenterBounds': {
        'xMin': x_min,
        'xMax': x_max,
        'yMin': y_min,
        'yMax': y_max
    },
    'tiles': tiles
}))
`;

const result = spawnSync('python', ['-', lightPath, darkPath], {
  encoding: 'utf8',
  input: pythonProgram,
});

if (result.status !== 0) {
  throw new Error(result.stderr || 'Failed to extract presenter tile data with Python.');
}

const payload = JSON.parse(result.stdout);
const tupleRows = payload.tiles
  .map((tile) => `  [${tile[0]}, ${tile[1]}, '${tile[2]}', '${tile[3]}', ${tile[4]}],`)
  .join('\n');

const output = `import type { HeroPresenterTileTuple } from '@/types/heroPresenterTiles';

export const HERO_PRESENTER_SOURCE_WIDTH = ${payload.sourceWidth};
export const HERO_PRESENTER_SOURCE_HEIGHT = ${payload.sourceHeight};
export const HERO_PRESENTER_TILE_SIZE = ${payload.tileSize};
export const HERO_PRESENTER_TILE_STEP = ${payload.step};
export const HERO_PRESENTER_TILE_OFFSET = {
  x: ${payload.offsetX},
  y: ${payload.offsetY},
} as const;
export const HERO_PRESENTER_BOUNDS = {
  xMin: ${payload.presenterBounds.xMin},
  xMax: ${payload.presenterBounds.xMax},
  yMin: ${payload.presenterBounds.yMin},
  yMax: ${payload.presenterBounds.yMax},
} as const;

export const HERO_PRESENTER_TILE_TUPLES: HeroPresenterTileTuple[] = [
${tupleRows}
];
`;

writeFileSync(outputPath, output);

console.log(
  'Generated hero presenter tiles:',
  payload.tiles.length,
  '->',
  path.relative(repoRoot, outputPath),
);
