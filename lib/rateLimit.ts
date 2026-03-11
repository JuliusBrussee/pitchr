export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

type RateLimitState = {
  count: number;
  resetAt: number;
};

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 5;
const DEFAULT_RETRY_HEADER_WINDOW_SECONDS = 60;
const DEFAULT_RATE_LIMIT_NAMESPACE = 'pitchr:ratelimit';

const state = new Map<string, RateLimitState>();

type PublicWriteRateLimitBackend = 'memory' | 'upstash';

interface UpstashConfig {
  url: string;
  token: string;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function resolvePublicWriteRateLimitDefaults() {
  return {
    maxRequests: parsePositiveInteger(process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS, DEFAULT_RATE_LIMIT_MAX_REQUESTS),
    windowMs: parsePositiveInteger(process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
  };
}

function resolveUpstashConfig(): UpstashConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ''),
    token,
  };
}

function resolvePublicWriteRateLimitNamespace(): string {
  const configured = process.env.PUBLIC_WRITE_RATE_LIMIT_NAMESPACE?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_RATE_LIMIT_NAMESPACE;
}

export function resolvePublicWriteRateLimitBackend(): PublicWriteRateLimitBackend {
  const configured = process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND?.trim().toLowerCase();
  if (configured === 'memory' || configured === 'upstash') {
    return configured;
  }
  return resolveUpstashConfig() ? 'upstash' : 'memory';
}

export function getClientIpFallback(request: Request): string | null {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    null
  );
}

export function getRateLimitResetHeaders(result: RateLimitResult) {
  return {
    'Retry-After': String(Math.max(0, result.retryAfterSeconds)),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };
}

function checkPublicWriteRateLimitMemory(
  key: string,
  options?: {
    now?: number;
    maxRequests?: number;
    windowMs?: number;
  },
): RateLimitResult {
  const now = options?.now ?? Date.now();
  const defaults = resolvePublicWriteRateLimitDefaults();
  const maxRequests = options?.maxRequests ?? defaults.maxRequests;
  const windowMs = options?.windowMs ?? defaults.windowMs;

  if (!key || maxRequests <= 0 || windowMs <= 0) {
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests,
      retryAfterSeconds: 0,
    };
  }

  const existing = state.get(key);
  if (!existing || existing.resetAt <= now) {
    state.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      retryAfterSeconds: windowMs > 0 ? Math.max(1, Math.ceil(windowMs / 1000)) : 0,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - existing.count),
      retryAfterSeconds: Math.max(0, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(0, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - existing.count,
    retryAfterSeconds,
  };
}

async function callUpstashPipeline(
  config: UpstashConfig,
  commands: string[][],
): Promise<Array<{ result?: unknown; error?: unknown }>> {
  const response = await fetch(`${config.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limit request failed (${response.status})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('Unexpected Upstash pipeline response.');
  }

  return payload as Array<{ result?: unknown; error?: unknown }>;
}

async function checkPublicWriteRateLimitUpstash(
  key: string,
  options?: {
    now?: number;
    maxRequests?: number;
    windowMs?: number;
  },
): Promise<RateLimitResult> {
  const now = options?.now ?? Date.now();
  const defaults = resolvePublicWriteRateLimitDefaults();
  const maxRequests = options?.maxRequests ?? defaults.maxRequests;
  const windowMs = options?.windowMs ?? defaults.windowMs;

  if (!key || maxRequests <= 0 || windowMs <= 0) {
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests,
      retryAfterSeconds: 0,
    };
  }

  const config = resolveUpstashConfig();
  if (!config) {
    return checkPublicWriteRateLimitMemory(key, options);
  }

  const windowBucket = Math.floor(now / windowMs);
  const resetAt = (windowBucket + 1) * windowMs;
  const storageKey = `${resolvePublicWriteRateLimitNamespace()}:${key}:${windowBucket}`;
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000) + 1);

  const responses = await callUpstashPipeline(config, [
    ['INCR', storageKey],
    ['EXPIRE', storageKey, String(ttlSeconds), 'NX'],
  ]);

  const rawCount = responses[0]?.result;
  const count = typeof rawCount === 'number' ? rawCount : Number(rawCount);
  if (!Number.isFinite(count) || count < 1) {
    throw new Error('Unexpected Upstash counter value.');
  }

  const retryAfterSeconds = Math.max(0, Math.ceil((resetAt - now) / 1000));

  return {
    allowed: count <= maxRequests,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - count),
    retryAfterSeconds,
  };
}

export function checkPublicWriteRateLimit(
  key: string,
  options?: {
    now?: number;
    maxRequests?: number;
    windowMs?: number;
  },
): RateLimitResult {
  return checkPublicWriteRateLimitMemory(key, options);
}

export async function checkPublicWriteRateLimitAsync(
  key: string,
  options?: {
    now?: number;
    maxRequests?: number;
    windowMs?: number;
  },
): Promise<RateLimitResult> {
  const backend = resolvePublicWriteRateLimitBackend();
  if (backend === 'upstash') {
    try {
      return await checkPublicWriteRateLimitUpstash(key, options);
    } catch (error) {
      console.error('[rateLimit] Upstash backend failed; falling back to memory store.', error);
      return checkPublicWriteRateLimitMemory(key, options);
    }
  }
  return checkPublicWriteRateLimitMemory(key, options);
}

export function resetRateLimitStateForTests(): void {
  state.clear();
}

export function getDefaultRetryAfterMsForHeaders(): number {
  const defaults = resolvePublicWriteRateLimitDefaults();
  return defaults.windowMs > 0
    ? Math.max(1000, defaults.windowMs)
    : DEFAULT_RETRY_HEADER_WINDOW_SECONDS * 1000;
}
