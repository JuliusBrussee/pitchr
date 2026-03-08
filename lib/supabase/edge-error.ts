export interface EdgeErrorPayload {
  error?: unknown;
  message?: unknown;
  code?: unknown;
  redirectTo?: unknown;
  details?: unknown;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getEdgeErrorMessage(
  payload: EdgeErrorPayload | null | undefined,
  fallback: string,
): string {
  const errorMessage = asNonEmptyString(payload?.error);
  if (errorMessage) return errorMessage;

  const relayMessage = asNonEmptyString(payload?.message);
  if (relayMessage) return relayMessage;

  return fallback;
}

export function getEdgeErrorCode(
  payload: EdgeErrorPayload | null | undefined,
): string | null {
  return asNonEmptyString(payload?.code);
}

export function getEdgeRedirectTo(
  payload: EdgeErrorPayload | null | undefined,
): string | null {
  return asNonEmptyString(payload?.redirectTo);
}

/**
 * Detect rate-limit errors from Supabase auth error messages.
 */
export function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('rate limit') || lower.includes('too many requests');
}

/**
 * Parse retry_after from an edge function 429 response.
 * Checks JSON body `retry_after`, then `Retry-After` header, defaults to 60.
 */
export function parseRetryAfter(
  response: Response,
  body?: Record<string, unknown>,
): number {
  if (body && typeof body.retry_after === 'number' && body.retry_after > 0) {
    return Math.ceil(body.retry_after);
  }
  const header = response.headers.get('Retry-After');
  if (header) {
    const parsed = parseInt(header, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 60;
}
