// Shared CORS headers for all edge functions.
// Max-Age caches preflight (OPTIONS) responses in the browser for 24 hours.
// Without it, every cross-origin request triggers a fresh preflight round-trip
// to the edge function, adding 1-2s of latency per request due to cold starts.
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}
