/**
 * E2E User Journey Timing
 *
 * Playwright test that simulates a real user flow and measures wall-clock time
 * at each step. Uses the alternative approach: calls the pitch-run API directly
 * with a fixture transcript, then navigates to /results/[runId] and times from there.
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD
 *
 * Run: BASE_URL=https://pitchr.live npx playwright test tests/e2e/user-journey-timing.spec.ts
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, '../../output/playwright');
const REPORT_PATH = path.join(OUTPUT_DIR, 'timing-report.json');

interface JourneyTiming {
  landing_load_ms: number;
  session_load_ms: number;
  analysis_wait_ms: number | null;
  results_render_ms: number | null;
  total_user_journey_ms: number;
  timestamp: string;
  notes: string[];
}

function writeTimingReport(entry: JourneyTiming) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const existing: JourneyTiming[] = fs.existsSync(REPORT_PATH)
    ? JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'))
    : [];

  existing.push(entry);
  fs.writeFileSync(REPORT_PATH, JSON.stringify(existing, null, 2));
}

test.describe('User Journey Timing', () => {
  test('full flow: landing → session → submit → results', async ({ page, baseURL }) => {
    const timing: JourneyTiming = {
      landing_load_ms: 0,
      session_load_ms: 0,
      analysis_wait_ms: null,
      results_render_ms: null,
      total_user_journey_ms: 0,
      timestamp: new Date().toISOString(),
      notes: [],
    };
    const journeyStart = performance.now();

    // ── Step 1: Landing page load ──
    const landingStart = performance.now();
    const landingRes = await page.goto('/', { waitUntil: 'domcontentloaded' });
    timing.landing_load_ms = Math.round(performance.now() - landingStart);
    expect(landingRes).not.toBeNull();
    expect(landingRes!.status()).toBeLessThan(500);
    console.log(`[journey] Landing load: ${timing.landing_load_ms}ms`);

    // ── Step 2: Session page load (heavy: Three.js, MediaPipe, GSAP) ──
    const sessionStart = performance.now();
    const sessionRes = await page.goto('/session', { waitUntil: 'domcontentloaded' });
    timing.session_load_ms = Math.round(performance.now() - sessionStart);

    if (sessionRes && sessionRes.status() < 400) {
      console.log(`[journey] Session load: ${timing.session_load_ms}ms`);
    } else {
      timing.notes.push(`Session page returned status ${sessionRes?.status()} — may require auth`);
      console.log(`[journey] Session page: status ${sessionRes?.status()}, ${timing.session_load_ms}ms`);
    }

    // ── Step 3: Submit transcript via API ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    if (!supabaseUrl || !anonKey || anonKey === 'playwright-anon-key' || !testEmail || !testPassword) {
      timing.notes.push('Skipped analysis — no real Supabase credentials or test user available');
      timing.total_user_journey_ms = Math.round(performance.now() - journeyStart);
      writeTimingReport(timing);
      console.log(`[journey] Total (no analysis): ${timing.total_user_journey_ms}ms`);
      console.log('[journey] Timing report written to', REPORT_PATH);
      return;
    }

    // Sign in to get a real JWT
    const supabase = createClient(supabaseUrl, anonKey);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError || !authData.session) {
      timing.notes.push(`Auth failed: ${authError?.message ?? 'no session'}`);
      timing.total_user_journey_ms = Math.round(performance.now() - journeyStart);
      writeTimingReport(timing);
      console.log(`[journey] Auth failed, total=${timing.total_user_journey_ms}ms`);
      return;
    }

    const accessToken = authData.session.access_token;

    const transcript =
      "Hi, I'm Sarah from Acme AI. We solve the biggest problem in healthcare data: fragmented records. " +
      "Our platform uses AI to unify patient data in real-time, reducing errors by 40%. " +
      "We already have 12 hospitals signed up with a 95% retention rate. " +
      "We're raising a $2M seed round to expand into 3 new states.";

    const analysisStart = performance.now();
    const apiRes = await page.request.post(`${supabaseUrl}/functions/v1/pitch-run`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${accessToken}`,
      },
      data: {
        transcript,
        mode: 'elevator',
        inputType: 'text',
      },
    });

    const apiBody = await apiRes.json();

    if (!apiRes.ok()) {
      timing.notes.push(`API returned ${apiRes.status()}: ${apiBody.error ?? 'unknown error'}`);
      timing.total_user_journey_ms = Math.round(performance.now() - journeyStart);
      writeTimingReport(timing);
      console.log(`[journey] API error: ${apiRes.status()}, total=${timing.total_user_journey_ms}ms`);
      return;
    }

    const runId = apiBody.runId;

    // If synchronous completion
    if (apiBody.status === 'complete') {
      timing.analysis_wait_ms = Math.round(performance.now() - analysisStart);
      console.log(`[journey] Analysis (sync): ${timing.analysis_wait_ms}ms`);
    } else if (runId) {
      // Poll for completion
      const detailUrl = `${supabaseUrl}/functions/v1/pitch-run-detail?runId=${runId}`;
      const MAX_POLL = 120_000;
      let elapsed = performance.now() - analysisStart;

      while (elapsed < MAX_POLL) {
        await page.waitForTimeout(2000);
        const pollRes = await page.request.get(detailUrl, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (pollRes.ok()) {
          const detail = await pollRes.json();
          const run = detail.run ?? detail;
          if (run.status === 'complete' || run.status === 'failed') {
            timing.analysis_wait_ms = Math.round(performance.now() - analysisStart);
            timing.notes.push(`Analysis status: ${run.status}`);
            break;
          }
        }
        elapsed = performance.now() - analysisStart;
      }

      if (timing.analysis_wait_ms === null) {
        timing.analysis_wait_ms = Math.round(performance.now() - analysisStart);
        timing.notes.push('Analysis timed out after 120s');
      }
      console.log(`[journey] Analysis wait: ${timing.analysis_wait_ms}ms`);
    }

    // ── Step 4: Navigate to results page ──
    if (runId) {
      const renderStart = performance.now();
      await page.goto(`/results/${runId}`, { waitUntil: 'domcontentloaded' });
      timing.results_render_ms = Math.round(performance.now() - renderStart);
      console.log(`[journey] Results page load: ${timing.results_render_ms}ms`);
    }

    timing.total_user_journey_ms = Math.round(performance.now() - journeyStart);
    writeTimingReport(timing);

    console.log(`[journey] Total user journey: ${timing.total_user_journey_ms}ms`);
    console.log('[journey] Timing report written to', REPORT_PATH);
  });
});
