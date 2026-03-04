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
