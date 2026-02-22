import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createInitialChecklistState } from '@/config/realtimeChecklist';
import {
  evaluateRealtimeChecklist,
  shouldEvaluateRealtimeChecklist,
} from '@/services/realtimeChecklistService';

describe('realtimeChecklistService', () => {
  const nowMs = 1_700_000_000_000;
  const originalAnthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const originalOpenRouterApiKey = process.env.OPENROUTER_API_KEY;
  const originalLlmProvider = process.env.LLM_PROVIDER;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalAnthropicApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalAnthropicApiKey;
    }
    if (originalOpenRouterApiKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalOpenRouterApiKey;
    }
    if (originalLlmProvider === undefined) {
      delete process.env.LLM_PROVIDER;
    } else {
      process.env.LLM_PROVIDER = originalLlmProvider;
    }
    vi.unstubAllGlobals();
  });

  it('gates evaluations using 6-10 second adaptive cadence', () => {
    expect(
      shouldEvaluateRealtimeChecklist({
        transcript: 'short transcript',
        scheduler: { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 },
        nowMs,
      }),
    ).toBe(false);

    const transcript =
      'this transcript has enough words to trigger initial evaluation in the scheduler logic and should pass the minimum threshold';
    expect(
      shouldEvaluateRealtimeChecklist({
        transcript,
        scheduler: { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 },
        nowMs,
      }),
    ).toBe(true);

    expect(
      shouldEvaluateRealtimeChecklist({
        transcript: `${transcript} plus more content for an update`,
        scheduler: { lastEvaluatedAtMs: nowMs - 1000, lastEvaluatedWordCount: 20 },
        nowMs,
      }),
    ).toBe(false);

    expect(
      shouldEvaluateRealtimeChecklist({
        transcript: `${transcript} plus some new words now`,
        scheduler: { lastEvaluatedAtMs: nowMs - 11_000, lastEvaluatedWordCount: 15 },
        nowMs,
      }),
    ).toBe(true);
  });

  it('falls back to heuristic mode and keeps monotonic statuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const previous = createInitialChecklistState('vc_pitch');
    previous[0] = {
      ...previous[0],
      status: 'completed',
      confidence: 0.95,
      evidence: 'Founder intro already covered.',
    };

    const result = await evaluateRealtimeChecklist({
      mode: 'vc_pitch',
      transcript:
        'My name is Alice and we built a platform. The problem is clear and painful for teams. ' +
        'We charge a subscription and have 30% growth with 2M run rate. ' +
        'The market is a multi billion category and we are raising a seed round.',
      previousItems: previous,
      scheduler: { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 },
      sessionStartedAtMs: nowMs - 5_000,
      nowMs,
    });

    expect(result).not.toBeNull();
    expect(result?.source).toBe('heuristic');

    const intro = result?.items.find((item) => item.id === 'intro_hook');
    expect(intro?.status).toBe('completed');
    expect(intro?.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it('uses llm source when semantic evaluation succeeds', async () => {
    process.env.LLM_PROVIDER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  items: [
                    {
                      id: 'intro_hook',
                      status: 'completed',
                      confidence: 0.84,
                      evidence: 'My name is Alice, founder of Acme.',
                    },
                  ],
                  next_hint: 'Add one traction metric next.',
                }),
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const result = await evaluateRealtimeChecklist({
      mode: 'vc_pitch',
      transcript:
        'My name is Alice and we are building sales intelligence software for SMB teams.',
      previousItems: createInitialChecklistState('vc_pitch'),
      scheduler: { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 },
      sessionStartedAtMs: nowMs - 5_000,
      nowMs,
    });

    expect(result).not.toBeNull();
    expect(result?.source).toBe('llm');
    expect(result?.message.nextHint).toBe('Add one traction metric next.');
  });

  it('falls back to anthropic when configured provider keys are routed away from openrouter', async () => {
    process.env.LLM_PROVIDER = 'openrouter';
    delete process.env.OPENROUTER_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  items: [
                    {
                      id: 'intro_hook',
                      status: 'completed',
                      confidence: 0.79,
                      evidence: 'My name is Bob and I founded Acme.',
                    },
                  ],
                  next_hint: 'Add market sizing next.',
                }),
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const result = await evaluateRealtimeChecklist({
      mode: 'vc_pitch',
      transcript: 'My name is Bob and I founded Acme to solve sales ops pain.',
      previousItems: createInitialChecklistState('vc_pitch'),
      scheduler: { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 },
      sessionStartedAtMs: nowMs - 5_000,
      nowMs,
    });

    expect(result).not.toBeNull();
    expect(result?.source).toBe('llm');
    expect(result?.items.find((item) => item.id === 'intro_hook')?.status).toBe(
      'completed',
    );
  });

  it('can force evaluation despite cooldown', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await evaluateRealtimeChecklist({
      mode: 'elevator',
      transcript:
        'My name is Jane. The problem is severe for teams. We built a simple solution. ' +
        'This market is worth billions and we are raising now.',
      previousItems: createInitialChecklistState('elevator'),
      scheduler: { lastEvaluatedAtMs: nowMs - 1000, lastEvaluatedWordCount: 40 },
      sessionStartedAtMs: nowMs - 2_000,
      nowMs,
      force: true,
    });

    expect(result).not.toBeNull();
    expect(result?.message.type).toBe('checklist_update');
  });

  it('marks missing required items as failed after the 30 second window', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await evaluateRealtimeChecklist({
      mode: 'elevator',
      transcript: 'We built a product and help teams automate workflows.',
      previousItems: createInitialChecklistState('elevator'),
      scheduler: { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 },
      sessionStartedAtMs: nowMs - 31_000,
      nowMs,
    });

    expect(result).not.toBeNull();
    const problem = result?.items.find((item) => item.id === 'problem_statement');
    expect(problem?.status).toBe('failed');
    expect(problem?.evidence).toContain('Not covered within the first 30 seconds.');
  });

  it('allows failed items to recover to completed if they are later covered', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const previous = createInitialChecklistState('elevator');
    previous[0] = {
      ...previous[0],
      status: 'failed',
      confidence: 0.9,
      evidence: 'Not covered within the first 30 seconds.',
    };

    const result = await evaluateRealtimeChecklist({
      mode: 'elevator',
      transcript: 'My name is Alice and we are building better hiring software.',
      previousItems: previous,
      scheduler: { lastEvaluatedAtMs: 0, lastEvaluatedWordCount: 0 },
      sessionStartedAtMs: nowMs - 40_000,
      nowMs,
    });

    expect(result).not.toBeNull();
    const intro = result?.items.find((item) => item.id === 'intro_hook');
    expect(intro?.status).toBe('completed');
  });
});
