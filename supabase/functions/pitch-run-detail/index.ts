// Edge Function: pitch-run-detail
// Replaces: app/api/pitch/run/[runId]/route.ts
// Methods: GET (fetch run), DELETE (delete run)
// URL pattern: /pitch-run-detail?runId=<uuid>

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { checkRateLimit, RateLimitExceededError } from '../_shared/rate-limit.ts';
import { getRun, deleteRun, RunNotFoundError, toRunResponse } from '../_shared/run-service.ts';
import { listQASessionSummariesByRunIds } from '../_shared/qna-session-service.ts';
import { deleteRecordingByUrl } from '../_shared/recording-service.ts';
import { assertComplianceForEndpoint } from '../_shared/compliance-service.ts';
import type { Run } from '../_shared/types.ts';

async function handleGet(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'pitch-run-detail');
  if (complianceResponse) return complianceResponse;
  await checkRateLimit(user.id, 'pitch-run-detail');
  const url = new URL(req.url);
  const runId = url.searchParams.get('runId');
  if (!runId) return errorResponse('runId query parameter is required', 400);

  const run = await getRun(supabase, runId);
  let qaSessionsSummary: Run['qaSessionsSummary'];
  try {
    const summaryMap = await listQASessionSummariesByRunIds(supabase, [run.id]);
    qaSessionsSummary = summaryMap.get(run.id);
  } catch {
    qaSessionsSummary = undefined;
  }
  return jsonResponse({ run: toRunResponse(run, qaSessionsSummary) }, 200);
}

async function handleDelete(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'pitch-run-detail');
  if (complianceResponse) return complianceResponse;
  await checkRateLimit(user.id, 'pitch-run-detail');
  const url = new URL(req.url);
  const runId = url.searchParams.get('runId');
  if (!runId) return errorResponse('runId query parameter is required', 400);

  // Clean up recording file (best-effort)
  try {
    const run = await getRun(supabase, runId);
    if (run.audio_url) {
      await deleteRecordingByUrl(supabase, run.audio_url);
    }
  } catch {
    // Recording may not exist or run fetch may fail — proceed with deletion
  }
  await deleteRun(supabase, runId);
  return jsonResponse({ deleted: true }, 200);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') return await handleGet(req);
    if (req.method === 'DELETE') return await handleDelete(req);
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    if (error instanceof RateLimitExceededError) {
      return errorResponse(error.message, 429);
    }
    if (error instanceof RunNotFoundError) {
      return errorResponse('Run not found', 404);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process run request',
      500,
    );
  }
});
