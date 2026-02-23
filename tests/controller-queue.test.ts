import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SAMPLE_RESULT } from '@/config/sampleResult';
import { runPitchAnalysisController } from '@/controllers/pitchController';
import { insertRun } from '@/services/runService';
import { enqueuePitchRun } from '@/services/pitchRunQueueService';

vi.mock('@/services/runService', () => ({
  insertRun: vi.fn(),
}));

vi.mock('@/services/pitchRunQueueService', () => ({
  enqueuePitchRun: vi.fn(),
}));

describe('runPitchAnalysisController async queue flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates queued run and returns queued response', async () => {
    vi.mocked(insertRun).mockResolvedValue({
      id: 'run-1',
      user_id: 'test-user-id',
      mode: 'vc_pitch',
      status: 'queued',
      error_message: null,
      started_at: null,
      completed_at: null,
      input_type: 'audio',
      transcript: 'hello world',
      audio_url: null,
      overall_score: 0,
      analysis: SAMPLE_RESULT,
      meta: SAMPLE_RESULT.meta,
      deck_id: null,
      is_fallback: false,
      created_at: new Date().toISOString(),
    });

    const result = await runPitchAnalysisController({} as any, 'test-user-id', {
      mode: 'vc_pitch',
      inputType: 'audio',
      transcript: 'hello world',
    });

    expect(result).toEqual({
      runId: 'run-1',
      status: 'queued',
    });
    expect(insertRun).toHaveBeenCalledTimes(1);
    expect(enqueuePitchRun).toHaveBeenCalledTimes(1);
    expect(enqueuePitchRun).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'run-1',
        mode: 'vc_pitch',
        transcript: 'hello world',
      }),
    );
  });
});
