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

function mockUser(user: { id: string } | null) {
  createServerClientMock.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
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

  it('allows authenticated users to access /projects', async () => {
    mockUser({ id: 'user-123' });
    const request = new NextRequest('http://localhost/projects', {
      headers: { 'x-vercel-ip-country': 'US' },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('allows authenticated EEA users without compliance profile to access protected routes', async () => {
    // Compliance gating was intentionally removed from middleware.
    // See commit: 2915fb5 "Remove GDPR compliance flow and routes".
    mockUser({ id: 'user-123' });
    const request = new NextRequest('http://localhost/session', {
      headers: { 'x-vercel-ip-country': 'NL' },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('does not redirect compliance route itself', async () => {
    mockUser({ id: 'user-123' });
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
