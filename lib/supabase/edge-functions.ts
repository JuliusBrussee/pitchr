/**
 * Edge Functions API Client
 *
 * Provides typed wrappers for calling Supabase Edge Functions.
 * Replaces direct fetch calls to /api/* routes.
 *
 * Usage:
 *   import { edgeFunctions } from '@/lib/supabase/edge-functions';
 *   const result = await edgeFunctions.pitchRun.list({ mode: 'elevator' });
 */

import { createClient } from '@/lib/supabase/client';

interface FetchOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
}

/**
 * Call a Supabase Edge Function with automatic auth token forwarding.
 */
async function invokeEdgeFunction<T>(
  functionName: string,
  options: FetchOptions = {},
): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  const url = new URL(`${supabaseUrl}/functions/v1/${functionName}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const fetchOptions: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  };

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(
      (errorBody as { error?: string }).error ?? `Edge function ${functionName} failed (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Call a Supabase Edge Function with FormData (for file uploads).
 */
async function invokeEdgeFunctionFormData<T>(
  functionName: string,
  formData: FormData,
): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  const url = `${supabaseUrl}/functions/v1/${functionName}`;

  const headers: Record<string, string> = {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(
      (errorBody as { error?: string }).error ?? `Edge function ${functionName} failed (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Typed API for all edge functions.
 */
export const edgeFunctions = {
  pitchRun: {
    /** POST /pitch-run — Create a new pitch run */
    create: <T>(body: unknown) =>
      invokeEdgeFunction<T>('pitch-run', { method: 'POST', body }),

    /** GET /pitch-run — List pitch runs */
    list: <T>(params?: {
      mode?: string;
      limit?: string;
      includePending?: string;
      projectId?: string;
      allProjects?: string;
    }) =>
      invokeEdgeFunction<T>('pitch-run', {
        params: params as Record<string, string>,
      }),
  },

  pitchRunDetail: {
    /** GET /pitch-run-detail?runId=... — Fetch a specific run */
    get: <T>(runId: string) =>
      invokeEdgeFunction<T>('pitch-run-detail', { params: { runId } }),

    /** DELETE /pitch-run-detail?runId=... — Delete a run */
    delete: <T>(runId: string) =>
      invokeEdgeFunction<T>('pitch-run-detail', {
        method: 'DELETE',
        params: { runId },
      }),
  },

  pitchRunStats: {
    /** GET /pitch-run-stats — Fetch run stats */
    get: <T>(params?: { mode?: string; projectId?: string; allProjects?: string }) =>
      invokeEdgeFunction<T>('pitch-run-stats', {
        params: params as Record<string, string>,
      }),
  },

  deckList: {
    /** GET /deck-list — List all decks */
    get: <T>(params?: { projectId?: string; allProjects?: string }) =>
      invokeEdgeFunction<T>('deck-list', {
        params: params as Record<string, string>,
      }),
  },

  deckUpload: {
    /** POST /deck-upload — Upload a deck file */
    upload: <T>(formData: FormData) =>
      invokeEdgeFunctionFormData<T>('deck-upload', formData),
  },

  deckDetail: {
    /** GET /deck-detail?deckId=... — Fetch deck with slides */
    get: <T>(deckId: string) =>
      invokeEdgeFunction<T>('deck-detail', { params: { deckId } }),

    /** DELETE /deck-detail?deckId=... — Delete a deck */
    delete: <T>(deckId: string) =>
      invokeEdgeFunction<T>('deck-detail', {
        method: 'DELETE',
        params: { deckId },
      }),
  },

  deckGenerate: {
    /** POST /deck-generate — AI-generate a deck */
    create: <T>(body: unknown) =>
      invokeEdgeFunction<T>('deck-generate', { method: 'POST', body }),
  },

  miroFixBoard: {
    /** GET /miro-fix-board?runId=... — Fetch fix board */
    get: <T>(runId: string) =>
      invokeEdgeFunction<T>('miro-fix-board', { params: { runId } }),

    /** POST /miro-fix-board — Create fix board */
    create: <T>(body: unknown) =>
      invokeEdgeFunction<T>('miro-fix-board', { method: 'POST', body }),

    /** PATCH /miro-fix-board — Update fix */
    patch: <T>(body: unknown) =>
      invokeEdgeFunction<T>('miro-fix-board', { method: 'PATCH', body }),
  },

  miroFixBoardMarkdown: {
    /** POST /miro-fix-board-markdown — Generate markdown */
    create: <T>(body: unknown) =>
      invokeEdgeFunction<T>('miro-fix-board-markdown', { method: 'POST', body }),
  },

  miroFixBoardSync: {
    /** GET /miro-fix-board-sync?runId=... — Sync board state */
    get: <T>(runId: string) =>
      invokeEdgeFunction<T>('miro-fix-board-sync', { params: { runId } }),
  },

  qnaSession: {
    /** POST /qna-session — Create QA session */
    create: <T>(body: unknown) =>
      invokeEdgeFunction<T>('qna-session', { method: 'POST', body }),
  },

  qnaSessionDetail: {
    /** GET /qna-session-detail?qaSessionId=... — Fetch QA session */
    get: <T>(qaSessionId: string) =>
      invokeEdgeFunction<T>('qna-session-detail', {
        params: { qaSessionId },
      }),
  },

  qnaSessionComplete: {
    /** POST /qna-session-complete?qaSessionId=... — Complete QA session */
    complete: <T>(qaSessionId: string, body: unknown) =>
      invokeEdgeFunction<T>('qna-session-complete', {
        method: 'POST',
        params: { qaSessionId },
        body,
      }),
  },
  qnaResourcesRefresh: {
    /** POST /qna-resources-refresh - Refresh knowledge resources */
    refresh: <T>(body?: unknown) =>
      invokeEdgeFunction<T>('qna-resources-refresh', {
        method: 'POST',
        body: body ?? {},
      }),
  },
  integrationHealth: {
    /** GET /integration-health — Check edge integration readiness */
    get: <T>() => invokeEdgeFunction<T>('integration-health'),
  },
  projects: {
    /** GET /projects — List projects */
    list: <T>(params?: { includeArchived?: string }) =>
      invokeEdgeFunction<T>('projects', {
        params: params as Record<string, string>,
      }),
    /** POST /projects — Create project */
    create: <T>(body: unknown) =>
      invokeEdgeFunction<T>('projects', { method: 'POST', body }),
    /** PATCH /projects — Update project / set active */
    update: <T>(body: unknown) =>
      invokeEdgeFunction<T>('projects', { method: 'PATCH', body }),
  },
};

/**
 * Helper to build the direct URL for an edge function.
 * Useful for cases where you need the URL (e.g., for non-JSON responses).
 */
export function getEdgeFunctionUrl(functionName: string, params?: Record<string, string>): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  const url = new URL(`${supabaseUrl}/functions/v1/${functionName}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}
