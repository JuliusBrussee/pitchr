import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = process.env.SCREENSHOT_BASE_URL || 'http://localhost:3000';
const OUT = process.env.SCREENSHOT_OUT_DIR || 'public/video/screenshots';
const RUN_ID = process.env.SCREENSHOT_RUN_ID || '';
const EMAIL = process.env.SCREENSHOT_EMAIL;
const PASSWORD = process.env.SCREENSHOT_PASSWORD;

async function main() {
  if (!EMAIL || !PASSWORD) {
    throw new Error('SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD env vars are required');
  }
  if (!RUN_ID) {
    throw new Error('SCREENSHOT_RUN_ID env var is required');
  }

  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  page.on('pageerror', () => {});

  // Login
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);
  console.log('Logged in:', page.url());

  // Switch to "2-Minute Pitch" project
  const dd = page.locator('text=Hackathon pitch').first();
  if (await dd.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dd.click();
    await page.waitForTimeout(1000);
    await page.locator('text=2-Minute Pitch').first().click();
    await page.waitForTimeout(4000);
  }

  // 1. Dashboard (with sidebar visible)
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: OUT + '/dashboard.png' });
  console.log('dashboard.png done');

  // 2. Results page
  await page.goto(BASE + '/results/' + RUN_ID, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: OUT + '/results.png' });
  console.log('results.png done');

  // 3. Session / recording page
  await page.goto(BASE + '/try', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: OUT + '/session.png' });
  console.log('session.png done');

  // 4. Q&A page
  await page.goto(BASE + '/qa', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: OUT + '/qa.png' });
  console.log('qa.png done');

  // 5. History page
  await page.goto(BASE + '/history', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: OUT + '/history.png' });
  console.log('history.png done');

  await browser.close();
  console.log('All screenshots captured to ' + OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
