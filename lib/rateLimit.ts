import { isIP } from 'node:net';

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
const DEFAULT_RATE_LIMIT_KEY_PREFIX = 'pitchr:ratelimit:';
const DEFAULT_TRUSTED_CLIENT_IP_HEADERS = [
  'cf-connecting-ip',
  'x-real-ip',
  'x-forwarded-for',
  'x-vercel-forwarded-for',
];
const DEFAULT_PUBLIC_WRITE_RATE_LIMIT_BACKEND = 'upstash';

const state = new Map<string, RateLimitState>();

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

function normalizeIpCandidate(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Support RFC7239-like and socket-style values: "ip:port", "[ipv6]:port".
  const noPort = trimmed.startsWith('[')
    ? trimmed.slice(1).split(']')[0]
    : trimmed.includes(':') && trimmed.includes('.') && trimmed.split(':').length === 2
      ? trimmed.split(':')[0]
      : trimmed;

  return isIP(noPort) ? noPort : null;
}

function resolveTrustedClientIpHeaders(): string[] {
  const configured = process.env.TRUSTED_CLIENT_IP_HEADERS;
  if (!configured) {
    return DEFAULT_TRUSTED_CLIENT_IP_HEADERS;
  }

  const parsed = configured
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : DEFAULT_TRUSTED_CLIENT_IP_HEADERS;
}

function shouldTrustProxyHeaders(): boolean {
  return process.env.TRUST_PROXY_HEADERS === 'true';
}

function resolveHeaderCandidate(headerName: string, headerValue: string): string | null {
  if (headerName === 'x-forwarded-for' || headerName === 'x-vercel-forwarded-for') {
    const first = headerValue.split(',')[0];
    return normalizeIpCandidate(first);
  }
  return normalizeIpCandidate(headerValue);
}

export function getClientIpFallback(request: Request): string | null {
  if (!shouldTrustProxyHeaders()) {
    return null;
  }

  const headers = request.headers;
  const headerPriority = resolveTrustedClientIpHeaders();
  for (const headerName of headerPriority) {
    const headerValue = headers.get(headerName);
    if (!headerValue) continue;
    const candidate = resolveHeaderCandidate(headerName, headerValue);
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

export function getRateLimitResetHeaders(result: RateLimitResult) {
  return {
    'Retry-After': String(Math.max(0, result.retryAfterSeconds)),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };
}

type RateLimitCheckOptions = {
  now?: number;
  maxRequests?: number;
  windowMs?: number;
};

type RateLimitBackend = 'memory' | 'upstash';

function resolveRateLimitBackend(): RateLimitBackend {
  const configured = process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND?.trim().toLowerCase();
  if (configured === 'memory' || configured === 'upstash') {
    return configured;
  }

  if (process.env.NODE_ENV === 'test') {
    return 'memory';
  }

  return DEFAULT_PUBLIC_WRITE_RATE_LIMIT_BACKEND;
}

function buildFailClosedResult(maxRequests: number, windowMs: number): RateLimitResult {
  return {
    allowed: false,
    limit: maxRequests,
    remaining: 0,
    retryAfterSeconds: windowMs > 0 ? Math.max(1, Math.ceil(windowMs / 1000)) : DEFAULT_RETRY_HEADER_WINDOW_SECONDS,
  };
}

function checkInMemoryPublicWriteRateLimit(
  key: string,
  options: Required<Pick<RateLimitCheckOptions, 'now' | 'maxRequests' | 'windowMs'>>,
): RateLimitResult {
  const { now, maxRequests, windowMs } = options;

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

function parsePipelineNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

type UpstashPipelineResponse = Array<{
  result?: unknown;
  error?: string;
}>;

async function checkWithUpstashPublicWriteRateLimit(
  key: string,
  options: Required<Pick<RateLimitCheckOptions, 'maxRequests' | 'windowMs'>>,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const { maxRequests, windowMs } = options;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      return buildFailClosedResult(maxRequests, windowMs);
    }

    return checkInMemoryPublicWriteRateLimit(key, {
      now: Date.now(),
      maxRequests,
      windowMs,
    });
  }

  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const namespacedKey = `${DEFAULT_RATE_LIMIT_KEY_PREFIX}${key}`;
  const commands = [
    ['INCR', namespacedKey],
    ['PEXPIRE', namespacedKey, String(windowMs), 'NX'],
    ['PTTL', namespacedKey],
  ];

  try {
    const response = await fetch(`${normalizedUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      throw new Error(`Upstash request failed with status ${response.status}`);
    }

    const pipeline = (await response.json()) as UpstashPipelineResponse;
    if (!Array.isArray(pipeline) || pipeline.length < 3) {
      throw new Error('Unexpected Upstash pipeline response shape');
    }

    if (pipeline.some((entry) => typeof entry?.error === 'string' && entry.error.length > 0)) {
      throw new Error('Upstash pipeline returned an error result');
    }

    const count = parsePipelineNumber(pipeline[0]?.result, 1);
    let ttlMs = parsePipelineNumber(pipeline[2]?.result, windowMs);
    if (ttlMs <= 0) {
      ttlMs = windowMs;
    }

    const retryAfterSeconds = Math.max(0, Math.ceil(ttlMs / 1000));
    const allowed = count <= maxRequests;

    return {
      allowed,
      limit: maxRequests,
      remaining: allowed ? Math.max(0, maxRequests - count) : 0,
      retryAfterSeconds,
    };
  } catch (error) {
    console.error('[rateLimit] Shared backend check failed:', error);
    if (process.env.NODE_ENV === 'production') {
      return buildFailClosedResult(maxRequests, windowMs);
    }

    return checkInMemoryPublicWriteRateLimit(key, {
      now: Date.now(),
      maxRequests,
      windowMs,
    });
  }
}

export async function checkPublicWriteRateLimit(
  key: string,
  options?: RateLimitCheckOptions,
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

  const backend = resolveRateLimitBackend();
  if (backend === 'memory') {
    return checkInMemoryPublicWriteRateLimit(key, { now, maxRequests, windowMs });
  }

  return checkWithUpstashPublicWriteRateLimit(key, { maxRequests, windowMs });
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
