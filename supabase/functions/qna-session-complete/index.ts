// Edge Function: qna-session-complete
// Replaces: app/api/qna/session/[qaSessionId]/complete/route.ts
// Methods: POST (complete QA session with transcript/turns/evaluation)
// URL pattern: /qna-session-complete?qaSessionId=<uuid>

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, createAdminClient, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse, rateLimitResponse } from '../_shared/response.ts';
import { checkRateLimit, RateLimitExceededError } from '../_shared/rate-limit.ts';
import { completeQASession, getQASession } from '../_shared/qna-session-service.ts';
import { getConversation } from '../_shared/elevenlabs-convai.ts';
import { recordQaSecondsUsage } from '../_shared/billing-service.ts';
import { assertComplianceForEndpoint } from '../_shared/compliance-service.ts';
import type { QATurn } from '../_shared/types.ts';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

function normalizeTurns(value: unknown): QATurn[] {
  if (!Array.isArray(value)) return [];
  const turns: QATurn[] = [];
  value.forEach((turn, index) => {
    if (!turn || typeof turn !== 'object') return;
    const row = turn as Record<string, unknown>;
    const text = typeof row.text === 'string' ? row.text.trim() : '';
    if (!text) return;
    const speaker: QATurn['speaker'] =
      row.speaker === 'investor' || row.speaker === 'founder' || row.speaker === 'system'
        ? row.speaker
        : 'system';
    turns.push({
      id: String(row.id ?? `turn-${index + 1}`),
      speaker,
      text,
      start_sec:
        typeof row.start_sec === 'number' && Number.isFinite(row.start_sec)
          ? row.start_sec
          : undefined,
      end_sec:
        typeof row.end_sec === 'number' && Number.isFinite(row.end_sec)
          ? row.end_sec
          : undefined,
      latency_ms:
        typeof row.latency_ms === 'number' && Number.isFinite(row.latency_ms)
          ? row.latency_ms
          : undefined,
      created_at:
        typeof row.created_at === 'string' && row.created_at
          ? row.created_at
          : new Date().toISOString(),
    });
  });
  return turns;
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const url = new URL(req.url);
  const qaSessionId = url.searchParams.get('qaSessionId') ?? '';
  if (!isUuid(qaSessionId)) {
    return errorResponse('qaSessionId must be a valid UUID.', 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }

  // deno-lint-ignore no-explicit-any
  const payload = body as any;

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'qna-session-complete');
    if (complianceResponse) return complianceResponse;
    await checkRateLimit(user.id, 'qna-session-complete');
    const session = await getQASession(supabase, qaSessionId);
    if (!session) {
      return errorResponse('QA session not found.', 404);
    }

    // Idempotency: if session is already completed/expired/failed, return it as-is.
    // This prevents double-billing when the client retries a failed persist request.
    if (session.status === 'completed' || session.status === 'expired' || session.status === 'failed') {
      return jsonResponse({ qaSession: session }, 200);
    }

    const conversationId = payload.conversationId ?? session.conversationId;
    let transcript = payload.transcript;
    let turns = payload.turns ?? [];
    let conversationMeta: Record<string, unknown> = {};

    if (conversationId && (!transcript || turns.length === 0)) {
      try {
        const conversation = await getConversation(conversationId);
        conversationMeta = {
          ...(conversation.metadata ?? {}),
          conversation_status: conversation.status,
        };
        if (!transcript && typeof conversation.transcript === 'string') {
          transcript = conversation.transcript;
        }
        if (turns.length === 0 && Array.isArray(conversation.turns)) {
          turns = normalizeTurns(conversation.turns);
        }
      } catch {
        // Keep client-provided payload if upstream conversation fetch fails.
      }
    }

    const normalizedTurns = normalizeTurns(turns);
    const durationSeconds =
      typeof payload.durationSeconds === 'number' && payload.durationSeconds >= 0
        ? payload.durationSeconds
        : Math.max(
            0,
            Math.round((Date.now() - Date.parse(session.startedAt)) / 1000),
          );

    // Read grace period from session meta (set during creation)
    const gracePeriodSeconds =
      typeof (session.meta as Record<string, unknown>)?.grace_period_seconds === 'number'
        ? (session.meta as Record<string, unknown>).grace_period_seconds as number
        : 10;

    const durationLimitSeconds =
      typeof (session.meta as Record<string, unknown>)?.duration_limit_seconds === 'number'
        ? (session.meta as Record<string, unknown>).duration_limit_seconds as number
        : 60;

    const withinBudget = durationSeconds <= durationLimitSeconds;
    const isGracePeriod = durationSeconds <= gracePeriodSeconds;
    const finalStatus = payload.status ?? 'completed';

    // Deduct actual seconds used from budget (skip grace period sessions)
    const billableSeconds = isGracePeriod ? 0 : Math.round(durationSeconds);

    // Complete session FIRST so it's no longer "active". This prevents
    // the server-side expire cron from also billing this session if the
    // billing step below fails.
    const qaSession = await completeQASession(supabase, qaSessionId, {
      status: finalStatus,
      conversationId,
      durationSeconds,
      turns: normalizedTurns,
      transcript,
      evaluation: payload.evaluation,
      meta: {
        ...(session.meta ?? {}),
        ...(payload.meta ?? {}),
        ...conversationMeta,
        qa_within_budget: withinBudget,
        billable_seconds: billableSeconds,
        grace_period_applied: isGracePeriod,
      },
    });

    // Record billing after session is marked complete
    if (billableSeconds > 0) {
      const adminClient = createAdminClient();

      // Check if user has an active day pass
      const dayPassCheck = await adminClient
        .from('day_passes')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .single();

      if (dayPassCheck.data) {
        // Day pass user: record QA seconds via existing system
        await recordQaSecondsUsage(adminClient, user.id, billableSeconds);
      } else {
        // Credit user: consume 1 credit for QA session
        try {
          await adminClient.rpc('consume_credits', {
            p_user_id: user.id,
            p_amount: 1,
            p_source: 'qa_session',
            p_reference_id: qaSessionId,
            p_description: `QA session (${billableSeconds}s)`,
          });
        } catch (creditError) {
          console.error('[qna-session-complete] credit consumption failed:', creditError);
        }
        // Still record qa_seconds usage event for analytics
        await recordQaSecondsUsage(adminClient, user.id, billableSeconds);
      }
    }

    return jsonResponse({ qaSession }, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error.message, error.retryAfter);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to complete QA session.',
      500,
    );
  }
});
