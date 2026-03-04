// Edge Function: qna-session-detail
// Replaces: app/api/qna/session/[qaSessionId]/route.ts
// Methods: GET (fetch QA session, auto-expire if timed out)
// URL pattern: /qna-session-detail?qaSessionId=<uuid>

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { expireQASessionIfTimedOut } from '../_shared/qna-session-service.ts';
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

  const url = new URL(req.url);
  const qaSessionId = url.searchParams.get('qaSessionId') ?? '';
  if (!isUuid(qaSessionId)) {
    return errorResponse('qaSessionId must be a valid UUID.', 400);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'qna-session-detail');
    if (complianceResponse) return complianceResponse;
    const qaSession = await expireQASessionIfTimedOut(supabase, qaSessionId);
    if (!qaSession) {
      return errorResponse('QA session not found.', 404);
    }
    return jsonResponse({ qaSession }, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch QA session.',
      500,
    );
  }
});
