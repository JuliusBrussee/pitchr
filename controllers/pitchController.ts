import { randomUUID } from 'crypto';
import { SAMPLE_RESULT } from '@/config/sampleResult';
import { insertRun } from '@/services/runService';
import { enqueuePitchRun } from '@/services/pitchRunQueueService';
import type {
  CreatePitchRunRequest,
  CreatePitchRunResponse,
  InputType,
  PitchMode,
} from '@/types/pitch';
import type { AnalysisOutputs, PitchStage } from '@/types/analysis-v2';

export class PitchValidationError extends Error {}

function isPitchMode(value: unknown): value is PitchMode {
  return value === 'elevator' || value === 'vc_pitch';
}

function isInputType(value: unknown): value is InputType {
  return value === 'audio' || value === 'text';
}

function isStage(value: unknown): value is PitchStage {
  return (
    value === 'pre_seed' ||
    value === 'seed' ||
    value === 'series_a' ||
    value === 'series_b'
  );
}

function validateRequest(body: unknown): CreatePitchRunRequest {
  if (!body || typeof body !== 'object') {
    throw new PitchValidationError('Request body must be an object.');
  }

  const payload = body as Record<string, unknown>;
  const mode = payload.mode;
  const transcript = payload.transcript;
  const inputType = payload.inputType;

  if (!isPitchMode(mode)) {
    throw new PitchValidationError('Invalid mode. Expected elevator or vc_pitch.');
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
  if (payload.deckText !== undefined && typeof payload.deckText !== 'string') {
    throw new PitchValidationError('deckText must be a string when provided.');
  }
  if (payload.stage !== undefined && !isStage(payload.stage)) {
    throw new PitchValidationError(
      'stage must be one of pre_seed, seed, series_a, or series_b.',
    );
  }
  if (
    payload.regenerate !== undefined &&
    payload.regenerate !== 'feedback' &&
    payload.regenerate !== 'qa_1min'
  ) {
    throw new PitchValidationError('regenerate must be feedback or qa_1min when provided.');
  }

  return {
    mode,
    transcript: transcript.trim(),
    inputType,
    audioUrl: payload.audioUrl as string | undefined,
    deckText: (payload.deckText as string | undefined)?.trim() || undefined,
    stage: payload.stage as PitchStage | undefined,
    regenerate: payload.regenerate as 'feedback' | 'qa_1min' | undefined,
  };
}

export interface RunPitchAnalysisControllerResult extends CreatePitchRunResponse {}

function createQueuedAnalysisPlaceholder(): AnalysisOutputs {
  return JSON.parse(JSON.stringify(SAMPLE_RESULT.outputs)) as AnalysisOutputs;
}

export async function runPitchAnalysisController(
  body: unknown,
): Promise<RunPitchAnalysisControllerResult> {
  const payload = validateRequest(body);
  const queuedOutputs = createQueuedAnalysisPlaceholder();

  const run = await insertRun({
    id: randomUUID(),
    mode: payload.mode,
    status: 'queued',
    input_type: payload.inputType,
    transcript: payload.transcript,
    audio_url: payload.audioUrl,
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
    deckText: payload.deckText,
    stage: payload.stage,
    regenerate: payload.regenerate,
  });

  return {
    runId: run.id,
    status: 'queued',
  };
}
