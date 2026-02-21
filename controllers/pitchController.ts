import { analyzePitch } from '@/services/analysisService';
import { insertRun } from '@/services/runService';
import type {
  CreatePitchRunRequest,
  CreatePitchRunResponse,
  InputType,
  PitchMode,
} from '@/types/pitch';

export class PitchValidationError extends Error {}

function isPitchMode(value: unknown): value is PitchMode {
  return value === 'elevator' || value === 'vc_pitch';
}

function isInputType(value: unknown): value is InputType {
  return value === 'audio' || value === 'text';
}

function validateRequest(body: unknown): CreatePitchRunRequest {
  if (!body || typeof body !== 'object') {
    throw new PitchValidationError('Request body must be an object');
  }

  const payload = body as Record<string, unknown>;
  const mode = payload.mode;
  const transcript = payload.transcript;
  const inputType = payload.inputType;
  const audioUrl = payload.audioUrl;

  if (!isPitchMode(mode)) {
    throw new PitchValidationError('Invalid mode. Expected elevator or vc_pitch.');
  }

  if (!isInputType(inputType)) {
    throw new PitchValidationError('Invalid inputType. Expected audio or text.');
  }

  if (typeof transcript !== 'string' || transcript.trim().length === 0) {
    throw new PitchValidationError('Transcript is required.');
  }

  if (audioUrl !== undefined && typeof audioUrl !== 'string') {
    throw new PitchValidationError('audioUrl must be a string when provided.');
  }

  return {
    mode,
    transcript: transcript.trim(),
    inputType,
    audioUrl,
  };
}

export interface RunPitchAnalysisControllerResult extends CreatePitchRunResponse {
  fallback: boolean;
}

export async function runPitchAnalysisController(
  body: unknown,
): Promise<RunPitchAnalysisControllerResult> {
  const payload = validateRequest(body);
  const { analysis, fallback } = await analyzePitch({
    transcript: payload.transcript,
    mode: payload.mode,
  });

  const run = await insertRun({
    mode: payload.mode,
    input_type: payload.inputType,
    transcript: payload.transcript,
    audio_url: payload.audioUrl,
    overall_score: analysis.overall_score,
    analysis,
    is_fallback: fallback,
  });

  return {
    runId: run.id,
    status: 'complete',
    analysis,
    fallback,
  };
}
