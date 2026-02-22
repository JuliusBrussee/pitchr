import { afterEach, describe, expect, it, vi } from 'vitest';
import { syncRunToPaid } from '@/services/paidService';
import type { RunEconomics } from '@/types/analysis-v2';

const ORIGINAL_ENV = { ...process.env };

function restoreEnv(): void {
  process.env = { ...ORIGINAL_ENV };
}

function baseEconomics(): RunEconomics {
  return {
    model_cost_usd: 0.01,
    platform_overhead_usd: 1.5,
    cost_floor_usd: 2.5,
    estimated_input_tokens: 1000,
    estimated_output_tokens: 500,
    estimated_cost_usd: 2.5,
    coach_hourly_rate_usd: 200,
    savings_realization_rate: 0.35,
    manual_baseline_minutes: 30,
    agent_runtime_minutes: 5,
    time_saved_minutes: 25,
    money_saved_vs_coach_usd: 29.17,
    score_delta_vs_previous_mode_run: 8,
    quality_bonus_usd: 16,
    estimated_value_usd: 78.5,
    roi_multiple: 7850,
    gross_margin_usd: 78.49,
  };
}

describe('paidService', () => {
  afterEach(() => {
    restoreEnv();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('skips when Paid is disabled', async () => {
    process.env.PAID_ENABLED = 'false';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncRunToPaid({
      runId: 'run-1',
      mode: 'vc_pitch',
      overallScore: 74,
      latencyMs: 1200,
      fallbackUsed: false,
      economics: baseEconomics(),
    });

    expect(result.status).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips when Paid key is missing', async () => {
    process.env.PAID_ENABLED = 'true';
    delete process.env.PAID_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncRunToPaid({
      runId: 'run-2',
      mode: 'vc_pitch',
      overallScore: 81,
      latencyMs: 1300,
      fallbackUsed: false,
      economics: baseEconomics(),
    });

    expect(result.status).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retries once on 500 and sends investor_ready signal for scores >= 80', async () => {
    process.env.PAID_ENABLED = 'true';
    process.env.PAID_API_KEY = 'paid-key';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('server error', { status: 500 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncRunToPaid({
      runId: 'run-3',
      mode: 'vc_pitch',
      overallScore: 86,
      latencyMs: 900,
      fallbackUsed: false,
      economics: baseEconomics(),
    });

    expect(result.status).toBe('sent');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns failed when Paid keeps erroring after retry', async () => {
    process.env.PAID_ENABLED = 'true';
    process.env.PAID_API_KEY = 'paid-key';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(new Response('still unavailable', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await syncRunToPaid({
      runId: 'run-4',
      mode: 'elevator',
      overallScore: 55,
      latencyMs: 700,
      fallbackUsed: false,
      economics: baseEconomics(),
    });

    expect(result.status).toBe('failed');
    expect(result.error).toContain('Paid signal failed');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
