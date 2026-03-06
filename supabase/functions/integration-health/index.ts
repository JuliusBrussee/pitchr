// Edge Function: integration-health
// Methods: GET
// Returns non-secret readiness booleans for external integrations.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { checkRateLimit, RateLimitExceededError } from '../_shared/rate-limit.ts';
import type { IntegrationHealthResponse } from '../_shared/types.ts';

function hasNonEmptyEnv(key: string): boolean {
  return Boolean(Deno.env.get(key)?.trim());
}

function buildIntegrationHealth(): IntegrationHealthResponse {
  const anthropicReady = hasNonEmptyEnv('ANTHROPIC_API_KEY');
  const geminiReady = hasNonEmptyEnv('GOOGLE_AI_API_KEY');
  const liveQaEnabled = Deno.env.get('NEXT_PUBLIC_ENABLE_LIVE_QA') === 'true';
  const convaiKeyReady =
    hasNonEmptyEnv('ELEVENLABS_API_KEY_CONVAI') ||
    hasNonEmptyEnv('ELEVENLABS_API_KEY_STT') ||
    hasNonEmptyEnv('ELEVENLABS_API_KEY');
  const convaiAgentReady = hasNonEmptyEnv('ELEVENLABS_CONVAI_AGENT_ID');
  const liveQaReady = liveQaEnabled && convaiKeyReady && convaiAgentReady;

  const warnings: string[] = [];
  if (!anthropicReady) {
    warnings.push('ANTHROPIC_API_KEY is missing for primary analysis provider.');
  }
  if (!geminiReady) {
    warnings.push('GOOGLE_AI_API_KEY is missing. Analysis fallback provider is disabled.');
  }
  if (liveQaEnabled && !convaiKeyReady) {
    warnings.push('Live QA enabled but ElevenLabs ConvAI key is missing.');
  }
  if (liveQaEnabled && !convaiAgentReady) {
    warnings.push('Live QA enabled but ELEVENLABS_CONVAI_AGENT_ID is missing.');
  }

  return {
    runtime: 'supabase-edge',
    analysis: {
      anthropic_ready: anthropicReady,
      gemini_ready: geminiReady,
    },
    live_qa: {
      enabled: liveQaEnabled,
      elevenlabs_key_ready: convaiKeyReady,
      agent_id_ready: convaiAgentReady,
      ready: liveQaReady,
    },
    warnings,
  };
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { user } = await getAuthenticatedUser(req);
    await checkRateLimit(user.id, 'integration-health');
    return jsonResponse(buildIntegrationHealth(), 200);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    if (error instanceof RateLimitExceededError) {
      return errorResponse(error.message, 429);
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to build integration health response.',
      500,
    );
  }
});

