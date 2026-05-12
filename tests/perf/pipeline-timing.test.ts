/**
 * Pipeline Timing Tests
 *
 * Integration tests that hit production Supabase edge functions with real LLM calls
 * to measure end-to-end latency at each pipeline stage.
 *
 * Timing is report-only — no hard failures on latency.
 * Results are written to output/perf/timing-report.json.
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD
 *
 * Run: yarn test tests/perf/pipeline-timing.test.ts
 */

import { createClient } from '@supabase/supabase-js';
import { MOCK_PITCHES } from '@/tests/fixtures/mock-pitches';
import longTranscript from '@/tests/fixtures/pitches/long-transcript-3min.json';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD!;

const OUTPUT_DIR = path.resolve(__dirname, '../../output/perf');
const REPORT_PATH = path.join(OUTPUT_DIR, 'timing-report.json');

interface TimingEntry {
  test: string;
  total_ms: number;
  provider_used: string | null;
  fallback_used: boolean;
  attempt_count: number;
  llm_calls_used: number;
  overall_score: number | null;
  status: string;
  error?: string;
  timestamp: string;
}

const timingEntries: TimingEntry[] = [];

/** Authenticated JWT obtained during beforeAll */
let accessToken = '';

/**
 * Submit a pitch via the edge function and poll until complete or failed.
 */
async function submitAndWait(payload: {
  transcript: string;
  mode: string;
  inputType?: string;
  deckText?: string;
}): Promise<{
  total_ms: number;
  status: string;
  meta?: Record<string, unknown>;
  overallScore?: number;
  error?: string;
}> {
  const url = `${SUPABASE_URL}/functions/v1/pitch-run`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
  };

  const start = performance.now();

  const createRes = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      transcript: payload.transcript,
      mode: payload.mode,
      inputType: payload.inputType ?? 'text',
      deckText: payload.deckText,
    }),
  });

  const createBody = await createRes.json();

  if (!createRes.ok) {
    const elapsed = performance.now() - start;
    return {
      total_ms: Math.round(elapsed),
      status: 'create_failed',
      error: createBody.error ?? `HTTP ${createRes.status}`,
    };
  }

  // If the response already includes a completed status (synchronous flow)
  if (createBody.status === 'complete') {
    const elapsed = performance.now() - start;
    return {
      total_ms: Math.round(elapsed),
      status: 'complete',
      meta: createBody.meta,
      overallScore: createBody.outputs?.overall_score ?? createBody.analysis?.overallScore,
    };
  }

  if (createBody.status === 'failed') {
    const elapsed = performance.now() - start;
    return {
      total_ms: Math.round(elapsed),
      status: 'failed',
      error: createBody.error,
    };
  }

  // Async flow — poll pitch-run-detail until done
  const runId = createBody.runId;
  const detailUrl = `${SUPABASE_URL}/functions/v1/pitch-run-detail?runId=${runId}`;
  const POLL_INTERVAL = 2000;
  const MAX_POLL = 120_000;

  let elapsed = performance.now() - start;
  while (elapsed < MAX_POLL) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    const pollRes = await fetch(detailUrl, { headers });
    if (!pollRes.ok) {
      elapsed = performance.now() - start;
      continue;
    }

    const detail = await pollRes.json();
    const run = detail.run ?? detail;
    if (run.status === 'complete') {
      elapsed = performance.now() - start;
      return {
        total_ms: Math.round(elapsed),
        status: 'complete',
        meta: run.meta,
        overallScore: run.outputs?.overall_score ?? run.overallScore,
      };
    }
    if (run.status === 'failed') {
      elapsed = performance.now() - start;
      return {
        total_ms: Math.round(elapsed),
        status: 'failed',
        error: run.error,
      };
    }

    elapsed = performance.now() - start;
  }

  return {
    total_ms: Math.round(performance.now() - start),
    status: 'timeout',
    error: 'Exceeded 120s polling timeout',
  };
}

function recordEntry(entry: TimingEntry) {
  timingEntries.push(entry);
  const { test: name, total_ms, status, provider_used, overall_score } = entry;
  console.log(
    `[timing] ${name}: ${total_ms}ms | status=${status} | provider=${provider_used} | score=${overall_score}`,
  );
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Pipeline Timing (production edge functions)', () => {
  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
      throw new Error('Missing TEST_USER_EMAIL or TEST_USER_PASSWORD — set them in .env.local or as env vars');
    }

    // Sign in to get a real JWT
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (error || !data.session) {
      throw new Error(`Auth failed: ${error?.message ?? 'no session returned'}`);
    }

    accessToken = data.session.access_token;
    console.log(`[timing] Authenticated as ${TEST_USER_EMAIL}`);
  });

  afterAll(() => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const existing: TimingEntry[] = fs.existsSync(REPORT_PATH)
      ? JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'))
      : [];

    const merged = [...existing, ...timingEntries];
    fs.writeFileSync(REPORT_PATH, JSON.stringify(merged, null, 2));
    console.log(`\n[timing] Report written to ${REPORT_PATH} (${timingEntries.length} new entries)`);
  });

  test(
    'short transcript — elevator pitch baseline',
    async () => {
      const result = await submitAndWait({
        transcript: MOCK_PITCHES.elevator.transcript,
        mode: 'elevator',
      });

      recordEntry({
        test: 'short_transcript_elevator',
        total_ms: result.total_ms,
        provider_used: (result.meta?.provider_used as string) ?? null,
        fallback_used: (result.meta?.fallback_used as boolean) ?? false,
        attempt_count: (result.meta?.attempt_count as number) ?? 1,
        llm_calls_used: (result.meta?.llm_calls_used as number) ?? 0,
        overall_score: result.overallScore ?? null,
        status: result.status,
        error: result.error,
        timestamp: new Date().toISOString(),
      });

      expect(result.status).not.toBe('create_failed');
    },
    120_000,
  );

  test(
    'medium transcript — vc_pitch typical case',
    async () => {
      const result = await submitAndWait({
        transcript: MOCK_PITCHES.vc_pitch.transcript,
        mode: 'vc_pitch',
      });

      recordEntry({
        test: 'medium_transcript_vc_pitch',
        total_ms: result.total_ms,
        provider_used: (result.meta?.provider_used as string) ?? null,
        fallback_used: (result.meta?.fallback_used as boolean) ?? false,
        attempt_count: (result.meta?.attempt_count as number) ?? 1,
        llm_calls_used: (result.meta?.llm_calls_used as number) ?? 0,
        overall_score: result.overallScore ?? null,
        status: result.status,
        error: result.error,
        timestamp: new Date().toISOString(),
      });

      expect(result.status).not.toBe('create_failed');
    },
    120_000,
  );

  test(
    'long transcript — 2-3 min worst-case realistic',
    async () => {
      const result = await submitAndWait({
        transcript: longTranscript.transcript,
        mode: longTranscript.mode,
      });

      recordEntry({
        test: 'long_transcript_3min',
        total_ms: result.total_ms,
        provider_used: (result.meta?.provider_used as string) ?? null,
        fallback_used: (result.meta?.fallback_used as boolean) ?? false,
        attempt_count: (result.meta?.attempt_count as number) ?? 1,
        llm_calls_used: (result.meta?.llm_calls_used as number) ?? 0,
        overall_score: result.overallScore ?? null,
        status: result.status,
        error: result.error,
        timestamp: new Date().toISOString(),
      });

      expect(result.status).not.toBe('create_failed');
    },
    120_000,
  );

  test(
    'cache hit — same transcript submitted twice',
    async () => {
      const transcript = MOCK_PITCHES.elevator.transcript;

      // First call (may already be cached from earlier test)
      const first = await submitAndWait({ transcript, mode: 'elevator' });
      recordEntry({
        test: 'cache_hit_first_call',
        total_ms: first.total_ms,
        provider_used: (first.meta?.provider_used as string) ?? null,
        fallback_used: (first.meta?.fallback_used as boolean) ?? false,
        attempt_count: (first.meta?.attempt_count as number) ?? 1,
        llm_calls_used: (first.meta?.llm_calls_used as number) ?? 0,
        overall_score: first.overallScore ?? null,
        status: first.status,
        error: first.error,
        timestamp: new Date().toISOString(),
      });

      // Second call — should hit cache
      const second = await submitAndWait({ transcript, mode: 'elevator' });
      recordEntry({
        test: 'cache_hit_second_call',
        total_ms: second.total_ms,
        provider_used: (second.meta?.provider_used as string) ?? null,
        fallback_used: (second.meta?.fallback_used as boolean) ?? false,
        attempt_count: (second.meta?.attempt_count as number) ?? 1,
        llm_calls_used: (second.meta?.llm_calls_used as number) ?? 0,
        overall_score: second.overallScore ?? null,
        status: second.status,
        error: second.error,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[timing] cache delta: first=${first.total_ms}ms, second=${second.total_ms}ms, diff=${first.total_ms - second.total_ms}ms`,
      );
    },
    240_000,
  );

  test(
    'with deck text — spoken+deck analysis',
    async () => {
      const deckText = [
        'Slide 1: FleetMind — AI-Powered Fleet Intelligence',
        'Slide 2: Problem — $18K/truck/year wasted on inefficient routing',
        'Slide 3: Solution — Real-time route optimization on existing hardware',
        'Slide 4: Market Timing — DOT ELD mandate + record diesel prices',
        'Slide 5: Traction — 41 customers, 6K trucks, $1.8M ARR, 30% MoM growth',
        'Slide 6: Market — $8.6B TAM, $2.3B underserved mid-market segment',
        'Slide 7: Unit Economics — $44K ACV, 14-mo payback, 82% gross margins',
        'Slide 8: Ask — $12M Series A for engineering, sales expansion, predictive maintenance',
        'Slide 9: Team — Ex-UPS logistics, ex-Google ML, ex-Palantir ops',
        'Slide 10: Thank You — alex@fleetmind.ai',
      ].join('\n\n');

      const result = await submitAndWait({
        transcript: longTranscript.transcript,
        mode: 'vc_pitch',
        deckText,
      });

      recordEntry({
        test: 'with_deck_text_spoken_plus_deck',
        total_ms: result.total_ms,
        provider_used: (result.meta?.provider_used as string) ?? null,
        fallback_used: (result.meta?.fallback_used as boolean) ?? false,
        attempt_count: (result.meta?.attempt_count as number) ?? 1,
        llm_calls_used: (result.meta?.llm_calls_used as number) ?? 0,
        overall_score: result.overallScore ?? null,
        status: result.status,
        error: result.error,
        timestamp: new Date().toISOString(),
      });

      expect(result.status).not.toBe('create_failed');
    },
    120_000,
  );
});
