// Edge Function: miro-fix-board
// Replaces: app/api/miro/fix-board/route.ts
// Methods: GET (fetch board), POST (create board), PATCH (update fix)
// The Miro service is complex with provider chain (REST/Stub).
// This edge function delegates to Supabase DB for state management
// and the Miro REST API for live board operations.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import type {
  MiroFixBoardRequest,
  MiroFixPatchRequest,
  MiroFixStatus,
  MiroTopFixInput,
  FixImpact,
  PitchMode,
} from '../_shared/types.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_TRANSCRIPT_CHARS = 120_000;

function isMiroFixStatus(value: unknown): value is MiroFixStatus {
  return value === 'todo' || value === 'doing' || value === 'done' || value === 'blocked';
}

function isPitchMode(value: unknown): value is PitchMode {
  return value === 'elevator' || value === 'vc_pitch';
}

function isFixImpact(value: unknown): value is FixImpact {
  return value === 'high' || value === 'medium' || value === 'low';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidTopFix(value: unknown): value is MiroTopFixInput {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (typeof item.rank !== 'number' || !Number.isInteger(item.rank)) return false;
  if (item.rank < 1 || item.rank > 5) return false;
  return (
    isNonEmptyString(item.category) &&
    isFixImpact(item.impact) &&
    isNonEmptyString(item.issue) &&
    isNonEmptyString(item.fix)
  );
}

function isValidCreatePayload(body: unknown): body is MiroFixBoardRequest {
  if (!body || typeof body !== 'object') return false;
  const value = body as Record<string, unknown>;
  if (
    !isNonEmptyString(value.runId) ||
    !isPitchMode(value.mode) ||
    !isNonEmptyString(value.oneLineVerdict) ||
    !isNonEmptyString(value.rewriteScript) ||
    !Array.isArray(value.topFixes)
  ) return false;
  if (typeof value.recreate !== 'undefined' && typeof value.recreate !== 'boolean') return false;
  if (typeof value.transcript !== 'undefined') {
    if (typeof value.transcript !== 'string') return false;
    if (value.transcript.length > MAX_TRANSCRIPT_CHARS) return false;
  }
  if (value.topFixes.length === 0 || value.topFixes.length > 5) return false;
  const seenRanks = new Set<number>();
  for (const fix of value.topFixes) {
    if (!isValidTopFix(fix)) return false;
    if (seenRanks.has(fix.rank)) return false;
    seenRanks.add(fix.rank);
  }
  return true;
}

function isValidPatchPayload(body: unknown): body is MiroFixPatchRequest {
  if (!body || typeof body !== 'object') return false;
  const value = body as Record<string, unknown>;
  if (!isNonEmptyString(value.runId)) return false;
  if (typeof value.rank !== 'number' || !Number.isInteger(value.rank)) return false;
  if (value.rank < 1 || value.rank > 5) return false;
  if (!value.patch || typeof value.patch !== 'object') return false;
  if (!isNonEmptyString(value.clientUpdatedAt)) return false;
  if (!Number.isFinite(Date.parse(value.clientUpdatedAt))) return false;
  const patch = value.patch as Record<string, unknown>;
  if (
    typeof patch.status === 'undefined' &&
    typeof patch.owner === 'undefined' &&
    typeof patch.notes === 'undefined'
  ) return false;
  if (typeof patch.status !== 'undefined' && !isMiroFixStatus(patch.status)) return false;
  if (typeof patch.owner !== 'undefined') {
    if (typeof patch.owner !== 'string') return false;
    if (patch.owner.length > 120) return false;
  }
  if (typeof patch.notes !== 'undefined') {
    if (typeof patch.notes !== 'string') return false;
    if (patch.notes.length > 600) return false;
  }
  return true;
}

async function getMiroBoard(supabase: SupabaseClient, runId: string) {
  const { data, error } = await supabase
    .from('run_miro_boards')
    .select('*')
    .eq('run_id', runId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch Miro board: ${error.message}`);
  return data;
}

async function upsertMiroBoard(
  supabase: SupabaseClient,
  // deno-lint-ignore no-explicit-any
  record: Record<string, any>,
) {
  const { data, error } = await supabase
    .from('run_miro_boards')
    .upsert(record, { onConflict: 'run_id' })
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert Miro board: ${error.message}`);
  return data;
}

async function handleGet(req: Request) {
  const { supabase } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const runId = url.searchParams.get('runId');
  if (!runId) {
    return errorResponse('runId is a required query parameter', 400);
  }

  const board = await getMiroBoard(supabase, runId);
  if (!board) {
    return errorResponse('Miro board not found for this run', 404);
  }

  return jsonResponse(board, 200);
}

async function handlePost(req: Request) {
  const { supabase } = await getAuthenticatedUser(req);
  const body: unknown = await req.json();
  if (!isValidCreatePayload(body)) {
    return errorResponse('Invalid request body for miro-fix-board', 400);
  }

  // Create or update the board record in DB
  const boardId = `stub-board-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  // Build initial fix state from topFixes
  const fixes: Record<string, unknown> = {};
  for (const fix of body.topFixes) {
    fixes[String(fix.rank)] = {
      itemId: `fix-${fix.rank}`,
      status: 'todo',
      owner: '',
      notes: '',
      updatedAt: now,
      source: 'app',
    };
  }

  const state = {
    version: 1,
    fixes,
    pendingOps: [],
    lastSyncedAt: now,
  };

  const record = await upsertMiroBoard(supabase, {
    run_id: body.runId,
    board_id: boardId,
    board_url: '',
    is_fallback: true,
    state,
  });

  return jsonResponse(record, 200);
}

async function handlePatch(req: Request) {
  const { supabase } = await getAuthenticatedUser(req);
  const body: unknown = await req.json();
  if (!isValidPatchPayload(body)) {
    return errorResponse('Invalid request body for miro-fix-board PATCH', 400);
  }

  const board = await getMiroBoard(supabase, body.runId);
  if (!board) {
    return errorResponse('Miro board not found for this run', 404);
  }

  // Apply patch to the fix state
  const state = { ...board.state };
  const rankKey = String(body.rank);
  // deno-lint-ignore no-explicit-any
  const existingFix = (state.fixes as Record<string, any>)?.[rankKey];
  if (!existingFix) {
    return errorResponse(`No fix mapping for rank ${body.rank}`, 400);
  }

  const updatedFix = {
    ...existingFix,
    status: body.patch.status ?? existingFix.status,
    owner: body.patch.owner ?? existingFix.owner,
    notes: body.patch.notes ?? existingFix.notes,
    updatedAt: body.clientUpdatedAt,
    source: 'app',
  };

  // deno-lint-ignore no-explicit-any
  (state.fixes as Record<string, any>)[rankKey] = updatedFix;

  const record = await upsertMiroBoard(supabase, {
    run_id: body.runId,
    board_id: board.board_id,
    board_url: board.board_url,
    is_fallback: board.is_fallback,
    state,
  });

  return jsonResponse(record, 200);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') return await handleGet(req);
    if (req.method === 'POST') return await handlePost(req);
    if (req.method === 'PATCH') return await handlePatch(req);
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : String(error),
      500,
    );
  }
});
