import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { buildBillingRedirectUrl } from '@/lib/billing/redirect';

const mockGetAuthenticatedUser = vi.fn();
const mockCreateAdminClient = vi.fn();
const mockStartCheckout = vi.fn();
const mockGetActiveDayPass = vi.fn();
const mockGetOrCreateStripeCustomer = vi.fn();
const mockStartPortalSession = vi.fn();
const mockCreatePaymentCheckoutSession = vi.fn();
const mockGetCreditPackBySlug = vi.fn();

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

const ORIGINAL_ENV = {
  BILLING_REDIRECT_BASE_URL: process.env.BILLING_REDIRECT_BASE_URL,
  BILLING_REDIRECT_ALLOWED_ORIGINS: process.env.BILLING_REDIRECT_ALLOWED_ORIGINS,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  STRIPE_PRO_MONTHLY_PRICE_ID: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  STRIPE_DAY_PASS_PRICE_ID: process.env.STRIPE_DAY_PASS_PRICE_ID,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();

  process.env.BILLING_REDIRECT_BASE_URL = 'https://pitchr.live';
  process.env.BILLING_REDIRECT_ALLOWED_ORIGINS = 'https://pitchr.live,https://app.pitchr.live';
  process.env.NEXT_PUBLIC_APP_URL = 'https://pitchr.live';
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
  if (ORIGINAL_ENV.BILLING_REDIRECT_BASE_URL === undefined) {
    delete process.env.BILLING_REDIRECT_BASE_URL;
  } else {
    process.env.BILLING_REDIRECT_BASE_URL = ORIGINAL_ENV.BILLING_REDIRECT_BASE_URL;
  }

  if (ORIGINAL_ENV.BILLING_REDIRECT_ALLOWED_ORIGINS === undefined) {
    delete process.env.BILLING_REDIRECT_ALLOWED_ORIGINS;
  } else {
    process.env.BILLING_REDIRECT_ALLOWED_ORIGINS = ORIGINAL_ENV.BILLING_REDIRECT_ALLOWED_ORIGINS;
  }

  if (ORIGINAL_ENV.NEXT_PUBLIC_APP_URL === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_ENV.NEXT_PUBLIC_APP_URL;
  }

  if (ORIGINAL_ENV.STRIPE_PRO_MONTHLY_PRICE_ID === undefined) {
    delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  } else {
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID = ORIGINAL_ENV.STRIPE_PRO_MONTHLY_PRICE_ID;
  }

  if (ORIGINAL_ENV.STRIPE_DAY_PASS_PRICE_ID === undefined) {
    delete process.env.STRIPE_DAY_PASS_PRICE_ID;
  } else {
    process.env.STRIPE_DAY_PASS_PRICE_ID = ORIGINAL_ENV.STRIPE_DAY_PASS_PRICE_ID;
  }
});

describe('buildBillingRedirectUrl', () => {
  it('allows approved request origin from allowlist', () => {
    const url = buildBillingRedirectUrl(
      { origin: 'https://app.pitchr.live' },
      '/settings?tab=billing',
    );

    expect(url).toBe('https://app.pitchr.live/settings?tab=billing');
  });

  it('falls back to base origin for invalid or unapproved origin', () => {
    const urlFromEvil = buildBillingRedirectUrl(
      { origin: 'https://evil.example' },
      '/settings?tab=billing&billing=success',
    );
    const urlFromInvalid = buildBillingRedirectUrl(
      { origin: 'not-a-valid-origin' },
      '/settings?tab=billing&billing=success',
    );

    expect(urlFromEvil).toBe('https://pitchr.live/settings?tab=billing&billing=success');
    expect(urlFromInvalid).toBe('https://pitchr.live/settings?tab=billing&billing=success');
  });
});

describe('billing routes redirect hardening', () => {
  it('checkout route uses fallback base URL when origin is not allowlisted', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route');

    const request = new NextRequest('http://localhost/api/billing/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
      },
      body: JSON.stringify({ planId: 'pro', interval: 'month' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const checkoutInput = mockStartCheckout.mock.calls[0]?.[1] as {
      successUrl: string;
      cancelUrl: string;
    };
    expect(checkoutInput.successUrl).toBe('https://pitchr.live/settings?tab=billing&billing=success');
    expect(checkoutInput.cancelUrl).toBe('https://pitchr.live/settings?tab=billing&billing=canceled');
  });

  it('day-pass and credits checkout routes sanitize redirect origin', async () => {
    const { POST: dayPassPOST } = await import('@/app/api/billing/day-pass/route');
    const { POST: creditsPOST } = await import('@/app/api/billing/credits/route');

    const dayPassRequest = new NextRequest('http://localhost/api/billing/day-pass', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
      },
    });

    const creditsRequest = new NextRequest('http://localhost/api/billing/credits', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil.example',
      },
      body: JSON.stringify({ packSlug: 'starter' }),
    });

    const dayPassResponse = await dayPassPOST(dayPassRequest);
    const creditsResponse = await creditsPOST(creditsRequest);

    expect(dayPassResponse.status).toBe(200);
    expect(creditsResponse.status).toBe(200);

    const dayPassArgs = mockCreatePaymentCheckoutSession.mock.calls[0]?.[0] as {
      successUrl: string;
      cancelUrl: string;
    };
    const creditsArgs = mockCreatePaymentCheckoutSession.mock.calls[1]?.[0] as {
      successUrl: string;
      cancelUrl: string;
    };

    expect(dayPassArgs.successUrl).toBe('https://pitchr.live/settings?tab=billing&billing=day-pass-success');
    expect(dayPassArgs.cancelUrl).toBe('https://pitchr.live/settings?tab=billing&billing=canceled');
    expect(creditsArgs.successUrl).toBe('https://pitchr.live/settings?tab=billing&credits=success');
    expect(creditsArgs.cancelUrl).toBe('https://pitchr.live/settings?tab=billing');
  });

  it('portal route uses sanitized return URL', async () => {
    const { POST } = await import('@/app/api/billing/portal/route');

    const request = new NextRequest('http://localhost/api/billing/portal', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockStartPortalSession).toHaveBeenCalledWith(
      {},
      'user-1',
      'https://pitchr.live/settings',
    );
  });
});