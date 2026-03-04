import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { acceptCompliance } from '../_shared/compliance-service.ts';

interface AcceptBody {
  termsAccepted?: unknown;
  privacyNoticeAcknowledged?: unknown;
  analyticsOptIn?: unknown;
  marketingOptIn?: unknown;
}

async function handlePost(req: Request): Promise<Response> {
  const { supabase, user } = await getAuthenticatedUser(req);

  let body: AcceptBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  if (body.termsAccepted !== true) {
    return errorResponse('termsAccepted must be true.', 400);
  }
  if (body.privacyNoticeAcknowledged !== true) {
    return errorResponse('privacyNoticeAcknowledged must be true.', 400);
  }

  const status = await acceptCompliance(supabase, req, user.id, {
    termsAccepted: true,
    privacyNoticeAcknowledged: true,
    analyticsOptIn: body.analyticsOptIn === true,
    marketingOptIn: body.marketingOptIn === true,
  });

  return jsonResponse({
    accepted: true,
    status,
  }, 200);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'POST') return await handlePost(req);
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to accept compliance terms',
      500,
    );
  }
});