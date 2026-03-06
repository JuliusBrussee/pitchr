import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { checkRateLimit, RateLimitExceededError } from '../_shared/rate-limit.ts';
import { updateComplianceConsents } from '../_shared/compliance-service.ts';

interface ConsentsBody {
  analyticsOptIn?: unknown;
  marketingOptIn?: unknown;
}

async function handlePatch(req: Request): Promise<Response> {
  const { supabase, user } = await getAuthenticatedUser(req);
  await checkRateLimit(user.id, 'compliance-consents');

  let body: ConsentsBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const hasAnalytics = typeof body.analyticsOptIn === 'boolean';
  const hasMarketing = typeof body.marketingOptIn === 'boolean';

  if (!hasAnalytics && !hasMarketing) {
    return errorResponse('Provide at least one consent flag.', 400);
  }

  const status = await updateComplianceConsents(supabase, req, user.id, {
    analyticsOptIn: hasAnalytics ? Boolean(body.analyticsOptIn) : undefined,
    marketingOptIn: hasMarketing ? Boolean(body.marketingOptIn) : undefined,
  });

  return jsonResponse({
    updated: true,
    status,
  }, 200);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'PATCH') return await handlePatch(req);
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    if (error instanceof RateLimitExceededError) {
      return errorResponse(error.message, 429);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update consent settings',
      500,
    );
  }
});