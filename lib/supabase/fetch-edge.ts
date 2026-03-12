/**
 * Helper to build edge function fetch calls.
 *
 * Replaces `/api/...` fetch calls with edge function URLs.
 * Automatically includes auth token and API key headers.
 */

import { createClient } from '@/lib/supabase/client';
import {
  handleLocalRegressionEdgeRequest,
  isLocalRegressionMode,
} from '@/lib/supabase/local-regression-edge';

/** Cached auth token to avoid repeated getSession/getUser calls on the same page load. */
let cachedToken: string | null = null;
let cacheExpiresAt = 0;
let pendingAuth: Promise<string | null> | null = null;
const AUTH_CACHE_MS = 30_000;

/**
 * Build a full edge function URL.
 */
export function edgeFunctionUrl(
  functionName: string,
  params?: Record<string, string> | URLSearchParams,
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  const url = new URL(`${supabaseUrl}/functions/v1/${functionName}`);
  if (params) {
    const entries = params instanceof URLSearchParams
      ? params.entries()
      : Object.entries(params);
    for (const [key, value] of entries) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/**
 * Resolve the current access token, with a short-lived cache so concurrent
 * fetchEdge calls on the same page mount share a single auth round-trip.
 */
async function resolveAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cacheExpiresAt) {
    return cachedToken;
  }

  // Deduplicate concurrent callers — only one auth request in flight.
  if (pendingAuth) return pendingAuth;

  pendingAuth = (async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      cachedToken = session.access_token;
      cacheExpiresAt = Date.now() + AUTH_CACHE_MS;
      return cachedToken;
    }

    // getSession can return null when the stored session is stale or expired.
    // Calling getUser triggers a token refresh and re-populates the session.
    await supabase.auth.getUser();
    const { data: { session: refreshed } } = await supabase.auth.getSession();
    cachedToken = refreshed?.access_token ?? null;
    cacheExpiresAt = Date.now() + AUTH_CACHE_MS;
    return cachedToken;
  })();

  try {
    return await pendingAuth;
  } finally {
    pendingAuth = null;
  }
}

/**
 * Get auth headers for edge function calls.
 * Includes the Supabase anon key and the user's JWT.
 */
export async function getEdgeHeaders(
  extraHeaders?: Record<string, string>,
): Promise<Record<string, string>> {
  const accessToken = await resolveAccessToken();

  const headers: Record<string, string> = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    ...extraHeaders,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    console.warn('[fetchEdge] No auth session available — edge function call will be unauthenticated');
  }

  return headers;
}

/**
 * Fetch from an edge function with automatic auth.
 * Drop-in replacement for fetch('/api/...', options).
 */
export async function fetchEdge(
  functionName: string,
  init?: RequestInit & { params?: Record<string, string> | URLSearchParams },
): Promise<Response> {
  if (isLocalRegressionMode()) {
    return handleLocalRegressionEdgeRequest(functionName, init);
  }

  const url = edgeFunctionUrl(functionName, init?.params);
  const authHeaders = await getEdgeHeaders(
    init?.headers as Record<string, string> | undefined,
  );

  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}
