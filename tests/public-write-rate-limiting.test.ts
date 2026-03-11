import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { checkPublicWriteRateLimit, resetRateLimitStateForTests } from '@/lib/rateLimit';
import { POST as waitlistPOST } from '@/app/api/waitlist/route';
import {
  GET as unsubscribeGET,
  POST as unsubscribePOST,
} from '@/app/api/newsletter/unsubscribe/route';

const ORIGINAL_ENV = {
  PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS: process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS,
  PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS: process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS,
  PUBLIC_WRITE_RATE_LIMIT_BACKEND: process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND,
  TRUST_PROXY_HEADERS: process.env.TRUST_PROXY_HEADERS,
};

const mockSupabaseFrom = vi.fn();
const mockCreateAdminClient = vi.fn(() => ({
  from: mockSupabaseFrom,
}));

const mockSendWaitlistWelcomeEmail = vi.fn().mockResolvedValue({
  provider: 'resend',
  messageId: 'mock-message',
});

function createMockChain() {
  const chain: Record<string, any> = {};
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({
    data: {
      id: 'waitlist-1',
      email: 'waitlist@example.com',
      unsubscribe_token: 'unsub-1',
      welcome_email_sent_at: null,
      unsubscribed_at: null,
    },
    error: null,
  });
  chain.maybeSingle = vi.fn().mockResolvedValue({
    data: null,
    error: null,
  });
  return chain;
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

vi.mock('@/services/emailService', () => ({
  sendWaitlistWelcomeEmail: () => mockSendWaitlistWelcomeEmail(),
}));

beforeEach(() => {
  mockSupabaseFrom.mockReset();
  mockCreateAdminClient.mockClear();
  mockSendWaitlistWelcomeEmail.mockClear();
  resetRateLimitStateForTests();
  process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS = '1';
  process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = 'memory';
  process.env.TRUST_PROXY_HEADERS = 'true';
});

afterEach(() => {
  vi.clearAllMocks();
  process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS;
  process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS;
  process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_BACKEND;
  process.env.TRUST_PROXY_HEADERS = ORIGINAL_ENV.TRUST_PROXY_HEADERS;
});

describe('checkPublicWriteRateLimit', () => {
  it('allows a burst then blocks next request in window', async () => {
    const first = await checkPublicWriteRateLimit('public-write:test', {
      maxRequests: 1,
      windowMs: 1000,
      now: 0,
    });
    const second = await checkPublicWriteRateLimit('public-write:test', {
      maxRequests: 1,
      windowMs: 1000,
      now: 100,
    });
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(0);
    expect(second.allowed).toBe(false);
    expect(second.remaining).toBe(0);
    expect(second.retryAfterSeconds).toBe(1);
  });
});

describe('public write endpoints', () => {
  const requestWithEmail = (email: string) =>
    new NextRequest('http://localhost/api/waitlist', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '198.51.100.10',
      },
      body: JSON.stringify({
        email,
        privacy_notice_acknowledged: true,
      }),
    });

  const buildMockWaitlistClient = () => {
    const chain = createMockChain();
    mockSupabaseFrom.mockReturnValue(chain);
    mockCreateAdminClient.mockReturnValue({ from: mockSupabaseFrom });
    return chain;
  };

  it('returns explicit 429 for repeated waitlist writes by email key', async () => {
    const chain = buildMockWaitlistClient();
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    chain.single.mockResolvedValue({
      data: {
        id: 'waitlist-1',
        email: 'captain@example.com',
        unsubscribe_token: 'unsub-1',
        welcome_email_sent_at: null,
        unsubscribed_at: null,
      },
      error: null,
    });

    const first = await waitlistPOST(requestWithEmail('captain@example.com'));
    const second = await waitlistPOST(requestWithEmail('captain@example.com'));
    const secondBody = await second.json();

    expect(first.status).toBe(201);
    expect(second.status).toBe(429);
    expect(secondBody).toEqual({ error: 'Too many requests. Please try again shortly.' });
    expect(second.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(chain.insert).toHaveBeenCalledTimes(1);
  });

  it('uses independent keys per email, allowing different emails', async () => {
    const chain = buildMockWaitlistClient();
    chain.single.mockResolvedValue({
      data: {
        id: 'waitlist-2',
        email: 'user-2@example.com',
        unsubscribe_token: 'unsub-2',
        welcome_email_sent_at: null,
        unsubscribed_at: null,
      },
      error: null,
    });

    const first = await waitlistPOST(requestWithEmail('user1@example.com'));
    const second = await waitlistPOST(requestWithEmail('user2@example.com'));

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });

  it('throttles newsletter unsubscribe by IP across tokens and methods', async () => {
    const chain = createMockChain();
    chain.select.mockReturnValue(chain);
    chain.maybeSingle.mockResolvedValueOnce({
      data: {
        id: 'w-1',
        unsubscribed_at: null,
      },
      error: null,
    });
    chain.update.mockReturnValue(chain);
    mockSupabaseFrom.mockReturnValue(chain);
    mockCreateAdminClient.mockReturnValue({ from: mockSupabaseFrom });

    const postReq = new NextRequest(
      'http://localhost/api/newsletter/unsubscribe',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.5',
        },
        body: JSON.stringify({ token: '550e8400-e29b-41d4-a716-446655440000' }),
      },
    );

    const getReq = new NextRequest(
      'http://localhost/api/newsletter/unsubscribe?token=550e8400-e29b-41d4-a716-446655440000',
      {
        method: 'GET',
        headers: {
          'x-forwarded-for': '203.0.113.5',
        },
      },
    );

    const first = await unsubscribePOST(postReq);
    const second = await unsubscribeGET(getReq);
    const secondBody = await second.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(secondBody).toBeTruthy();
    expect(secondBody).toEqual({ error: 'Too many requests. Please try again shortly.' });
  });
});
