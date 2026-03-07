import { createAdminClient } from './supabase.ts';

/* ——————————————————————————————————————————————————————————
 * Per-user rate limiting for Supabase Edge Functions
 *
 * Uses the `check_rate_limit` RPC (atomic upsert in Postgres).
 * Fails open on DB errors — availability over strictness.
 * —————————————————————————————————————————————————————————— */

// ─── Tier configuration ───

interface EndpointLimit {
  maxRequests: number;
  windowSeconds: number;
}

const EXPENSIVE: EndpointLimit = { maxRequests: 5, windowSeconds: 60 };
const MODERATE: EndpointLimit = { maxRequests: 15, windowSeconds: 60 };
const DEFAULT: EndpointLimit = { maxRequests: 30, windowSeconds: 60 };

// Endpoints not listed here fall through to DEFAULT (30 req/min).
// Note: 'pitch-run-list' is used for GET requests in the pitch-run function,
// separate from 'pitch-run' (POST) so reads don't share the expensive tier.
const ENDPOINT_LIMITS: Record<string, EndpointLimit> = {
  'pitch-run': EXPENSIVE,
  'deck-generate': EXPENSIVE,
  'transcribe-audio': EXPENSIVE,
  'qna-session': EXPENSIVE,

  'deck-upload': MODERATE,
  'projects': MODERATE,
  'settings': MODERATE,
  'qna-resources-refresh': MODERATE,
  'compliance-accept': MODERATE,
  'compliance-consents': MODERATE,
  'qna-session-complete': MODERATE,
  'miro-fix-board': MODERATE,
  'miro-fix-board-markdown': MODERATE,
  'miro-fix-board-sync': MODERATE,
};

// ─── Types ───

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  retryAfter: number;
}

export class RateLimitExceededError extends Error {
  retryAfter: number;

  constructor(endpoint: string, retryAfter: number) {
    super(`Rate limit exceeded for ${endpoint}. Try again in ${retryAfter}s.`);
    this.name = 'RateLimitExceededError';
    this.retryAfter = retryAfter;
  }
}

// ─── Core ───

/**
 * Check (and increment) the rate limit for a user+endpoint.
 * Throws `RateLimitExceededError` if denied.
 * Fails open on DB errors so a broken rate_limits table
 * doesn't block all requests.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
): Promise<RateLimitResult> {
  const limits = ENDPOINT_LIMITS[endpoint] ?? DEFAULT;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_user_id: userId,
      p_endpoint: endpoint,
      p_window_seconds: limits.windowSeconds,
      p_max_requests: limits.maxRequests,
    });

    if (error) {
      console.error(`[rate-limit] RPC error for ${endpoint}:`, error.message);
      // Fail open
      return { allowed: true, current: 0, limit: limits.maxRequests, retryAfter: 0 };
    }

    const result = data as { allowed: boolean; current: number; limit: number; retry_after: number };

    if (!result.allowed) {
      throw new RateLimitExceededError(endpoint, result.retry_after);
    }

    return {
      allowed: true,
      current: result.current,
      limit: result.limit,
      retryAfter: 0,
    };
  } catch (err) {
    if (err instanceof RateLimitExceededError) throw err;
    console.error(`[rate-limit] unexpected error for ${endpoint}:`, err instanceof Error ? err.message : err);
    // Fail open
    return { allowed: true, current: 0, limit: limits.maxRequests, retryAfter: 0 };
  }
}
