import { promises as fs } from 'fs';
import path from 'path';

interface Fixture {
  id: string;
  target_score: number;
  metrics: {
    s_pace: number;
    s_filler: number;
    s_stutter: number;
    s_repeat: number;
    s_time: number;
  };
}

const FIXTURE_DIR = path.join(process.cwd(), 'tests', 'fixtures', 'pitches');

function scoreDelivery(
  weights: [number, number, number, number, number],
  metrics: Fixture['metrics'],
): number {
  const [pace, filler, stutter, repeat, time] = weights;
  return 20 * (
    pace * metrics.s_pace +
    filler * metrics.s_filler +
    stutter * metrics.s_stutter +
    repeat * metrics.s_repeat +
    time * metrics.s_time
  );
}

function mae(
  fixtures: Fixture[],
  weights: [number, number, number, number, number],
): number {
  const errors = fixtures.map((fixture) =>
    Math.abs(scoreDelivery(weights, fixture.metrics) - fixture.target_score),
  );
  return errors.reduce((sum, error) => sum + error, 0) / Math.max(1, errors.length);
}

async function loadFixtures(): Promise<Fixture[]> {
  try {
    const entries = await fs.readdir(FIXTURE_DIR);
    const fixtures: Fixture[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      const raw = await fs.readFile(path.join(FIXTURE_DIR, entry), 'utf8');
      fixtures.push(JSON.parse(raw.replace(/^\uFEFF/u, '')) as Fixture);
    }
    return fixtures;
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const fixtures = await loadFixtures();
  if (fixtures.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No fixtures found in tests/fixtures/pitches. Nothing to calibrate.');
    return;
  }

  let best = {
    weights: [0.28, 0.3, 0.18, 0.14, 0.1] as [number, number, number, number, number],
    mae: Number.POSITIVE_INFINITY,
  };

  const candidates: Array<[number, number, number, number, number]> = [];
  for (const pace of [0.24, 0.26, 0.28, 0.3]) {
    for (const filler of [0.26, 0.28, 0.3, 0.32]) {
      for (const stutter of [0.14, 0.16, 0.18, 0.2]) {
        for (const repeat of [0.1, 0.12, 0.14, 0.16]) {
          const time = 1 - (pace + filler + stutter + repeat);
          if (time < 0.06 || time > 0.2) continue;
          candidates.push([pace, filler, stutter, repeat, Number(time.toFixed(4))]);
        }
      }
    }
  }

  for (const candidate of candidates) {
    const value = mae(fixtures, candidate);
    if (value < best.mae) {
      best = { weights: candidate, mae: value };
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        fixtures: fixtures.length,
        best_weights: {
          pace: best.weights[0],
          filler: best.weights[1],
          stutter: best.weights[2],
          repeat: best.weights[3],
          time: best.weights[4],
        },
        mae: Number(best.mae.toFixed(4)),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Calibration script failed:', error);
  process.exitCode = 1;
});
