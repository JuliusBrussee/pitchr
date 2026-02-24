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
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    ...extraHeaders,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
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
