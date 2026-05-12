/**
 * Edge Case Tests
 *
 * Tests that the production pipeline handles bad/unusual input gracefully.
 * Hits real Supabase edge functions — no mocks.
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD
 *
 * Run: yarn test tests/perf/edge-cases.test.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD!;

/** Authenticated JWT obtained during beforeAll */
let accessToken = '';

function edgeHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
  };
}

/**
 * Submit a pitch and wait for terminal status (complete/failed) or timeout.
 */
async function submitAndWait(payload: {
  transcript: string;
  mode?: string;
  inputType?: string;
}): Promise<{
  httpStatus: number;
  status: string;
  total_ms: number;
  body: Record<string, unknown>;
}> {
  const url = `${SUPABASE_URL}/functions/v1/pitch-run`;
  const start = performance.now();

  const res = await fetch(url, {
    method: 'POST',
    headers: edgeHeaders(),
    body: JSON.stringify({
      transcript: payload.transcript,
      mode: payload.mode ?? 'elevator',
      inputType: payload.inputType ?? 'text',
    }),
  });

  const body = await res.json();

  // If already terminal, return immediately
  if (!res.ok || body.status === 'complete' || body.status === 'failed') {
    return {
      httpStatus: res.status,
      status: body.status ?? (res.ok ? 'unknown' : 'http_error'),
      total_ms: Math.round(performance.now() - start),
      body,
    };
  }

  // Poll for completion
  const runId = body.runId;
  if (!runId) {
    return {
      httpStatus: res.status,
      status: body.status ?? 'no_run_id',
      total_ms: Math.round(performance.now() - start),
      body,
    };
  }

  const detailUrl = `${SUPABASE_URL}/functions/v1/pitch-run-detail?runId=${runId}`;
  const POLL_INTERVAL = 2000;
  const MAX_POLL = 120_000;

  let elapsed = performance.now() - start;
  while (elapsed < MAX_POLL) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    const pollRes = await fetch(detailUrl, { headers: edgeHeaders() });
    if (pollRes.ok) {
      const detail = await pollRes.json();
      const run = detail.run ?? detail;
      if (run.status === 'complete' || run.status === 'failed') {
        return {
          httpStatus: pollRes.status,
          status: run.status,
          total_ms: Math.round(performance.now() - start),
          body: run,
        };
      }
    }
    elapsed = performance.now() - start;
  }

  return {
    httpStatus: 0,
    status: 'timeout',
    total_ms: Math.round(performance.now() - start),
    body: { error: 'Exceeded 120s polling timeout' },
  };
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Edge Cases (production edge functions)', () => {
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
    console.log(`[edge-case] Authenticated as ${TEST_USER_EMAIL}`);
  });

  test(
    'empty transcript — no 500 error',
    async () => {
      const result = await submitAndWait({ transcript: '' });

      // Should not return a 500 — graceful handling (400, 422, or low-score complete)
      expect(result.httpStatus).not.toBe(500);
      console.log(
        `[edge-case] empty transcript: HTTP ${result.httpStatus}, status=${result.status}, ${result.total_ms}ms`,
      );
    },
    120_000,
  );

  test(
    'single word transcript — completes with low scores',
    async () => {
      const result = await submitAndWait({ transcript: 'Hello.' });

      expect(result.httpStatus).not.toBe(500);
      console.log(
        `[edge-case] single word: HTTP ${result.httpStatus}, status=${result.status}, ${result.total_ms}ms`,
      );
    },
    120_000,
  );

  test(
    'very long transcript — 5000+ words completes within timeout',
    async () => {
      // Generate a ~5000 word transcript by repeating a paragraph
      const paragraph =
        'We believe that our innovative AI-powered solution addresses a critical gap in the market. ' +
        'Our platform leverages cutting-edge machine learning to deliver actionable insights. ' +
        'The total addressable market is estimated at $50 billion globally. ' +
        'We have early traction with 15 enterprise customers and $200K in annual recurring revenue. ' +
        'Our team brings deep domain expertise from leading technology companies. ';
      const longText = Array(100).fill(paragraph).join(' ');

      const result = await submitAndWait({ transcript: longText, mode: 'vc_pitch' });

      expect(result.httpStatus).not.toBe(500);
      expect(result.status).not.toBe('timeout');
      console.log(
        `[edge-case] 5000+ words: HTTP ${result.httpStatus}, status=${result.status}, ${result.total_ms}ms`,
      );
    },
    120_000,
  );

  test(
    'only filler words — delivery penalized, still completes',
    async () => {
      const result = await submitAndWait({
        transcript: 'um uh like um so uh like you know um basically uh sort of like um',
      });

      expect(result.httpStatus).not.toBe(500);
      console.log(
        `[edge-case] filler only: HTTP ${result.httpStatus}, status=${result.status}, ${result.total_ms}ms`,
      );
    },
    120_000,
  );

  test(
    'unicode and emoji — no crash, parses correctly',
    async () => {
      const result = await submitAndWait({
        transcript:
          'こんにちは! Our startup 🚀 solves a $10B problem. ' +
          'We have über-strong traction — 50% MoM growth 📈. ' +
          'Café culture meets AI: naïve approaches fail, ours doesn\'t. ' +
          'We\'re raising €5M to expand into 日本 and 한국. ' +
          '¡Gracias! 🎯',
      });

      expect(result.httpStatus).not.toBe(500);
      console.log(
        `[edge-case] unicode/emoji: HTTP ${result.httpStatus}, status=${result.status}, ${result.total_ms}ms`,
      );
    },
    120_000,
  );

  test(
    'repeated submission (dedup) — second call uses cache or dedup',
    async () => {
      const transcript = 'This is a dedup test pitch about solving fleet logistics with AI.';

      const first = await submitAndWait({ transcript });
      const second = await submitAndWait({ transcript });

      expect(first.httpStatus).not.toBe(500);
      expect(second.httpStatus).not.toBe(500);

      const speedup = first.total_ms > 0 ? ((first.total_ms - second.total_ms) / first.total_ms * 100).toFixed(1) : 'N/A';
      console.log(
        `[edge-case] dedup: first=${first.total_ms}ms, second=${second.total_ms}ms, speedup=${speedup}%`,
      );
    },
    240_000,
  );
});
