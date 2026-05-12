import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  GET as unsubscribeGET,
  POST as unsubscribePOST,
} from '@/app/api/newsletter/unsubscribe/route';
import { resetRateLimitStateForTests } from '@/lib/rateLimit';

const mockSupabaseFrom = vi.fn();
const mockCreateAdminClient = vi.fn(() => ({
  from: mockSupabaseFrom,
}));

const ORIGINAL_ENV = {
  PUBLIC_WRITE_RATE_LIMIT_BACKEND: process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND,
  PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS: process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS,
  PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS: process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS,
  TRUST_PROXY_HEADERS: process.env.TRUST_PROXY_HEADERS,
};

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

function buildMockChain() {
  const chain: Record<string, any> = {};
  chain.update = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn();
  return chain;
}

beforeEach(() => {
  resetRateLimitStateForTests();
  vi.clearAllMocks();
  process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = 'memory';
  process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS = '10';
  process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.TRUST_PROXY_HEADERS = 'true';
});

afterEach(() => {
  process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_BACKEND;
  process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS;
  process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS;
  process.env.TRUST_PROXY_HEADERS = ORIGINAL_ENV.TRUST_PROXY_HEADERS;
});

describe('newsletter unsubscribe confirm + post flow', () => {
  it('GET returns confirmation state without mutating waitlist', async () => {
    const chain = buildMockChain();
    chain.maybeSingle.mockResolvedValue({
      data: { id: 'w-1', unsubscribed_at: null },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(chain);
    mockCreateAdminClient.mockReturnValue({ from: mockSupabaseFrom });

    const request = new NextRequest(
      'http://localhost/api/newsletter/unsubscribe?token=550e8400-e29b-41d4-a716-446655440000',
      {
        method: 'GET',
        headers: {
          'x-forwarded-for': '203.0.113.10',
        },
      },
    );

    const response = await unsubscribeGET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: 'Please confirm unsubscribe to stop future waitlist emails.',
      canUnsubscribe: true,
    });
    expect(chain.update).not.toHaveBeenCalled();
  });

  it('POST performs unsubscribe mutation for a valid token', async () => {
    const chain = buildMockChain();
    chain.maybeSingle.mockResolvedValue({
      data: { id: 'w-1' },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue(chain);
    mockCreateAdminClient.mockReturnValue({ from: mockSupabaseFrom });

    const request = new NextRequest(
      'http://localhost/api/newsletter/unsubscribe',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.10',
        },
        body: JSON.stringify({ token: '550e8400-e29b-41d4-a716-446655440000' }),
      },
    );

    const response = await unsubscribePOST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ message: 'You have been unsubscribed.' });
    expect(chain.update).toHaveBeenCalledTimes(1);
  });
});
