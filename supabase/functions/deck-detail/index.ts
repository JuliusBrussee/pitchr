// Edge Function: deck-detail
// Replaces: app/api/deck/[deckId]/route.ts
// Methods: GET (fetch deck with slides), PATCH (move deck to project), DELETE (delete deck)
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

async function handlePatch(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);
  const url = new URL(req.url);
  const deckId = url.searchParams.get('deckId');
  if (!deckId) return errorResponse('deckId query parameter is required', 400);

  const body = await req.json();
  const { projectId } = body;
  if (!projectId) return errorResponse('projectId is required', 400);

  // Verify deck belongs to user
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('id, project_id')
    .eq('id', deckId)
    .single();

  if (deckError || !deck) return errorResponse('Deck not found', 404);

  // Verify source project belongs to user
  const { data: sourceProject } = await supabase
    .from('projects')
    .select('id')
    .eq('id', deck.project_id)
    .eq('user_id', user.id)
    .single();

  if (!sourceProject) return errorResponse('Source project not found or not owned by user', 403);

  // Verify target project belongs to user
  const { data: targetProject } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!targetProject) return errorResponse('Target project not found or not owned by user', 403);

  // Move deck
  const { error: updateError } = await supabase
    .from('decks')
    .update({ project_id: projectId })
    .eq('id', deckId);

  if (updateError) return errorResponse('Failed to move deck', 500);

  return jsonResponse({ success: true, deckId, projectId });
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
    if (req.method === 'PATCH') return await handlePatch(req);
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
