import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitStateForTests } from '@/lib/rateLimit';

const mockGetAuthenticatedUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockGetActiveDayPass = vi.fn();
const mockGetOrCreateStripeCustomer = vi.fn();
const mockCreatePaymentCheckoutSession = vi.fn();

const ORIGINAL_ENV = {
  PUBLIC_WRITE_RATE_LIMIT_BACKEND: process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND,
  PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS: process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS,
  PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS: process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS,
  BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS: process.env.BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS,
  BILLING_WRITE_RATE_LIMIT_WINDOW_MS: process.env.BILLING_WRITE_RATE_LIMIT_WINDOW_MS,
  BILLING_IDEMPOTENCY_WINDOW_MS: process.env.BILLING_IDEMPOTENCY_WINDOW_MS,
  TRUST_PROXY_HEADERS: process.env.TRUST_PROXY_HEADERS,
  STRIPE_DAY_PASS_PRICE_ID: process.env.STRIPE_DAY_PASS_PRICE_ID,
};

vi.mock('@/lib/supabase/auth-helpers', () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

vi.mock('@/services/billingService', () => ({
  getActiveDayPass: (...args: unknown[]) => mockGetActiveDayPass(...args),
  getOrCreateStripeCustomer: (...args: unknown[]) => mockGetOrCreateStripeCustomer(...args),
}));

vi.mock('@/services/stripeService', () => ({
  createPaymentCheckoutSession: (...args: unknown[]) => mockCreatePaymentCheckoutSession(...args),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  resetRateLimitStateForTests();
  process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = 'memory';
  process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS = '20';
  process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS = '20';
  process.env.BILLING_WRITE_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.BILLING_IDEMPOTENCY_WINDOW_MS = '60000';
  process.env.TRUST_PROXY_HEADERS = 'true';
  process.env.STRIPE_DAY_PASS_PRICE_ID = 'price_day_pass';

  mockGetAuthenticatedUser.mockResolvedValue({
    user: {
      id: 'user-1',
      email: 'founder@example.com',
      user_metadata: { full_name: 'Founder' },
    },
  });
  mockCreateAdminClient.mockReturnValue({});
  mockGetActiveDayPass.mockResolvedValue(null);
  mockGetOrCreateStripeCustomer.mockResolvedValue('cus_123');
  mockCreatePaymentCheckoutSession.mockRejectedValue(
    new Error('Stripe exploded with internal detail sk_test_12345'),
  );
});

afterEach(() => {
  process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_BACKEND;
  process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS;
  process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS;
  process.env.BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS = ORIGINAL_ENV.BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS;
  process.env.BILLING_WRITE_RATE_LIMIT_WINDOW_MS = ORIGINAL_ENV.BILLING_WRITE_RATE_LIMIT_WINDOW_MS;
  process.env.BILLING_IDEMPOTENCY_WINDOW_MS = ORIGINAL_ENV.BILLING_IDEMPOTENCY_WINDOW_MS;
  process.env.TRUST_PROXY_HEADERS = ORIGINAL_ENV.TRUST_PROXY_HEADERS;
  process.env.STRIPE_DAY_PASS_PRICE_ID = ORIGINAL_ENV.STRIPE_DAY_PASS_PRICE_ID;
});

describe('billing/day-pass safe error response', () => {
  it('returns generic 500 message without internal details', async () => {
    const { POST: dayPassPOST } = await import('@/app/api/billing/day-pass/route');
    const request = new NextRequest('http://localhost/api/billing/day-pass', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '198.51.100.44',
        'idempotency-key': 'day-pass-safe-error',
      },
    });

    const response = await dayPassPOST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to create day pass checkout.' });
    expect(body.error).not.toContain('sk_test_12345');
    expect(body.error).not.toContain('internal detail');
  });
});
