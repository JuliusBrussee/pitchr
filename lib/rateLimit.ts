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
const DEFAULT_TRUSTED_CLIENT_IP_HEADERS = [
  'cf-connecting-ip',
  'x-real-ip',
  'x-forwarded-for',
  'x-vercel-forwarded-for',
];

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

export function checkPublicWriteRateLimit(
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

export function resetRateLimitStateForTests(): void {
  state.clear();
}

export function getDefaultRetryAfterMsForHeaders(): number {
  const defaults = resolvePublicWriteRateLimitDefaults();
  return defaults.windowMs > 0
    ? Math.max(1000, defaults.windowMs)
    : DEFAULT_RETRY_HEADER_WINDOW_SECONDS * 1000;
}
