/**
 * Record the F5 demo as a high-quality MP4 using Playwright video + ffmpeg.
 *
 * Playwright records in real-time (WebM), then ffmpeg re-encodes to
 * near-lossless H.264 MP4.
 *
 * Usage:
 *   1. Start the dev server:  npm run dev
 *   2. Run this script:       node scripts/record-demo.mjs
 *
 * Output: out/PitchrDemo-F5.mp4
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync, unlinkSync, readdirSync, statSync, renameSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'out');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const MAX_WAIT_MS = 120_000; // 2 min max
const POLL_INTERVAL_MS = 500;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('Launching browser at 1920x1080...');
  const browser = await chromium.launch({
    // Use headed mode for smoother GPU-accelerated rendering
    args: ['--disable-gpu-sandbox', '--enable-gpu-rasterization'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    recordVideo: {
      dir: OUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  console.log(`Navigating to ${BASE_URL}/record-demo ...`);
  await page.goto(`${BASE_URL}/record-demo`, { waitUntil: 'networkidle' });

  // Let fonts/assets settle before animation starts playing
  console.log('Waiting for animation to play through (~67s)...');

  const start = Date.now();
  let complete = false;

  while (Date.now() - start < MAX_WAIT_MS) {
    complete = await page.evaluate(() =>
      Boolean((window).__DEMO_COMPLETE__)
    );
    if (complete) break;
    await page.waitForTimeout(POLL_INTERVAL_MS);
  }

  if (complete) {
    console.log('Demo complete — holding final frame for 3s...');
    await page.waitForTimeout(3000);
  } else {
    console.warn('Timed out waiting for demo completion — saving what we have.');
  }

  // Close context to finalize the video file
  await page.close();
  await context.close();
  await browser.close();

  // Find the recorded WebM (Playwright generates a random filename)
  const webmFiles = readdirSync(OUT_DIR)
    .filter(f => f.endsWith('.webm'))
    .map(f => ({
      name: f,
      path: resolve(OUT_DIR, f),
      mtime: statSync(resolve(OUT_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (webmFiles.length === 0) {
    console.error('No video file found in output directory.');
    process.exit(1);
  }

  const webmPath = webmFiles[0].path;
  const mp4Path = resolve(OUT_DIR, 'PitchrDemo-F5.mp4');

  console.log(`\nRecorded: ${webmPath}`);
  console.log('Re-encoding to high-quality MP4...\n');

  // Re-encode: CRF 16 = near-lossless, slow preset for best compression
  const cmd = [
    'ffmpeg', '-y',
    '-i', `"${webmPath}"`,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '16',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    `"${mp4Path}"`,
  ].join(' ');

  execSync(cmd, { stdio: 'inherit' });

  // Clean up the WebM
  unlinkSync(webmPath);

  console.log(`\nDone! Output: ${mp4Path}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
