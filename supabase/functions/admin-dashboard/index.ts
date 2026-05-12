// Edge Function: admin-dashboard
// Returns aggregated admin metrics from reporting views via RPC.
// Methods:
//   GET  — full dashboard data (kpis, funnel, users, revenue, retention)
//   HEAD — lightweight admin check (returns 200 if admin, 403 if not)
//
// Requires ADMIN_EMAILS env var (comma-separated) or falls back to @pitchr.live domain.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError, createAdminClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ADMIN_DOMAIN = 'pitchr.live';

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;

  const envEmails = Deno.env.get('ADMIN_EMAILS');
  if (envEmails) {
    const allowed = envEmails.split(',').map((e) => e.trim().toLowerCase());
    return allowed.includes(email.toLowerCase());
  }

  return email.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { user } = getAuthenticatedUser(req);

    if (!isAdmin(user.email)) {
      return errorResponse('Forbidden', 403);
    }

    // HEAD = lightweight admin check, no data needed
    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // GET = full dashboard data via RPC
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('get_admin_dashboard');

    if (error) {
      console.error('[admin-dashboard] RPC error:', error);
      return errorResponse('Failed to load dashboard data', 500);
    }

    return jsonResponse(data);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    console.error('[admin-dashboard]', error);
    return errorResponse('Failed to load admin dashboard', 500);
  }
});
