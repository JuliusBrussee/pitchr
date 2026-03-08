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
  details?: Record<string, unknown>,
): Response {
  return jsonResponse(
    {
      error: message,
      ...(details ?? {}),
    },
    status,
  );
}

/**
 * Create a 429 rate-limit response with Retry-After header.
 * Always uses a generic message to avoid leaking endpoint names.
 */
export function rateLimitResponse(
  _message: string,
  retryAfter: number,
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again shortly.',
      retry_after: retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    },
  );
}
