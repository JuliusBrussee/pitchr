import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkPublicWriteRateLimit, resetRateLimitStateForTests } from '@/lib/rateLimit';

const ORIGINAL_ENV = {
  PUBLIC_WRITE_RATE_LIMIT_BACKEND: process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
};

beforeEach(() => {
  resetRateLimitStateForTests();
  vi.restoreAllMocks();
});

afterEach(() => {
  process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_BACKEND;
  process.env.UPSTASH_REDIS_REST_URL = ORIGINAL_ENV.UPSTASH_REDIS_REST_URL;
  process.env.UPSTASH_REDIS_REST_TOKEN = ORIGINAL_ENV.UPSTASH_REDIS_REST_TOKEN;
  process.env.NODE_ENV = ORIGINAL_ENV.NODE_ENV;
});

describe('shared public-write rate limit backend', () => {
  it('uses Upstash pipeline responses to enforce limit across requests', async () => {
    process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = 'upstash';
    process.env.UPSTASH_REDIS_REST_URL = 'https://example-upstash.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    process.env.NODE_ENV = 'production';

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { result: 1 },
          { result: 1 },
          { result: 60_000 },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { result: 2 },
          { result: 0 },
          { result: 59_000 },
        ],
      });
    vi.stubGlobal('fetch', fetchMock);

    const first = await checkPublicWriteRateLimit('shared:key', {
      maxRequests: 1,
      windowMs: 60_000,
    });
    const second = await checkPublicWriteRateLimit('shared:key', {
      maxRequests: 1,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(0);
    expect(second.allowed).toBe(false);
    expect(second.retryAfterSeconds).toBe(59);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails closed in production when shared backend config is missing', async () => {
    process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = 'upstash';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.NODE_ENV = 'production';

    const result = await checkPublicWriteRateLimit('shared:key', {
      maxRequests: 3,
      windowMs: 30_000,
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(3);
    expect(result.retryAfterSeconds).toBe(30);
  });
});
