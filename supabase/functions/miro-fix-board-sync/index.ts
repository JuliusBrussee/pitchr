// Edge Function: miro-fix-board-sync
// Replaces: app/api/miro/fix-board/sync/route.ts
// Methods: GET (sync board state)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse, rateLimitResponse } from '../_shared/response.ts';
import { checkRateLimit, RateLimitExceededError } from '../_shared/rate-limit.ts';
import { assertComplianceForEndpoint } from '../_shared/compliance-service.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';

async function getMiroBoard(supabase: SupabaseClient, runId: string) {
  const { data, error } = await supabase
    .from('run_miro_boards')
    .select('*')
    .eq('run_id', runId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch Miro board: ${error.message}`);
  return data;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'miro-fix-board-sync');
    if (complianceResponse) return complianceResponse;
    await checkRateLimit(user.id, 'miro-fix-board-sync');
    const url = new URL(req.url);
    const runId = url.searchParams.get('runId');

    if (!runId) {
      return errorResponse('runId is a required query parameter', 400);
    }

    const board = await getMiroBoard(supabase, runId);
    if (!board) {
      return errorResponse('Miro board not found for this run', 404);
    }

    // Return the persisted state as the sync snapshot
    // Full two-way Miro API sync requires the provider chain from the Node.js service
    const state = board.state;
    const fixes = Object.entries(state?.fixes ?? {})
      .map(([rankKey, fix]: [string, unknown]) => {
        const f = fix as Record<string, unknown>;
        return {
          rank: Number.parseInt(rankKey, 10),
          status: f.status,
          owner: f.owner || undefined,
          notes: f.notes || undefined,
          updatedAt: f.updatedAt,
          itemId: f.itemId,
          source: f.source,
          conflict: false,
        };
      })
      .filter((fix) => Number.isFinite(fix.rank))
      .sort((a, b) => a.rank - b.rank);

    const snapshot = {
      boardId: board.board_id,
      syncedAt: state?.lastSyncedAt ?? new Date().toISOString(),
      fixes,
      warnings: [] as string[],
      queuedOps: state?.pendingOps?.length ?? 0,
      degraded: false,
      conflicts: 0,
      version: state?.version ?? 1,
      fallback: board.is_fallback,
    };

    return jsonResponse(snapshot, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error.message, error.retryAfter);
    }
    return errorResponse(
      error instanceof Error ? error.message : String(error),
      500,
    );
  }
});
