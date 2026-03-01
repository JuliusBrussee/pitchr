// Edge Function: project-doc-list
// Methods: GET (list project context documents)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { resolveProjectForRequest, ProjectNotFoundError } from '../_shared/project-service.ts';
import { listDocuments } from '../_shared/project-document-service.ts';

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
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId') ?? undefined;

    if (projectId && !isUuid(projectId)) {
      return errorResponse('projectId must be a valid UUID.', 400);
    }

    const project = await resolveProjectForRequest(supabase, user.id, { projectId });
    const documents = await listDocuments(supabase, project.id);

    return jsonResponse({ documents, projectId: project.id }, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    if (error instanceof ProjectNotFoundError) {
      return errorResponse(error.message, 404);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to list documents',
      500,
    );
  }
});
