// Edge Function: qna-resources-refresh
// Replaces: app/api/qna/resources/refresh/route.ts
// Methods: POST (refresh queued knowledge resources)
//
// Note: The original service uses child_process to run yarn scripts,
// which is not available in Deno edge functions. This edge function
// provides a DB-based status endpoint. The actual refresh processing
// should be triggered via a separate mechanism (e.g., cron job, webhook).

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { assertComplianceForEndpoint } from '../_shared/compliance-service.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const payload = body as { limit?: number };
  const limit =
    typeof payload.limit === 'number' && Number.isFinite(payload.limit) && payload.limit > 0
      ? Math.min(20, Math.round(payload.limit))
      : 5;

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'qna-resources-refresh');
    if (complianceResponse) return complianceResponse;

    // Query the resource gaps table for status counts
    const adminClient = createAdminClient();

    const [queuedRes, processingRes, doneRes, failedRes] = await Promise.all([
      adminClient.from('qa_resource_gaps').select('id', { count: 'exact' }).eq('status', 'queued').limit(limit),
      adminClient.from('qa_resource_gaps').select('id', { count: 'exact' }).eq('status', 'processing'),
      adminClient.from('qa_resource_gaps').select('id', { count: 'exact' }).eq('status', 'done'),
      adminClient.from('qa_resource_gaps').select('id', { count: 'exact' }).eq('status', 'failed'),
    ]);

    return jsonResponse({
      processed: (doneRes.count ?? 0),
      queued: (queuedRes.count ?? 0) + (processingRes.count ?? 0),
      failed: (failedRes.count ?? 0),
    }, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to refresh resources.',
      500,
    );
  }
});
