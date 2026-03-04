import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { buildComplianceStatus } from '../_shared/compliance-service.ts';

async function handleGet(req: Request): Promise<Response> {
  const { supabase, user } = await getAuthenticatedUser(req);
  const status = await buildComplianceStatus(supabase, req, user.id);
  return jsonResponse(status, 200);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') return await handleGet(req);
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to load compliance status',
      500,
    );
  }
});