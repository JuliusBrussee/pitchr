import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { resetRateLimitStateForTests } from '@/lib/rateLimit';

const mockGetAuthenticatedUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockStartCheckout = vi.fn();
const mockGetActiveDayPass = vi.fn();
const mockGetOrCreateStripeCustomer = vi.fn();
const mockStartPortalSession = vi.fn();
const mockCreatePaymentCheckoutSession = vi.fn();
const mockGetCreditPackBySlug = vi.fn();

const ORIGINAL_ENV = {
  PUBLIC_WRITE_RATE_LIMIT_BACKEND: process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND,
  PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS: process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS,
  PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS: process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS,
  BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS: process.env.BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS,
  BILLING_WRITE_RATE_LIMIT_WINDOW_MS: process.env.BILLING_WRITE_RATE_LIMIT_WINDOW_MS,
  BILLING_IDEMPOTENCY_WINDOW_MS: process.env.BILLING_IDEMPOTENCY_WINDOW_MS,
  TRUST_PROXY_HEADERS: process.env.TRUST_PROXY_HEADERS,
  STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  STRIPE_DAY_PASS_PRICE_ID: process.env.STRIPE_DAY_PASS_PRICE_ID,
};

vi.mock('@/lib/supabase/auth-helpers', () => ({
  getAuthenticatedUser: () => mockGetAuthenticatedUser(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

vi.mock('@/services/billingService', () => ({
  startCheckout: (...args: unknown[]) => mockStartCheckout(...args),
  getActiveDayPass: (...args: unknown[]) => mockGetActiveDayPass(...args),
  getOrCreateStripeCustomer: (...args: unknown[]) => mockGetOrCreateStripeCustomer(...args),
  startPortalSession: (...args: unknown[]) => mockStartPortalSession(...args),
}));

vi.mock('@/services/stripeService', () => ({
  createPaymentCheckoutSession: (...args: unknown[]) => mockCreatePaymentCheckoutSession(...args),
}));

vi.mock('@/services/creditService', () => ({
  getCreditPackBySlug: (...args: unknown[]) => mockGetCreditPackBySlug(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimitStateForTests();
  process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = 'memory';
  process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS = '20';
  process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS = '20';
  process.env.BILLING_WRITE_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.BILLING_IDEMPOTENCY_WINDOW_MS = '60000';
  process.env.TRUST_PROXY_HEADERS = 'true';
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID = 'price_pro_month';
  process.env.STRIPE_DAY_PASS_PRICE_ID = 'price_day_pass';

  mockGetAuthenticatedUser.mockResolvedValue({
    user: {
      id: 'user-1',
      email: 'founder@example.com',
      user_metadata: { full_name: 'Founder' },
    },
  });
  mockCreateAdminClient.mockReturnValue({});
  mockStartCheckout.mockResolvedValue({ url: 'https://stripe.test/checkout' });
  mockGetActiveDayPass.mockResolvedValue(null);
  mockGetOrCreateStripeCustomer.mockResolvedValue('cus_123');
  mockStartPortalSession.mockResolvedValue({ url: 'https://stripe.test/portal' });
  mockCreatePaymentCheckoutSession.mockResolvedValue({ url: 'https://stripe.test/session', id: 'sess_123' });
  mockGetCreditPackBySlug.mockResolvedValue({
    slug: 'starter',
    credits: 5,
    stripePriceId: 'price_credit_starter',
  });
});

afterEach(() => {
  process.env.PUBLIC_WRITE_RATE_LIMIT_BACKEND = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_BACKEND;
  process.env.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_MAX_REQUESTS;
  process.env.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS = ORIGINAL_ENV.PUBLIC_WRITE_RATE_LIMIT_WINDOW_MS;
  process.env.BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS = ORIGINAL_ENV.BILLING_WRITE_RATE_LIMIT_MAX_REQUESTS;
  process.env.BILLING_WRITE_RATE_LIMIT_WINDOW_MS = ORIGINAL_ENV.BILLING_WRITE_RATE_LIMIT_WINDOW_MS;
  process.env.BILLING_IDEMPOTENCY_WINDOW_MS = ORIGINAL_ENV.BILLING_IDEMPOTENCY_WINDOW_MS;
  process.env.TRUST_PROXY_HEADERS = ORIGINAL_ENV.TRUST_PROXY_HEADERS;
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID = ORIGINAL_ENV.STRIPE_PRO_MONTHLY_PRICE_ID;
  process.env.STRIPE_DAY_PASS_PRICE_ID = ORIGINAL_ENV.STRIPE_DAY_PASS_PRICE_ID;
});

function withAntiAbuseHeaders(headers?: Record<string, string>) {
  return {
    'x-forwarded-for': '198.51.100.30',
    'idempotency-key': 'fixed-key',
    ...(headers ?? {}),
  };
}

describe('billing anti-abuse guards', () => {
  it('blocks duplicate checkout requests with 409 idempotency protection', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route');

    const buildRequest = () => new NextRequest('http://localhost/api/billing/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...withAntiAbuseHeaders(),
      },
      body: JSON.stringify({ planId: 'pro', interval: 'month' }),
    });

    const first = await POST(buildRequest());
    const second = await POST(buildRequest());
    const secondBody = await second.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(secondBody).toEqual({
      error: 'Duplicate billing request detected. Please wait before retrying.',
    });
  });

  it('blocks duplicate day-pass, credits, and portal requests with idempotency guard', async () => {
    const { POST: dayPassPOST } = await import('@/app/api/billing/day-pass/route');
    const { POST: creditsPOST } = await import('@/app/api/billing/credits/route');
    const { POST: portalPOST } = await import('@/app/api/billing/portal/route');

    const dayPassRequest = () => new NextRequest('http://localhost/api/billing/day-pass', {
      method: 'POST',
      headers: withAntiAbuseHeaders({ 'idempotency-key': 'day-pass-key' }),
    });

    const creditsRequest = () => new NextRequest('http://localhost/api/billing/credits', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...withAntiAbuseHeaders({ 'idempotency-key': 'credits-key' }),
      },
      body: JSON.stringify({ packSlug: 'starter' }),
    });

    const portalRequest = () => new NextRequest('http://localhost/api/billing/portal', {
      method: 'POST',
      headers: withAntiAbuseHeaders({ 'idempotency-key': 'portal-key' }),
    });

    const dayPassFirst = await dayPassPOST(dayPassRequest());
    const dayPassSecond = await dayPassPOST(dayPassRequest());
    const creditsFirst = await creditsPOST(creditsRequest());
    const creditsSecond = await creditsPOST(creditsRequest());
    const portalFirst = await portalPOST(portalRequest());
    const portalSecond = await portalPOST(portalRequest());

    expect(dayPassFirst.status).toBe(200);
    expect(dayPassSecond.status).toBe(409);
    expect(creditsFirst.status).toBe(200);
    expect(creditsSecond.status).toBe(409);
    expect(portalFirst.status).toBe(200);
    expect(portalSecond.status).toBe(409);
  });
});
