import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

const createServerClientMock = vi.mocked(createServerClient);

const ORIGINAL_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  PLAYWRIGHT_DISABLE_SUPABASE_AUTH: process.env.PLAYWRIGHT_DISABLE_SUPABASE_AUTH,
};

function restoreEnv(key: keyof typeof ORIGINAL_ENV) {
  const value = ORIGINAL_ENV[key];
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

afterEach(() => {
  restoreEnv('NEXT_PUBLIC_SUPABASE_URL');
  restoreEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  restoreEnv('PLAYWRIGHT_DISABLE_SUPABASE_AUTH');
});

describe('supabase middleware runtime env behavior', () => {
  it('bypasses Supabase auth lookups while preserving protected-route redirect behavior', async () => {
    process.env.PLAYWRIGHT_DISABLE_SUPABASE_AUTH = 'true';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

    const { updateSession } = await import('@/lib/supabase/middleware');
    const response = await updateSession(new NextRequest('http://localhost/session'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login?redirectTo=%2Fsession');
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it('redirects protected routes to login when Supabase env is missing', async () => {
    process.env.PLAYWRIGHT_DISABLE_SUPABASE_AUTH = 'false';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

    const { updateSession } = await import('@/lib/supabase/middleware');
    const response = await updateSession(new NextRequest('http://localhost/session'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login?redirectTo=%2Fsession');
    expect(createServerClientMock).not.toHaveBeenCalled();
  });
});
