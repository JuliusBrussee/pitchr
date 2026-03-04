// Edge Function: miro-fix-board
// Replaces: app/api/miro/fix-board/route.ts
// Methods: GET (fetch board), POST (create board), PATCH (update fix)
// The Miro service is complex with provider chain (REST/Stub).
// This edge function delegates to Supabase DB for state management
// and the Miro REST API for live board operations.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { assertComplianceForEndpoint } from '../_shared/compliance-service.ts';
import type {
  MiroFixBoardRequest,
  MiroFixPatchRequest,
  MiroFixStatus,
  MiroTopFixInput,
  FixImpact,
  PitchMode,
} from '../_shared/types.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';

const MAX_TRANSCRIPT_CHARS = 120_000;
const STUB_BOARD_PREFIX = 'stub-board-';

interface PersistedFixState {
  itemId: string;
  status: MiroFixStatus;
  owner: string;
  notes: string;
  updatedAt: string;
  source: 'app' | 'miro' | 'system';
}

interface PersistedBoardState {
  version: number;
  fixes: Record<string, PersistedFixState>;
  pendingOps: unknown[];
  lastSyncedAt: string;
}

interface RunMiroBoardRow {
  run_id: string;
  board_id: string;
  board_url: string;
  is_fallback: boolean;
  state: unknown;
  created_at: string;
}

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
  return (data as RunMiroBoardRow | null);
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
  return (data as RunMiroBoardRow);
}

function toBoardUrl(boardId: string, boardUrl: unknown) {
  if (typeof boardUrl === 'string' && boardUrl.trim().length > 0) {
    return boardUrl;
  }
  return `https://miro.com/app/board/${boardId}/`;
}

function normalizeFixStatus(value: unknown): MiroFixStatus {
  return isMiroFixStatus(value) ? value : 'todo';
}

function normalizeFixSource(value: unknown): PersistedFixState['source'] {
  if (value === 'app' || value === 'miro' || value === 'system') return value;
  return 'system';
}

function normalizeState(rawState: unknown, nowIso: string): PersistedBoardState {
  if (!rawState || typeof rawState !== 'object') {
    return {
      version: 1,
      fixes: {},
      pendingOps: [],
      lastSyncedAt: nowIso,
    };
  }

  const value = rawState as Record<string, unknown>;
  const fixesRaw =
    value.fixes && typeof value.fixes === 'object'
      ? (value.fixes as Record<string, unknown>)
      : {};

  const fixes: Record<string, PersistedFixState> = {};
  for (const [rankKey, rawFix] of Object.entries(fixesRaw)) {
    if (!rawFix || typeof rawFix !== 'object') continue;
    const fix = rawFix as Record<string, unknown>;
    const itemId =
      typeof fix.itemId === 'string' && fix.itemId.trim().length > 0
        ? fix.itemId
        : `fix-${rankKey}`;
    fixes[rankKey] = {
      itemId,
      status: normalizeFixStatus(fix.status),
      owner: typeof fix.owner === 'string' ? fix.owner : '',
      notes: typeof fix.notes === 'string' ? fix.notes : '',
      updatedAt:
        typeof fix.updatedAt === 'string' && fix.updatedAt
          ? fix.updatedAt
          : nowIso,
      source: normalizeFixSource(fix.source),
    };
  }

  return {
    version:
      typeof value.version === 'number' && Number.isFinite(value.version) && value.version > 0
        ? value.version
        : 1,
    fixes,
    pendingOps: Array.isArray(value.pendingOps) ? value.pendingOps : [],
    lastSyncedAt:
      typeof value.lastSyncedAt === 'string' && value.lastSyncedAt
        ? value.lastSyncedAt
        : nowIso,
  };
}

function buildSnapshot(board: RunMiroBoardRow) {
  const nowIso = new Date().toISOString();
  const state = normalizeState(board.state, nowIso);
  const fixes = Object.entries(state.fixes)
    .map(([rankKey, fix]) => {
      const rank = Number.parseInt(rankKey, 10);
      return {
        rank,
        status: fix.status,
        owner: fix.owner || undefined,
        notes: fix.notes || undefined,
        updatedAt: fix.updatedAt,
        itemId: fix.itemId,
        source: fix.source,
        conflict: false,
      };
    })
    .filter((fix) => Number.isFinite(fix.rank))
    .sort((a, b) => a.rank - b.rank);

  return {
    boardId: board.board_id,
    syncedAt: state.lastSyncedAt,
    fixes,
    warnings: [] as string[],
    queuedOps: state.pendingOps.length,
    degraded: false,
    conflicts: 0,
    version: state.version,
    fallback: board.is_fallback,
    message: board.is_fallback
      ? 'Using stub Miro provider. Configure live credentials for real board sync.'
      : undefined,
  };
}

function toGetResponse(board: RunMiroBoardRow) {
  return {
    boardId: board.board_id,
    boardUrl: toBoardUrl(board.board_id, board.board_url),
    createdAt: board.created_at,
    snapshot: buildSnapshot(board),
    fallback: board.is_fallback,
  };
}

function buildInitialState(topFixes: MiroTopFixInput[], nowIso: string): PersistedBoardState {
  const fixes: Record<string, PersistedFixState> = {};
  for (const fix of topFixes) {
    fixes[String(fix.rank)] = {
      itemId: `fix-${fix.rank}`,
      status: 'todo',
      owner: '',
      notes: '',
      updatedAt: nowIso,
      source: 'app',
    };
  }
  return {
    version: 1,
    fixes,
    pendingOps: [],
    lastSyncedAt: nowIso,
  };
}

async function handleGet(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'miro-fix-board');
  if (complianceResponse) return complianceResponse;
  const url = new URL(req.url);
  const runId = url.searchParams.get('runId');
  if (!runId) {
    return errorResponse('runId is a required query parameter', 400);
  }

  const board = await getMiroBoard(supabase, runId);
  if (!board) {
    return errorResponse('Miro board not found for this run', 404);
  }

  return jsonResponse(toGetResponse(board), 200);
}

async function handlePost(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'miro-fix-board');
  if (complianceResponse) return complianceResponse;
  const body: unknown = await req.json();
  if (!isValidCreatePayload(body)) {
    return errorResponse('Invalid request body for miro-fix-board', 400);
  }

  const existing = await getMiroBoard(supabase, body.runId);
  if (existing && !body.recreate) {
    return jsonResponse(
      {
        ...toGetResponse(existing),
        reused: true,
      },
      200,
    );
  }

  const boardId = `${STUB_BOARD_PREFIX}${crypto.randomUUID()}`;
  const boardUrl = `https://miro.com/app/board/${boardId}/`;
  const now = new Date().toISOString();
  const state = buildInitialState(body.topFixes, now);

  const record = await upsertMiroBoard(supabase, {
    run_id: body.runId,
    board_id: boardId,
    board_url: boardUrl,
    is_fallback: true,
    state,
  });

  return jsonResponse(
    {
      ...toGetResponse(record),
      reused: false,
      message:
        existing && body.recreate
          ? 'Recreated stub Miro board for this run.'
          : 'Created stub Miro board for this run.',
    },
    200,
  );
}

async function handlePatch(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'miro-fix-board');
  if (complianceResponse) return complianceResponse;
  const body: unknown = await req.json();
  if (!isValidPatchPayload(body)) {
    return errorResponse('Invalid request body for miro-fix-board PATCH', 400);
  }

  const board = await getMiroBoard(supabase, body.runId);
  if (!board) {
    return errorResponse('Miro board not found for this run', 404);
  }

  const state = normalizeState(board.state, new Date().toISOString());
  const rankKey = String(body.rank);
  const existingFix = state.fixes[rankKey];
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
  state.fixes[rankKey] = updatedFix;
  state.lastSyncedAt = body.clientUpdatedAt;

  const record = await upsertMiroBoard(supabase, {
    run_id: body.runId,
    board_id: board.board_id,
    board_url: toBoardUrl(board.board_id, board.board_url),
    is_fallback: board.is_fallback,
    state,
  });

  return jsonResponse(
    {
      accepted: true,
      queued: false,
      snapshot: buildSnapshot(record),
    },
    200,
  );
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
