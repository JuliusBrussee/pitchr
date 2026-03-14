/**
 * Page Load Time Spot-Checks
 *
 * Quick Playwright tests for every key route, measuring domContentLoaded,
 * loadComplete, and firstContentfulPaint via performance.timing.
 *
 * Results are logged to output/playwright/page-load-report.json.
 *
 * Run: npx playwright test tests/e2e/page-load-times.spec.ts
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, '../../output/playwright');
const REPORT_PATH = path.join(OUTPUT_DIR, 'page-load-report.json');

interface PageLoadEntry {
  route: string;
  dom_content_loaded_ms: number | null;
  load_complete_ms: number | null;
  first_contentful_paint_ms: number | null;
  navigation_ms: number;
  final_url: string;
  http_status: number;
  timestamp: string;
}

const entries: PageLoadEntry[] = [];

async function measurePageLoad(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  route: string,
): Promise<PageLoadEntry> {
  const navStart = performance.now();
  const response = await page.goto(route, { waitUntil: 'load', timeout: 60_000 });
  const navigationMs = Math.round(performance.now() - navStart);

  // Extract performance timing from the browser
  const perfTiming = await page.evaluate(() => {
    const timing = performance.timing;
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const fcp = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry | undefined;

    return {
      domContentLoaded: nav
        ? Math.round(nav.domContentLoadedEventEnd - nav.startTime)
        : timing.domContentLoadedEventEnd > 0
          ? timing.domContentLoadedEventEnd - timing.navigationStart
          : null,
      loadComplete: nav
        ? Math.round(nav.loadEventEnd - nav.startTime)
        : timing.loadEventEnd > 0
          ? timing.loadEventEnd - timing.navigationStart
          : null,
      firstContentfulPaint: fcp ? Math.round(fcp.startTime) : null,
    };
  });

  return {
    route,
    dom_content_loaded_ms: perfTiming.domContentLoaded,
    load_complete_ms: perfTiming.loadComplete,
    first_contentful_paint_ms: perfTiming.firstContentfulPaint,
    navigation_ms: navigationMs,
    final_url: page.url(),
    http_status: response?.status() ?? 0,
    timestamp: new Date().toISOString(),
  };
}

test.describe('Page Load Times', () => {
  test.afterAll(() => {
    if (entries.length === 0) return;

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const existing: PageLoadEntry[] = fs.existsSync(REPORT_PATH)
      ? JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'))
      : [];

    const merged = [...existing, ...entries];
    fs.writeFileSync(REPORT_PATH, JSON.stringify(merged, null, 2));
    console.log(`\n[page-load] Report written to ${REPORT_PATH} (${entries.length} entries)`);
  });

  const routes = [
    { path: '/', name: 'Landing page' },
    { path: '/login', name: 'Auth page' },
    { path: '/session', name: 'Session (Three.js, MediaPipe, GSAP)' },
    { path: '/history', name: 'History list view' },
    { path: '/insights', name: 'Analytics dashboard' },
  ];

  for (const route of routes) {
    test(`${route.name} — ${route.path}`, async ({ page }) => {
      const entry = await measurePageLoad(page, route.path);
      entries.push(entry);

      // No hard failure on timing — just log
      expect(entry.http_status).toBeLessThan(500);

      console.log(
        `[page-load] ${route.path}: ` +
          `DOM=${entry.dom_content_loaded_ms}ms, ` +
          `Load=${entry.load_complete_ms}ms, ` +
          `FCP=${entry.first_contentful_paint_ms}ms, ` +
          `Nav=${entry.navigation_ms}ms ` +
          `→ ${entry.final_url}`,
      );
    });
  }
});
