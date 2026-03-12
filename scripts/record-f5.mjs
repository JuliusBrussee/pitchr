import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const DOWNLOADS = join(process.env.USERPROFILE || process.env.HOME, 'Downloads');
const WEBM_PATH = join(DOWNLOADS, 'pitchr-demo-f5.webm');
const MP4_PATH = join(DOWNLOADS, 'pitchr-demo-f5.mp4');

// Viewport: 1920x1080 is standard Full HD
// deviceScaleFactor: 2 gives retina-quality rendering
const WIDTH = 1920;
const HEIGHT = 1080;

// Total demo duration ~76s + buffer
const RECORD_DURATION_MS = 80_000;

async function main() {
  console.log('Launching browser...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: DOWNLOADS,
      size: { width: WIDTH * 2, height: HEIGHT * 2 }, // 4K output
    },
    colorScheme: 'dark',
  });

  const page = await context.newPage();

  console.log('Navigating to demo...');
  await page.goto('http://localhost:3000/product-demo', {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });

  // Wait for first caption words to animate in
  await page.waitForTimeout(2000);

  console.log(`Recording for ${RECORD_DURATION_MS / 1000}s...`);
  await page.waitForTimeout(RECORD_DURATION_MS);

  console.log('Stopping recording...');
  await context.close();
  await browser.close();

  // Playwright saves the video with a random name — find it
  const { readdirSync, statSync, renameSync } = await import('fs');
  const files = readdirSync(DOWNLOADS)
    .filter(f => f.endsWith('.webm'))
    .map(f => ({ name: f, path: join(DOWNLOADS, f), mtime: statSync(join(DOWNLOADS, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);

  if (!files.length) {
    console.error('No webm file found!');
    process.exit(1);
  }

  const recordedWebm = files[0].path;

  // Rename to our target name
  if (existsSync(WEBM_PATH) && WEBM_PATH !== recordedWebm) unlinkSync(WEBM_PATH);
  if (recordedWebm !== WEBM_PATH) {
    renameSync(recordedWebm, WEBM_PATH);
  }
  console.log(`WebM saved: ${WEBM_PATH}`);

  // Convert to high-quality MP4
  if (existsSync(MP4_PATH)) unlinkSync(MP4_PATH);
  console.log('Converting to MP4 (high quality)...');
  execSync(
    `ffmpeg -i "${WEBM_PATH}" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart "${MP4_PATH}"`,
    { stdio: 'inherit' }
  );

  // Clean up webm
  if (existsSync(WEBM_PATH)) unlinkSync(WEBM_PATH);
  console.log(`\nDone! Video saved to: ${MP4_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
