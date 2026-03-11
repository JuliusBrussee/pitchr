import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SAMPLE_RESULT } from '@/config/sampleResult';
import { insertRun } from '@/services/runService';
import { enqueuePitchRun } from '@/services/pitchRunQueueService';
import type {
  CreatePitchRunRequest,
  CreatePitchRunResponse,
  InputType,
  PitchMode,
} from '@/types/pitch';
import type { AnalysisOutputs, PitchStage, TranscriptSegment } from '@/types/analysis-v2';

export class PitchValidationError extends Error {}

function isPitchMode(value: unknown): value is PitchMode {
  return value === 'elevator' || value === 'vc_pitch' || value === 'hackathon' || value === 'final_year';
}

function isInputType(value: unknown): value is InputType {
  return value === 'audio' || value === 'text';
}

function isStage(value: unknown): value is PitchStage {
  return (
    value === 'pre_seed' ||
    value === 'seed' ||
    value === 'series_a' ||
    value === 'series_b' ||
    value === 'university_hack' ||
    value === 'corporate_hack' ||
    value === 'web3_hack' ||
    value === 'science_hack'
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
    value,
  );
}

function normalizeTranscriptSegments(value: unknown): TranscriptSegment[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new PitchValidationError('transcriptSegments must be an array when provided.');
  }

  const segments = value.map((segment, index) => {
    if (!segment || typeof segment !== 'object') {
      throw new PitchValidationError(`transcriptSegments[${index}] must be an object.`);
    }
    const row = segment as Record<string, unknown>;
    const text = typeof row.text === 'string' ? row.text.trim() : '';
    const start = typeof row.start === 'number' ? row.start : Number.NaN;
    const end = typeof row.end === 'number' ? row.end : Number.NaN;
    if (!text) {
      throw new PitchValidationError(`transcriptSegments[${index}].text is required.`);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      throw new PitchValidationError(
        `transcriptSegments[${index}] must include valid start/end seconds.`,
      );
    }

    const wordsRaw = row.words;
    const words = Array.isArray(wordsRaw)
      ? wordsRaw.map((word, wordIndex) => {
          if (!word || typeof word !== 'object') {
            throw new PitchValidationError(
              `transcriptSegments[${index}].words[${wordIndex}] must be an object.`,
            );
          }
          const entry = word as Record<string, unknown>;
          const wordText = typeof entry.text === 'string' ? entry.text.trim() : '';
          const wordStart = typeof entry.start === 'number' ? entry.start : Number.NaN;
          const wordEnd = typeof entry.end === 'number' ? entry.end : Number.NaN;
          if (!wordText) {
            throw new PitchValidationError(
              `transcriptSegments[${index}].words[${wordIndex}].text is required.`,
            );
          }
          if (!Number.isFinite(wordStart) || !Number.isFinite(wordEnd) || wordEnd < wordStart) {
            throw new PitchValidationError(
              `transcriptSegments[${index}].words[${wordIndex}] has invalid start/end.`,
            );
          }
          return {
            text: wordText,
            start: wordStart,
            end: wordEnd,
          };
        })
      : [];

    return {
      text,
      start,
      end,
      words,
    };
  });

  return segments;
}

function validateRequest(body: unknown): CreatePitchRunRequest & { mode: PitchMode } {
  if (!body || typeof body !== 'object') {
    throw new PitchValidationError('Request body must be an object.');
  }

  const payload = body as Record<string, unknown>;
  const mode = payload.mode;
  const transcript = payload.transcript;
  const inputType = payload.inputType;

  if (!isPitchMode(mode)) {
    throw new PitchValidationError('Invalid mode. Expected elevator, vc_pitch, hackathon, or final_year.');
  }
  if (!isInputType(inputType)) {
    throw new PitchValidationError('Invalid inputType. Expected audio or text.');
  }
  if (typeof transcript !== 'string' || transcript.trim().length === 0) {
    throw new PitchValidationError('Transcript is required.');
  }
  if (payload.audioUrl !== undefined && typeof payload.audioUrl !== 'string') {
    throw new PitchValidationError('audioUrl must be a string when provided.');
  }
  if (payload.deckId !== undefined) {
    if (typeof payload.deckId !== 'string' || !isUuid(payload.deckId)) {
      throw new PitchValidationError('deckId must be a valid UUID when provided.');
    }
  }
  if (payload.deckText !== undefined && typeof payload.deckText !== 'string') {
    throw new PitchValidationError('deckText must be a string when provided.');
  }
  if (payload.stage !== undefined && !isStage(payload.stage)) {
    throw new PitchValidationError(
      'stage must be one of pre_seed, seed, series_a, series_b, university_hack, corporate_hack, web3_hack, or science_hack.',
    );
  }
  if (
    payload.regenerate !== undefined &&
    payload.regenerate !== 'feedback' &&
    payload.regenerate !== 'qa_1min'
  ) {
    throw new PitchValidationError('regenerate must be feedback or qa_1min when provided.');
  }
  const transcriptSegments = normalizeTranscriptSegments(payload.transcriptSegments);

  return {
    mode,
    transcript: transcript.trim(),
    inputType,
    audioUrl: payload.audioUrl as string | undefined,
    deckId: payload.deckId as string | undefined,
    deckText: (payload.deckText as string | undefined)?.trim() || undefined,
    transcriptSegments,
    stage: payload.stage as PitchStage | undefined,
    regenerate: payload.regenerate as 'feedback' | 'qa_1min' | undefined,
  };
}

export interface RunPitchAnalysisControllerResult extends CreatePitchRunResponse {}

function createQueuedAnalysisPlaceholder(): AnalysisOutputs {
  return JSON.parse(JSON.stringify(SAMPLE_RESULT.outputs)) as AnalysisOutputs;
}

export async function runPitchAnalysisController(
  supabase: SupabaseClient,
  userId: string,
  body: unknown,
): Promise<RunPitchAnalysisControllerResult> {
  const payload = validateRequest(body);
  const queuedOutputs = createQueuedAnalysisPlaceholder();

  const run = await insertRun(supabase, {
    id: randomUUID(),
    user_id: userId,
    mode: payload.mode,
    status: 'queued',
    input_type: payload.inputType,
    transcript: payload.transcript,
    audio_url: payload.audioUrl,
    deck_id: payload.deckId,
    overall_score: 0,
    analysis: {
      ...SAMPLE_RESULT,
      outputs: queuedOutputs,
      analysis: queuedOutputs.feedback,
      meta: {
        provider_used: 'none',
        fallback_used: false,
        cache_hit: false,
        llm_calls_used: 0,
        latency_ms: 0,
        attempt_count: 0,
      },
      fallback: false,
    },
    meta: {
      provider_used: 'none',
      fallback_used: false,
      cache_hit: false,
      llm_calls_used: 0,
      latency_ms: 0,
      attempt_count: 0,
    },
    is_fallback: false,
  });

  enqueuePitchRun({
    runId: run.id,
    mode: payload.mode,
    transcript: payload.transcript,
    deckId: payload.deckId,
    deckText: payload.deckText,
    transcriptSegments: payload.transcriptSegments,
    stage: payload.stage,
    regenerate: payload.regenerate,
  });

  return {
    runId: run.id,
    status: 'queued',
  };
}
