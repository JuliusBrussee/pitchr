const LOCALHOST_FALLBACK_ORIGIN = 'http://localhost:3000';

interface BillingRedirectPolicy {
  allowlistOrigins: string[];
  fallbackOrigin: string;
}

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function parseOriginList(raw: string | undefined): string[] {
  if (!raw) return [];

  const parsed = raw
    .split(',')
    .map((entry) => normalizeOrigin(entry.trim()))
    .filter((entry): entry is string => Boolean(entry));

  return Array.from(new Set(parsed));
}

function resolveBaseOrigin(): string {
  const configured =
    normalizeOrigin(process.env.BILLING_REDIRECT_BASE_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);

  if (configured) return configured;

  if (process.env.NODE_ENV !== 'production') {
    return LOCALHOST_FALLBACK_ORIGIN;
  }

  throw new Error(
    'Missing BILLING_REDIRECT_BASE_URL (or NEXT_PUBLIC_APP_URL) for billing redirects.',
  );
}

export function resolveBillingRedirectPolicy(): BillingRedirectPolicy {
  const fallbackOrigin = resolveBaseOrigin();
  const configuredAllowlist = parseOriginList(process.env.BILLING_REDIRECT_ALLOWED_ORIGINS);
  const allowlistOrigins = configuredAllowlist.length > 0
    ? configuredAllowlist
    : [fallbackOrigin];

  if (!allowlistOrigins.includes(fallbackOrigin)) {
    allowlistOrigins.unshift(fallbackOrigin);
  }

  return {
    allowlistOrigins,
    fallbackOrigin,
  };
}

export function buildBillingRedirectUrl(
  context: { origin?: string | null },
  path: string,
): string {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
  const { allowlistOrigins, fallbackOrigin } = resolveBillingRedirectPolicy();
  const candidateOrigin = normalizeOrigin(context.origin);
  const chosenOrigin =
    candidateOrigin && allowlistOrigins.includes(candidateOrigin)
      ? candidateOrigin
      : fallbackOrigin;

  return new URL(sanitizedPath, chosenOrigin).toString();
}