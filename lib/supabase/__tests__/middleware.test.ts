import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createServerClient } from '@supabase/ssr';
import {
  AUTH_ROUTES,
  BLOCKED_ROUTES,
  PROTECTED_ROUTES,
  updateSession,
} from '@/lib/supabase/middleware';
import { config as middlewareConfig } from '@/middleware';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

const createServerClientMock = vi.mocked(createServerClient);

interface ComplianceProfileMock {
  jurisdiction?: 'eea_uk' | 'rest_of_world' | 'unknown' | null;
  policy_version?: string | null;
  terms_accepted_at?: string | null;
  privacy_notice_acknowledged_at?: string | null;
  contract_basis_confirmed_at?: string | null;
  compliance_completed_at?: string | null;
  ip_country?: string | null;
}

function mockUser(
  user: { id: string } | null,
  complianceProfile: ComplianceProfileMock | null = null,
) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: complianceProfile, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  createServerClientMock.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from,
  } as unknown as ReturnType<typeof createServerClient>);
}

function normalizeMatcherRoute(route: string): string {
  return route.replace(/\/:path\*$/, '');
}

describe('middleware protected routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'public-anon-key';
    process.env.GDPR_SCOPE = 'eea_uk';
    process.env.GDPR_POLICY_VERSION = '2026-03-04';
    process.env.GDPR_COMPLIANCE_PHASE = 'soft';
  });

  it('redirects unauthenticated users away from /projects', async () => {
    mockUser(null);
    const request = new NextRequest('http://localhost/projects');

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login?redirectTo=%2Fprojects');
  });

  it.each(['/upload', '/arena', '/progress', '/setup', '/orb-preview'])(
    'redirects unauthenticated users away from %s',
    async (route) => {
      mockUser(null);
      const request = new NextRequest(`http://localhost${route}`);

      const response = await updateSession(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain(
        `/login?redirectTo=${encodeURIComponent(route)}`,
      );
    },
  );

  it('allows authenticated users in non-EEA routes to access /projects', async () => {
    mockUser({ id: 'user-123' }, null);
    const request = new NextRequest('http://localhost/projects', {
      headers: { 'x-vercel-ip-country': 'US' },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects EEA users without compliance completion to /compliance/check', async () => {
    mockUser({ id: 'user-123' }, null);
    const request = new NextRequest('http://localhost/session', {
      headers: { 'x-vercel-ip-country': 'NL' },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/compliance/check?next=%2Fsession');
  });

  it('allows EEA users with completed compliance to access protected routes', async () => {
    const now = new Date().toISOString();
    mockUser(
      { id: 'user-123' },
      {
        jurisdiction: 'eea_uk',
        policy_version: '2026-03-04',
        terms_accepted_at: now,
        privacy_notice_acknowledged_at: now,
        contract_basis_confirmed_at: now,
        compliance_completed_at: now,
        ip_country: 'NL',
      },
    );

    const request = new NextRequest('http://localhost/session', {
      headers: { 'x-vercel-ip-country': 'NL' },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('does not redirect compliance route itself', async () => {
    mockUser({ id: 'user-123' }, null);
    const request = new NextRequest('http://localhost/compliance/check', {
      headers: { 'x-vercel-ip-country': 'NL' },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('keeps middleware matcher in parity with route policy arrays', () => {
    const matcherRoutes = (middlewareConfig.matcher as string[]).map(normalizeMatcherRoute);
    const policyRoutes = [...AUTH_ROUTES, ...PROTECTED_ROUTES, ...BLOCKED_ROUTES];

    expect(new Set(matcherRoutes)).toEqual(new Set(policyRoutes));
  });
});
