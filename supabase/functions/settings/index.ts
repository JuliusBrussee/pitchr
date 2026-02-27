// Edge Function: settings
// Methods: GET (fetch user settings), PATCH (upsert user settings)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

const DEFAULTS = {
  feedback_intensity: 'balanced',
  realtime_coaching: true,
  post_session_report: true,
  focus_areas: ['clarity', 'pacing', 'filler'],
  auto_record: false,
  timer_seconds: 300,
  theme: 'system',
  compact_mode: false,
  active_project_id: null as string | null,
};

const SETTING_COLUMNS = Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[];

async function handleGet(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }

  if (!data) {
    return jsonResponse(DEFAULTS);
  }

  // Return only the known setting fields
  const result: Record<string, unknown> = {};
  for (const key of SETTING_COLUMNS) {
    result[key] = data[key] ?? DEFAULTS[key];
  }
  return jsonResponse(result);
}

async function handlePatch(req: Request) {
  const { supabase, user } = await getAuthenticatedUser(req);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  // Filter to only known setting columns
  const updates: Record<string, unknown> = {};
  for (const key of SETTING_COLUMNS) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse('No valid settings fields provided', 400);
  }

  // Upsert: insert if no row exists, update if it does
  const { data, error } = await supabase
    .from('settings')
    .upsert(
      {
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  const result: Record<string, unknown> = {};
  for (const key of SETTING_COLUMNS) {
    result[key] = data[key] ?? DEFAULTS[key];
  }
  return jsonResponse(result);
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') return await handleGet(req);
    if (req.method === 'PATCH') return await handlePatch(req);
    return errorResponse('Method not allowed', 405);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process settings request',
      500,
    );
  }
});
