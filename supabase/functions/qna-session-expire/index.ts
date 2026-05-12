// Edge Function: qna-session-expire
// Server-side safety net that expires stale QA sessions and records billing.
// Intended to run on a schedule (e.g. every 60s via Supabase cron) or be
// invoked manually. Catches sessions where the client never called complete.

import { handleCors } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { recordQaSecondsUsage } from '../_shared/billing-service.ts';

/**
 * Sessions older than this many seconds past their duration limit
 * are considered stale and will be expired.
 */
const STALE_BUFFER_SECONDS = 30;

interface StaleSessionRow {
  id: string;
  user_id: string;
  started_at: string;
  meta: Record<string, unknown> | null;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Accept both POST (cron) and GET (manual trigger)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();

    // Find all sessions that are still 'active' or 'created' and have been
    // running longer than their duration_limit + buffer.
    // We query broadly and filter in code since meta is JSONB.
    const { data: sessions, error } = await supabase
      .from('qa_sessions')
      .select('id, user_id, started_at, meta')
      .in('status', ['active', 'created'])
      .lt('started_at', new Date(now.getTime() - STALE_BUFFER_SECONDS * 1000).toISOString())
      .order('started_at', { ascending: true })
      .limit(50);

    if (error) {
      return errorResponse(`Failed to query sessions: ${error.message}`, 500);
    }

    const stale = (sessions ?? []) as StaleSessionRow[];
    // Build list of sessions to expire with computed billing info
    const toExpire = stale.flatMap((session) => {
      const startedAtMs = Date.parse(session.started_at);
      if (!Number.isFinite(startedAtMs)) return [];

      const elapsedSeconds = (now.getTime() - startedAtMs) / 1000;
      const durationLimit =
        typeof session.meta?.duration_limit_seconds === 'number'
          ? session.meta.duration_limit_seconds as number
          : 60;
      const gracePeriod =
        typeof session.meta?.grace_period_seconds === 'number'
          ? session.meta.grace_period_seconds as number
          : 10;

      if (elapsedSeconds <= durationLimit + STALE_BUFFER_SECONDS) return [];

      const cappedDuration = Math.min(Math.round(elapsedSeconds), durationLimit);
      const isGrace = cappedDuration <= gracePeriod;
      const billable = isGrace ? 0 : cappedDuration;

      return [{ session, cappedDuration, isGrace, billable, elapsedSeconds }];
    });

    // Process all stale sessions in parallel
    const results = await Promise.allSettled(
      toExpire.map(async ({ session, cappedDuration, isGrace, billable, elapsedSeconds }) => {
        const ops: Promise<unknown>[] = [];

        if (billable > 0) {
          // Check if user has active day pass
          const dayPassCheck = await supabase
            .from('day_passes')
            .select('id')
            .eq('user_id', session.user_id)
            .eq('status', 'active')
            .gt('expires_at', now.toISOString())
            .limit(1)
            .single();

          if (!dayPassCheck.data) {
            // Credit user: consume 1 credit for QA session
            ops.push(
              supabase.rpc('consume_credits', {
                p_user_id: session.user_id,
                p_amount: 1,
                p_source: 'qa_session',
                p_reference_id: session.id,
                p_description: `QA session expired (${billable}s)`,
              }).then(() => {}),
            );
          }

          // Always record QA seconds for analytics
          ops.push(recordQaSecondsUsage(supabase, session.user_id, billable));
        }

        ops.push(
          supabase
            .from('qa_sessions')
            .update({
              status: 'expired',
              completed_at: now.toISOString(),
              duration_seconds: cappedDuration,
              meta: {
                ...(session.meta ?? {}),
                expired_by_server: true,
                billable_seconds: billable,
                grace_period_applied: isGrace,
                server_expire_elapsed: Math.round(elapsedSeconds),
              },
              updated_at: now.toISOString(),
            })
            .eq('id', session.id),
        );

        await Promise.all(ops);
        return billable;
      }),
    );

    let expiredCount = 0;
    let billedSeconds = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        expiredCount++;
        billedSeconds += result.value;
      } else {
        console.error('[qna-session-expire] failed to expire session', result.reason);
      }
    }

    return jsonResponse({
      checked: stale.length,
      expired: expiredCount,
      billedSeconds,
    }, 200);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : 'Failed to expire sessions',
      500,
    );
  }
});
