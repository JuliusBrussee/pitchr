// Edge Function: qna-session
// Replaces: app/api/qna/session/route.ts
// Methods: POST (create live VC Q&A session)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, createAdminClient, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { createQASession } from '../_shared/qna-session-service.ts';
import { getSignedUrl, ElevenLabsConvaiError } from '../_shared/elevenlabs-convai.ts';
import { getRun } from '../_shared/run-service.ts';
import { getQaBudget } from '../_shared/billing-service.ts';
import { assertComplianceForEndpoint } from '../_shared/compliance-service.ts';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}

function isMissingConvaiWritePermission(error: ElevenLabsConvaiError): boolean {
  const providerStatus = error.providerStatus?.toLowerCase() ?? '';
  const providerMessage = error.providerMessage?.toLowerCase() ?? '';
  return providerStatus === 'missing_permissions' || providerMessage.includes('convai_write');
}

function buildQaAgentSystemPrompt(input: {
  starterContext: string;
  weakestCategories: string[];
  timeLimitSeconds?: number;
}): string {
  const timeLimit = input.timeLimitSeconds ?? 60;
  const weakCats = input.weakestCategories.length > 0
    ? `Focus on these weak categories first: ${input.weakestCategories.join(', ')}.`
    : '';

  return [
    'You are a venture investor conducting a rapid-fire Q&A.',
    `Time limit: ${timeLimit} seconds. Be concise.`,
    weakCats,
    '',
    'Pitch Context:',
    input.starterContext,
  ].filter(Boolean).join('\n');
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }

  const payload = body as { runId?: string; selectedDurationSeconds?: number };
  const runId = typeof payload.runId === 'string' ? payload.runId.trim() : '';
  if (!runId || !isUuid(runId)) {
    return errorResponse('runId must be a valid UUID.', 400);
  }

  const agentId = Deno.env.get('ELEVENLABS_CONVAI_AGENT_ID')?.trim();
  if (!agentId) {
    return errorResponse('Missing ELEVENLABS_CONVAI_AGENT_ID environment variable.', 500);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'qna-session');
    if (complianceResponse) return complianceResponse;

    // Get Q&A budget info for this user
    const adminClient = createAdminClient();
    const budget = await getQaBudget(adminClient, user.id);

    // Deny only when budget is fully exhausted with no remaining seconds.
    // Users at exactly 0 can still start — if they finish within the grace
    // period the session is free, and durationLimit is clamped to grace period.
    const remaining = budget.remainingSeconds ?? Infinity;
    if (!budget.allowed && remaining <= 0) {
      return errorResponse(
        `Q&A time budget exhausted (${Math.floor(budget.usedSeconds / 60)}m ${budget.usedSeconds % 60}s / ${budget.budgetSeconds ? `${Math.floor(budget.budgetSeconds / 60)}m` : '\u221e'}). Upgrade your plan for more Q&A time.`,
        429,
      );
    }

    // Validate and clamp selected duration against plan limits and remaining budget.
    // When remaining is very low (e.g. 5s), clamp to at least the grace period so
    // the user has a chance to start and cleanly exit without being charged.
    const requestedDuration =
      typeof payload.selectedDurationSeconds === 'number' && payload.selectedDurationSeconds > 0
        ? Math.round(payload.selectedDurationSeconds)
        : budget.defaultDurationSeconds;

    const durationLimitSeconds = Math.max(
      budget.gracePeriodSeconds,
      Math.min(
        requestedDuration,
        budget.maxSessionSeconds,
        remaining,
      ),
    );

    // Build context from the run
    const run = await getRun(supabase, runId);
    const analysis = run.analysis?.outputs?.feedback;
    const starterContext = analysis
      ? `Score: ${analysis.overall_score}/100. Verdict: ${analysis.one_line_verdict}`
      : `Run ${runId} analysis pending.`;

    const weakestCategories = analysis?.rubric_breakdown
      ?.sort((a: { score: number }, b: { score: number }) => a.score - b.score)
      ?.slice(0, 3)
      ?.map((r: { category: string }) => r.category) ?? [];

    const qaSystemPrompt = buildQaAgentSystemPrompt({
      starterContext,
      weakestCategories,
      timeLimitSeconds: durationLimitSeconds,
    });

    const signed = await getSignedUrl(agentId, true);
    const qaSession = await createQASession(supabase, {
      runId,
      userId: user.id,
      status: 'active',
      conversationId: signed.conversationId,
      durationLimitSeconds,
      meta: {
        starter_context: qaSystemPrompt,
        requested_duration_seconds: requestedDuration,
        plan_max_session_seconds: budget.maxSessionSeconds,
        grace_period_seconds: budget.gracePeriodSeconds,
      },
    });

    return jsonResponse({
      qaSessionId: qaSession.id,
      signedUrl: signed.signedUrl,
      conversationId: signed.conversationId,
      durationLimitSeconds,
      starterContext: qaSystemPrompt,
      qaBudget: {
        budgetSeconds: budget.budgetSeconds,
        usedSeconds: budget.usedSeconds,
        remainingSeconds: budget.remainingSeconds,
        maxSessionSeconds: budget.maxSessionSeconds,
        gracePeriodSeconds: budget.gracePeriodSeconds,
      },
    }, 201);
  } catch (error) {
    if (error instanceof ElevenLabsConvaiError) {
      if (isMissingConvaiWritePermission(error)) {
        return errorResponse(
          'ElevenLabs API key is missing convai_write permission.',
          403,
        );
      }
      return errorResponse(
        'Failed to initialize ElevenLabs ConvAI session.',
        500,
      );
    }

    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create QA session.',
      500,
    );
  }
});
