import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  PitchValidationError,
  runPitchAnalysisController,
} from '@/controllers/pitchController';

// Mock dependencies
vi.mock('@/services/runService', () => ({
  insertRun: vi.fn().mockResolvedValue({
    id: 'test-run-id',
    mode: 'vc_pitch',
    status: 'queued',
    input_type: 'text',
    transcript: 'test',
    overall_score: 0,
    analysis: {},
    created_at: '2024-01-01T00:00:00Z',
    error_message: null,
    started_at: null,
    completed_at: null,
    meta: null,
    deck_id: null,
    is_fallback: false,
    audio_url: null,
  }),
}));

vi.mock('@/services/pitchRunQueueService', () => ({
  enqueuePitchRun: vi.fn(),
}));

describe('pitchController validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects null body', async () => {
    await expect(runPitchAnalysisController(null)).rejects.toThrow(PitchValidationError);
  });

  it('rejects non-object body', async () => {
    await expect(runPitchAnalysisController('string')).rejects.toThrow(PitchValidationError);
  });

  it('rejects missing mode', async () => {
    await expect(
      runPitchAnalysisController({
        transcript: 'test pitch',
        inputType: 'text',
      }),
    ).rejects.toThrow('Invalid mode');
  });

  it('rejects invalid mode', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'invalid',
        transcript: 'test pitch',
        inputType: 'text',
      }),
    ).rejects.toThrow('Invalid mode');
  });

  it('rejects missing inputType', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        transcript: 'test pitch',
      }),
    ).rejects.toThrow('Invalid inputType');
  });

  it('rejects invalid inputType', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        transcript: 'test pitch',
        inputType: 'video',
      }),
    ).rejects.toThrow('Invalid inputType');
  });

  it('rejects missing transcript', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'text',
      }),
    ).rejects.toThrow('Transcript is required');
  });

  it('rejects empty transcript', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: '   ',
      }),
    ).rejects.toThrow('Transcript is required');
  });

  it('rejects non-string audioUrl', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'audio',
        transcript: 'test pitch',
        audioUrl: 123,
      }),
    ).rejects.toThrow('audioUrl must be a string');
  });

  it('rejects non-UUID deckId', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'test pitch',
        deckId: 'not-a-uuid',
      }),
    ).rejects.toThrow('deckId must be a valid UUID');
  });

  it('rejects non-string deckText', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'test pitch',
        deckText: 123,
      }),
    ).rejects.toThrow('deckText must be a string');
  });

  it('rejects invalid stage', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'test pitch',
        stage: 'series_c',
      }),
    ).rejects.toThrow('stage must be one of');
  });

  it('rejects invalid regenerate value', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'test pitch',
        regenerate: 'full',
      }),
    ).rejects.toThrow('regenerate must be feedback or qa_1min');
  });

  it('rejects non-array transcriptSegments', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'test pitch',
        transcriptSegments: 'not an array',
      }),
    ).rejects.toThrow('transcriptSegments must be an array');
  });

  it('rejects segment without text', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'test pitch',
        transcriptSegments: [{ start: 0, end: 1 }],
      }),
    ).rejects.toThrow('text is required');
  });

  it('rejects segment with invalid timestamps', async () => {
    await expect(
      runPitchAnalysisController({
        mode: 'vc_pitch',
        inputType: 'text',
        transcript: 'test pitch',
        transcriptSegments: [{ text: 'Hello', start: 5, end: 2 }],
      }),
    ).rejects.toThrow('valid start/end');
  });

  it('accepts valid request and returns queued result', async () => {
    const result = await runPitchAnalysisController({
      mode: 'vc_pitch',
      inputType: 'text',
      transcript: 'We build tools for enterprise teams to scale faster.',
    });
    expect(result.runId).toBe('test-run-id');
    expect(result.status).toBe('queued');
  });

  it('accepts all valid optional fields', async () => {
    const result = await runPitchAnalysisController({
      mode: 'elevator',
      inputType: 'audio',
      transcript: 'We build tools for enterprise.',
      audioUrl: 'https://example.com/audio.webm',
      deckId: '12345678-1234-1234-9234-123456789abc',
      deckText: 'Slide 1: Our product',
      stage: 'seed',
      regenerate: 'feedback',
      transcriptSegments: [
        {
          text: 'We build tools.',
          start: 0,
          end: 2,
          words: [
            { text: 'We', start: 0, end: 0.3 },
            { text: 'build', start: 0.4, end: 0.8 },
            { text: 'tools', start: 0.9, end: 1.5 },
          ],
        },
      ],
    });
    expect(result.status).toBe('queued');
  });

  it('trims transcript whitespace', async () => {
    const { insertRun } = await import('@/services/runService');
    await runPitchAnalysisController({
      mode: 'vc_pitch',
      inputType: 'text',
      transcript: '  We build great tools.  ',
    });
    expect(insertRun).toHaveBeenCalledWith(
      expect.objectContaining({ transcript: 'We build great tools.' }),
    );
  });
});
