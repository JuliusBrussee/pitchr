// Edge Function: deck-list
// Replaces: app/api/deck/route.ts
// Methods: GET (list all decks)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse, rateLimitResponse } from '../_shared/response.ts';
import { checkRateLimit, RateLimitExceededError } from '../_shared/rate-limit.ts';
import { listDecks } from '../_shared/deck-service.ts';
import { resolveProjectForRequest, ProjectNotFoundError } from '../_shared/project-service.ts';
import { assertComplianceForEndpoint } from '../_shared/compliance-service.ts';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'deck-list');
    if (complianceResponse) return complianceResponse;
    await checkRateLimit(user.id, 'deck-list');
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const allProjects = url.searchParams.get('allProjects') === 'true';
    if (projectId && !isUuid(projectId)) {
      return errorResponse('projectId query parameter must be a valid UUID.', 400);
    }
    const project = allProjects
      ? null
      : await resolveProjectForRequest(supabase, user.id, {
        projectId: projectId ?? undefined,
      });
    const decks = await listDecks(supabase, { projectId: project?.id });
    return jsonResponse(decks);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error.message, error.retryAfter);
    }
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(error.message, 404);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to list decks',
      500,
    );
  }
});
