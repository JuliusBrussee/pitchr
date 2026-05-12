import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  checkPublicWriteRateLimit,
  getClientIpFallback,
  getRateLimitResetHeaders,
} from '@/lib/rateLimit';

const DEFAULT_BILLING_WRITE_WINDOW_MS = 60_000;
const DEFAULT_BILLING_WRITE_MAX_REQUESTS = 6;
const DEFAULT_BILLING_IDEMPOTENCY_WINDOW_MS = 10 * 60_000;

type BillingAntiAbuseOptions = {
  request: Request;
  userId: string;
  action: 'checkout' | 'day-pass' | 'credits' | 'portal';
  idempotencyScope: string;
};

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function resolveBillingLimitDefaults() {
  return {
    maxRequests: parsePositiveInteger(
      process.env.BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS,
      DEFAULT_BILLING_WRITE_MAX_REQUESTS,
    ),
    windowMs: parsePositiveInteger(
      process.env.BILLING_WRITE_RATE_LIMIT_WINDOW_MS,
      DEFAULT_BILLING_WRITE_WINDOW_MS,
    ),
    idempotencyWindowMs: parsePositiveInteger(
      process.env.BILLING_IDEMPOTENCY_WINDOW_MS,
      DEFAULT_BILLING_IDEMPOTENCY_WINDOW_MS,
    ),
  };
}

function buildIdempotencyDigest(request: Request, scope: string) {
  const idempotencyHeader = request.headers.get('idempotency-key')?.trim();
  const raw = `${idempotencyHeader || 'implicit'}:${scope}`;
  return createHash('sha256').update(raw).digest('hex');
}

function buildRateLimitResponse(status: 409 | 429, message: string, retryAfterSeconds = 0) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        'Retry-After': String(Math.max(0, retryAfterSeconds)),
      },
    },
  );
}

export async function enforceBillingAntiAbuse(
  options: BillingAntiAbuseOptions,
): Promise<NextResponse | null> {
  const { request, userId, action, idempotencyScope } = options;
  const ip = getClientIpFallback(request);
  const defaults = resolveBillingLimitDefaults();

  const [userLimit, ipLimit] = await Promise.all([
    checkPublicWriteRateLimit(`billing:${action}:user:${userId}`, {
      maxRequests: defaults.maxRequests,
      windowMs: defaults.windowMs,
    }),
    checkPublicWriteRateLimit(`billing:${action}:ip:${ip ?? 'unknown'}`, {
      maxRequests: defaults.maxRequests,
      windowMs: defaults.windowMs,
    }),
  ]);

  if (!userLimit.allowed || !ipLimit.allowed) {
    const blockedLimit = !userLimit.allowed ? userLimit : ipLimit;
    return NextResponse.json(
      { error: 'Too many billing requests. Please try again shortly.' },
      {
        status: 429,
        headers: getRateLimitResetHeaders(blockedLimit),
      },
    );
  }

  const idempotencyDigest = buildIdempotencyDigest(request, idempotencyScope);
  const idempotency = await checkPublicWriteRateLimit(
    `billing:${action}:idempotency:${userId}:${idempotencyDigest}`,
    {
      maxRequests: 1,
      windowMs: defaults.idempotencyWindowMs,
    },
  );

  if (!idempotency.allowed) {
    return buildRateLimitResponse(
      409,
      'Duplicate billing request detected. Please wait before retrying.',
      idempotency.retryAfterSeconds,
    );
  }

  return null;
}
