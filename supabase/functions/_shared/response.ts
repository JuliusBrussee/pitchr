import { corsHeaders } from './cors.ts';

/**
 * Create a JSON response with CORS headers.
 */
export function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error JSON response with CORS headers.
 */
export function errorResponse(
  message: string,
  status = 500,
): Response {
  return jsonResponse({ error: message }, status);
}
