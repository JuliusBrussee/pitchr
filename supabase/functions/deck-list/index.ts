// Edge Function: deck-list
// Replaces: app/api/deck/route.ts
// Methods: GET (list all decks)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { listDecks } from '../_shared/deck-service.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase } = await getAuthenticatedUser(req);
    const decks = await listDecks(supabase);
    return jsonResponse(decks);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to list decks',
      500,
    );
  }
});
