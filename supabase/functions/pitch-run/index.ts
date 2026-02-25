// Edge Function: pitch-run
// Replaces: app/api/pitch/run/route.ts
// Methods: POST (create run), GET (list runs)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import {
  insertRun,
  updateRun,
  listRuns,
  computeRunStats,
  toRunResponse,
} from '../_shared/run-service.ts';
import { listQASessionSummariesByRunIds } from '../_shared/qna-session-service.ts';
import { analyzePitch } from '../_shared/analysis-service.ts';
import { SAMPLE_RESULT } from '../_shared/sample-result.ts';
import type {
  PitchMode,
  InputType,
  Run,
  ListPitchRunsResponse,
  CreatePitchRunResponse,
} from '../_shared/types.ts';

class PitchValidationError extends Error {}

function isPitchMode(value: unknown): value is PitchMode {
  return value === 'elevator' || value === 'vc_pitch';
}

function isInputType(value: unknown): value is InputType {
  return value === 'audio' || value === 'text';
}

function isStage(value: unknown): boolean {
  return value === 'pre_seed' || value === 'seed' || value === 'series_a' || value === 'series_b';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

// deno-lint-ignore no-explicit-any
function validateRequest(body: unknown): any {
  if (!body || typeof body !== 'object') {
    throw new PitchValidationError('Request body must be an object.');
  }

  const payload = body as Record<string, unknown>;
  if (!isPitchMode(payload.mode)) {
    throw new PitchValidationError('Invalid mode. Expected elevator or vc_pitch.');
  }
  if (!isInputType(payload.inputType)) {
    throw new PitchValidationError('Invalid inputType. Expected audio or text.');
  }
  if (typeof payload.transcript !== 'string' || payload.transcript.trim().length === 0) {
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
    throw new PitchValidationError('stage must be one of pre_seed, seed, series_a, or series_b.');
  }
  if (
    payload.regenerate !== undefined &&
    payload.regenerate !== 'feedback' &&
    payload.regenerate !== 'qa_1min'
  ) {
    throw new PitchValidationError('regenerate must be feedback or qa_1min when provided.');
  }

  return {
    mode: payload.mode,
    transcript: (payload.transcript as string).trim(),
    inputType: payload.inputType,
    audioUrl: payload.audioUrl as string | undefined,
    deckId: payload.deckId as string | undefined,
    deckText: (payload.deckText as string | undefined)?.trim() || undefined,
    transcriptSegments: payload.transcriptSegments,
    stage: payload.stage,
    regenerate: payload.regenerate,
  };
}

async function handleGet(req: Request) {
  const { supabase } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');
  const limitParam = url.searchParams.get('limit');
  const includePending = url.searchParams.get('includePending') === 'true';
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
  const parsedMode = mode === 'elevator' || mode === 'vc_pitch' ? mode : undefined;

  const allRuns = await listRuns(supabase, { mode: parsedMode });
  const visibleRuns = includePending
    ? allRuns
    : allRuns.filter((run) => run.status === 'complete');
  const runs =
    Number.isFinite(limit) && limit !== undefined
      ? visibleRuns.slice(0, limit)
      : visibleRuns;

  let qaSummariesByRunId = new Map<string, NonNullable<Run['qaSessionsSummary']>>();
  try {
    qaSummariesByRunId = await listQASessionSummariesByRunIds(supabase, runs.map((run) => run.id));
  } catch {
    qaSummariesByRunId = new Map();
  }

  const response: ListPitchRunsResponse = {
    runs: runs.map((run) => toRunResponse(run, qaSummariesByRunId.get(run.id))),
    stats: computeRunStats(visibleRuns),
  };

  return jsonResponse(response, 200);
}

async function handlePost(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { supabase, user } = await getAuthenticatedUser(req);
  const payload = validateRequest(body);
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // Insert run as 'running' immediately
  const run = await insertRun(supabase, {
    id: runId,
    user_id: user.id,
    mode: payload.mode,
    status: 'running',
    started_at: startedAt,
    input_type: payload.inputType,
    transcript: payload.transcript,
    audio_url: payload.audioUrl,
    deck_id: payload.deckId,
    overall_score: 0,
    analysis: {
      ...SAMPLE_RESULT,
      outputs: JSON.parse(JSON.stringify(SAMPLE_RESULT.outputs)),
      analysis: SAMPLE_RESULT.outputs.feedback,
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

  // Run analysis inline (edge functions have up to 150s wall clock)
  try {
    const { analysis, fallback } = await analyzePitch({
      transcript: payload.transcript,
      mode: payload.mode,
      deckText: payload.deckText,
    });

    const overallScore = analysis.outputs?.feedback?.overall_score ?? 0;

    const completedRun = await updateRun(supabase, runId, {
      status: 'complete',
      completed_at: new Date().toISOString(),
      overall_score: overallScore,
      analysis,
      meta: analysis.meta,
      is_fallback: fallback,
      error_message: null,
    });

    const providerUsed = analysis.meta?.provider_used ?? 'none';
    const warning = fallback
      ? 'Analysis completed with cached fallback content because live model calls failed.'
      : undefined;
    const response: CreatePitchRunResponse = {
      runId: completedRun.id,
      status: 'complete',
      overallScore,
      fallback,
      provider_used: providerUsed,
      warning,
    };

    return jsonResponse(response, 201);
  } catch (analysisError) {
    const message =
      analysisError instanceof Error
        ? analysisError.message
        : 'Pitch analysis failed.';

    console.error('[pitch-run] analysis failed', { runId, error: message });

    await updateRun(supabase, runId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: message,
      meta: {
        provider_used: 'none',
        fallback_used: false,
        cache_hit: false,
        llm_calls_used: 0,
        latency_ms: Date.now() - new Date(startedAt).getTime(),
        attempt_count: 0,
        error_details: {
          message,
          timeout: message.toLowerCase().includes('timed out'),
        },
      },
    });

    return jsonResponse(
      { runId: run.id, status: 'failed', error: message },
      201,
    );
  }
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') return await handleGet(req);
    if (req.method === 'POST') return await handlePost(req);
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    if (error instanceof PitchValidationError) {
      return errorResponse(error.message, 400);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process pitch run request',
      500,
    );
  }
});
