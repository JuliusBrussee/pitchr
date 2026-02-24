// Edge Function: pitch-run-stats
// Replaces: app/api/pitch/run/stats/route.ts
// Methods: GET

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { getRunStats } from '../_shared/run-service.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase } = await getAuthenticatedUser(req);
    const stats = await getRunStats(supabase);
    return jsonResponse(stats);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get stats',
      500,
    );
  }
});
