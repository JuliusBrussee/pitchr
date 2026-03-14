// Database-level analysis caching using SHA-256 transcript hashing.
// Allows identical re-submissions to skip LLM calls entirely.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';

export async function computeTranscriptHash(
  transcript: string,
  mode: string,
  deckText?: string,
  systemPromptOverride?: string,
): Promise<string> {
  const separator = '\x1F'; // ASCII unit separator
  const input = [transcript, mode, deckText ?? '', systemPromptOverride ?? ''].join(separator);
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// deno-lint-ignore no-explicit-any
export async function findCachedAnalysis(
  supabaseAdmin: SupabaseClient,
  transcriptHash: string,
// deno-lint-ignore no-explicit-any
): Promise<any | null> {
  const { data, error } = await supabaseAdmin
    .from('runs')
    .select('analysis')
    .eq('transcript_hash', transcriptHash)
    .eq('status', 'complete')
    .eq('is_fallback', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[analysis-cache] cache lookup failed', { error: error.message });
    return null;
  }

  return data?.analysis ?? null;
}
