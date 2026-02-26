/**
 * Helper to build edge function fetch calls.
 *
 * Replaces `/api/...` fetch calls with edge function URLs.
 * Automatically includes auth token and API key headers.
 */

import { createClient } from '@/lib/supabase/client';

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
 * Get auth headers for edge function calls.
 * Includes the Supabase anon key and the user's JWT.
 */
export async function getEdgeHeaders(
  extraHeaders?: Record<string, string>,
): Promise<Record<string, string>> {
  const supabase = createClient();

  // Try getSession first (reads from storage, no network call).
  // If it returns null, fall back to getUser() which refreshes the token.
  let accessToken: string | undefined;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    accessToken = session.access_token;
  } else {
    // getSession can return null when the stored session is stale or expired.
    // Calling getUser triggers a token refresh and re-populates the session.
    await supabase.auth.getUser();
    const { data: { session: refreshed } } = await supabase.auth.getSession();
    accessToken = refreshed?.access_token;
  }

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
