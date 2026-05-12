import { chromium } from 'playwright';
import { readdir, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { execFileSync } from 'child_process';

const DIR = new URL('.', import.meta.url).pathname;
const SLIDES_DIR = join(DIR, 'slides');
const OUTPUT_DIR = join(DIR, 'output');

async function capture() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 2540, height: 1520 },
    deviceScaleFactor: 1,
  });

  const files = (await readdir(SLIDES_DIR))
    .filter(f => f.endsWith('.html'))
    .sort();

  for (const file of files) {
    const page = await context.newPage();
    await page.goto(`file://${join(SLIDES_DIR, file)}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // Wait for fonts + images

    const name = basename(file, '.html');
    const hiresPath = join(OUTPUT_DIR, `${name}-2x.png`);
    const finalPath = join(OUTPUT_DIR, `${name}.png`);

    // Capture at 2x resolution
    await page.screenshot({ path: hiresPath, type: 'png' });
    console.log(`Captured 2x: ${name}-2x.png (2540x1520)`);

    // Downscale to 1270x760 using sips (macOS)
    execFileSync('sips', ['--resampleWidth', '1270', hiresPath, '--out', finalPath]);
    console.log(`Downscaled:  ${name}.png (1270x760)`);

    await page.close();
  }

  await browser.close();
  console.log(`\nDone! ${files.length} images saved to ${OUTPUT_DIR}`);
  console.log('Final images (1270x760): *not* the -2x files.');
}

capture().catch(console.error);
