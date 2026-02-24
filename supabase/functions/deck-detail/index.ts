// Edge Function: deck-detail
// Replaces: app/api/deck/[deckId]/route.ts
// Methods: GET (fetch deck with slides), DELETE (delete deck)
// URL pattern: /deck-detail?deckId=<uuid>

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { getDeckWithSlides, deleteDeck } from '../_shared/deck-service.ts';

async function handleGet(req: Request) {
  const { supabase } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const deckId = url.searchParams.get('deckId');
  if (!deckId) return errorResponse('deckId query parameter is required', 400);

  const result = await getDeckWithSlides(supabase, deckId);
  return jsonResponse(result);
}

async function handleDelete(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const deckId = url.searchParams.get('deckId');
  if (!deckId) return errorResponse('deckId query parameter is required', 400);

  await deleteDeck(supabase, user.id, deckId);
  return jsonResponse({ success: true });
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
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process deck request',
      500,
    );
  }
});
