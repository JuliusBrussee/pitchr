// Edge Function: pitch-run
// Replaces: app/api/pitch/run/route.ts
// Methods: POST (create run), GET (list runs)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, createAdminClient, AuthenticationError } from '../_shared/supabase.ts';
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
import { checkUsageLimit, recordUsageEvent } from '../_shared/billing-service.ts';
import { resolveProjectForRequest, ProjectNotFoundError } from '../_shared/project-service.ts';
import { tryCompleteReferral } from '../_shared/referral-service.ts';
import type { PitchMode, InputType, Run, ListPitchRunsResponse } from '../_shared/types.ts';

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

class PitchValidationError extends Error {}

function isPitchMode(value: unknown): value is PitchMode {
  return value === 'elevator' || value === 'vc_pitch';
}

function isInputType(value: unknown): value is InputType {
  return value === 'audio' || value === 'text' || value === 'upload';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

interface ValidatedPitchRunRequest {
  mode: PitchMode;
  projectId?: string;
  transcript: string;
  inputType: InputType;
  audioUrl?: string;
  deckId?: string;
  deckText?: string;
}

function validateRequest(body: unknown): ValidatedPitchRunRequest {
  if (!body || typeof body !== 'object') {
    throw new PitchValidationError('Request body must be an object.');
  }

  const payload = body as Record<string, unknown>;
  if (!isPitchMode(payload.mode)) {
    throw new PitchValidationError('mode is required. Expected elevator or vc_pitch.');
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
  if (payload.projectId !== undefined) {
    if (typeof payload.projectId !== 'string' || !isUuid(payload.projectId)) {
      throw new PitchValidationError('projectId must be a valid UUID when provided.');
    }
  }
  if (payload.deckText !== undefined && typeof payload.deckText !== 'string') {
    throw new PitchValidationError('deckText must be a string when provided.');
  }

  return {
    mode: payload.mode as PitchMode,
    projectId: payload.projectId as string | undefined,
    transcript: (payload.transcript as string).trim(),
    inputType: payload.inputType,
    audioUrl: payload.audioUrl as string | undefined,
    deckId: payload.deckId as string | undefined,
    deckText: (payload.deckText as string | undefined)?.trim() || undefined,
  };
}

interface ProcessQueuedRunInput {
  runId: string;
  userId: string;
  projectType: 'two_min_pitch' | 'elevator_pitch';
  mode: PitchMode;
  transcript: string;
  deckText?: string;
  systemPromptOverride?: string;
}

async function processQueuedRun(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  input: ProcessQueuedRunInput,
): Promise<void> {
  const startedAtMs = Date.now();
  const startedAtIso = new Date(startedAtMs).toISOString();

  try {
    await updateRun(supabaseAdmin, input.runId, {
      status: 'running',
      started_at: startedAtIso,
      error_message: null,
    });
  } catch (error) {
    console.error('[pitch-run] failed to mark queued run as running', {
      runId: input.runId,
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  try {
    const { analysis, fallback } = await analyzePitch({
      transcript: input.transcript,
      mode: input.mode,
      projectType: input.projectType,
      deckText: input.deckText,
      systemPromptOverride: input.systemPromptOverride,
    });

    const overallScore = analysis.outputs?.feedback?.overall_score ?? 0;

    await updateRun(supabaseAdmin, input.runId, {
      status: 'complete',
      completed_at: new Date().toISOString(),
      overall_score: overallScore,
      analysis,
      meta: analysis.meta,
      is_fallback: fallback,
      error_message: null,
    });

    // Trigger referral completion on first successful analysis
    try {
      await tryCompleteReferral(supabaseAdmin, input.userId);
    } catch (refErr) {
      console.error('[pitch-run] referral completion check failed', {
        runId: input.runId,
        error: refErr instanceof Error ? refErr.message : String(refErr),
      });
    }
  } catch (analysisError) {
    const message =
      analysisError instanceof Error
        ? analysisError.message
        : 'Pitch analysis failed.';

    console.error('[pitch-run] background analysis failed', { runId: input.runId, error: message });

    // Refund credits for non-day-pass users on analysis failure
    try {
      const dayPass = await supabaseAdmin
        .from('day_passes')
        .select('id')
        .eq('user_id', input.userId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .single();

      if (!dayPass.data) {
        await supabaseAdmin.rpc('refund_credits', {
          p_user_id: input.userId,
          p_amount: 1,
          p_source: 'pitch_analysis_refund',
          p_reference_id: input.runId,
          p_description: 'Refund for failed pitch analysis',
        });
        console.log('[pitch-run] credits refunded for failed analysis', { runId: input.runId });
      }
    } catch (refundError) {
      console.error('[pitch-run] failed to refund credits', {
        runId: input.runId,
        error: refundError instanceof Error ? refundError.message : String(refundError),
      });
    }

    try {
      await updateRun(supabaseAdmin, input.runId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: message,
        meta: {
          provider_used: 'none',
          fallback_used: false,
          cache_hit: false,
          llm_calls_used: 0,
          latency_ms: Date.now() - startedAtMs,
          attempt_count: 0,
          error_details: {
            message,
            timeout: message.toLowerCase().includes('timed out'),
          },
        },
      });
    } catch (updateError) {
      console.error('[pitch-run] failed to persist run failure status', {
        runId: input.runId,
        error: updateError instanceof Error ? updateError.message : String(updateError),
      });
    }
  }
}

function scheduleBackgroundJob(job: Promise<void>): void {
  type EdgeRuntimeLike = {
    waitUntil?: (promise: Promise<void>) => void;
  };

  const runtime = (globalThis as { EdgeRuntime?: EdgeRuntimeLike }).EdgeRuntime;
  if (runtime && typeof runtime.waitUntil === 'function') {
    runtime.waitUntil(job);
    return;
  }

  // Fallback for local/test runtimes without EdgeRuntime.waitUntil.
  // Keep reference alive and catch rejections to avoid unhandled promise crashes.
  job.catch((err) => console.error('[pitch-run] background job failed', err));
}

async function handleGet(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');
  const projectId = url.searchParams.get('projectId');
  const allProjects = url.searchParams.get('allProjects') === 'true';
  const limitParam = url.searchParams.get('limit');
  const includePending = url.searchParams.get('includePending') === 'true';
  const summary = url.searchParams.get('summary') === 'true';
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
  const parsedMode = mode === 'elevator' || mode === 'vc_pitch' ? mode : undefined;
  if (projectId && !isUuid(projectId)) {
    return errorResponse('projectId query parameter must be a valid UUID.', 400);
  }

  // When filtering by project, resolve it; otherwise skip the waterfall entirely
  const resolvedProjectId = allProjects
    ? undefined
    : projectId ?? (await resolveProjectForRequest(supabase, user.id, { mode: parsedMode })).id;

  const allRuns = await listRuns(supabase, {
    mode: parsedMode,
    projectId: resolvedProjectId,
    summary,
  });
  const visibleRuns = includePending
    ? allRuns
    : allRuns.filter((run) => run.status === 'complete');
  const runs =
    Number.isFinite(limit) && limit !== undefined
      ? visibleRuns.slice(0, limit)
      : visibleRuns;

  // Fetch QA summaries in parallel with building the response
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
  const project = await resolveProjectForRequest(supabase, user.id, {
    projectId: payload.projectId,
  });
  const mode = payload.mode;
  const analysisSystemPrompt =
    typeof project.prompt_overrides?.analysis_system_prompt === 'string'
      ? project.prompt_overrides.analysis_system_prompt
      : undefined;

  // Rate limit check
  const adminClient = createAdminClient();
  const usageCheck = await checkUsageLimit(adminClient, user.id, 'run');
  if (!usageCheck.allowed) {
    throw new RateLimitError(
      `You've used ${usageCheck.used}/${usageCheck.limit} pitch analyses this period. ` +
      `Upgrade your plan for more analyses.`,
    );
  }

  const runId = crypto.randomUUID();

  // Record usage eagerly so concurrent requests cannot bypass the limit.
  try {
    await recordUsageEvent(adminClient, user.id, 'run', runId);
  } catch (usageErr) {
    console.error('[pitch-run] failed to record usage event eagerly', {
      error: usageErr instanceof Error ? usageErr.message : String(usageErr),
    });
  }

  // Insert run as queued and process asynchronously.
  const run = await insertRun(supabase, {
    id: runId,
    user_id: user.id,
    project_id: project.id,
    mode,
    status: 'queued',
    started_at: null,
    input_type: payload.inputType,
    transcript: payload.transcript,
    audio_url: payload.audioUrl,
    deck_id: payload.deckId,
    overall_score: 0,
    analysis: {},
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

  scheduleBackgroundJob(
    processQueuedRun(adminClient, {
      runId,
      userId: user.id,
      projectType: project.type,
      mode,
      transcript: payload.transcript,
      deckText: payload.deckText,
      systemPromptOverride: analysisSystemPrompt,
    }),
  );

  return jsonResponse(
    {
      runId: run.id,
      status: 'queued',
      projectId: project.id,
      projectType: project.type,
      workflowMode: mode,
    },
    202,
  );
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
    if (error instanceof RateLimitError) {
      return errorResponse(error.message, 429);
    }
    if (error instanceof PitchValidationError) {
      return errorResponse(error.message, 400);
    }
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(error.message, 404);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process pitch run request',
      500,
    );
  }
});
