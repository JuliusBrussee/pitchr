import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  DEFAULT_POLICY_VERSION,
  isComplianceCompleted,
  isJurisdictionInScope,
  normalizeCountryCode,
  parseCompliancePhase,
  parseComplianceScope,
  resolveJurisdictionFromCountry,
} from '@/lib/compliance/rules';

// Keep in sync with the matcher in middleware.ts.
const PROTECTED_ROUTES = [
  '/dashboard',
  '/session',
  '/history',
  '/analytics',
  '/results',
  '/review',
  '/deck',
  '/qa',
  '/settings',
  '/projects',
  '/demo',
  '/compliance',
];

const AUTH_ROUTES = ['/login', '/signup', '/auth'];

// Signup is gated behind NEXT_PUBLIC_SIGNUP_ENABLED=true.
// When disabled, /signup redirects to the landing page waitlist.
const SIGNUP_ENABLED = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === 'true';
const BLOCKED_ROUTES: string[] = SIGNUP_ENABLED ? [] : ['/signup'];
const COMPLIANCE_EXEMPT_ROUTES = ['/compliance/check', '/privacy', '/terms'];

const COMPLIANCE_SCOPE = parseComplianceScope(process.env.GDPR_SCOPE);
const COMPLIANCE_PHASE = parseCompliancePhase(process.env.GDPR_COMPLIANCE_PHASE);
const COMPLIANCE_POLICY_VERSION = process.env.GDPR_POLICY_VERSION?.trim() || DEFAULT_POLICY_VERSION;

interface ComplianceProfileRow {
  jurisdiction: 'eea_uk' | 'rest_of_world' | 'unknown' | null;
  policy_version: string | null;
  terms_accepted_at: string | null;
  privacy_notice_acknowledged_at: string | null;
  contract_basis_confirmed_at: string | null;
  compliance_completed_at: string | null;
  ip_country: string | null;
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}

function requiresAuthLookup(pathname: string): boolean {
  return isProtectedRoute(pathname) || isAuthRoute(pathname);
}

function isComplianceExemptRoute(pathname: string): boolean {
  return COMPLIANCE_EXEMPT_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: string; message?: string };
  return value.code === '42P01' || value.message?.includes('does not exist') === true;
}

async function getComplianceProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
): Promise<ComplianceProfileRow | null> {
  const { data, error } = await supabase
    .from('user_compliance_profiles')
    .select(
      'jurisdiction,policy_version,terms_accepted_at,privacy_notice_acknowledged_at,contract_basis_confirmed_at,compliance_completed_at,ip_country',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return null;
    }
    throw error;
  }

  return (data as ComplianceProfileRow | null);
}

function resolveCountryCode(
  request: NextRequest,
  profile: ComplianceProfileRow | null,
): string | null {
  const fromHeader = normalizeCountryCode(request.headers.get('x-vercel-ip-country'));
  if (fromHeader) return fromHeader;

  const geoRequest = request as NextRequest & { geo?: { country?: string } };
  const fromGeo = normalizeCountryCode(geoRequest.geo?.country ?? null);
  if (fromGeo) return fromGeo;

  return normalizeCountryCode(profile?.ip_country ?? null);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect blocked routes (signup) to waitlist without auth lookup.
  if (BLOCKED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.hash = 'waitlist';
    return NextResponse.redirect(url);
  }

  // Public routes skip Supabase auth resolution to avoid request-time latency.
  if (!requiresAuthLookup(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes (except callback)
  if (user && isAuthRoute(pathname) && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (
    user &&
    COMPLIANCE_PHASE !== 'off' &&
    isProtectedRoute(pathname) &&
    !isComplianceExemptRoute(pathname)
  ) {
    try {
      const profile = await getComplianceProfile(supabase, user.id);
      const countryCode = resolveCountryCode(request, profile);

      let jurisdiction = resolveJurisdictionFromCountry(countryCode);
      if (
        jurisdiction === 'unknown' &&
        (profile?.jurisdiction === 'eea_uk' || profile?.jurisdiction === 'rest_of_world' || profile?.jurisdiction === 'unknown')
      ) {
        jurisdiction = profile.jurisdiction;
      }

      if (isJurisdictionInScope(COMPLIANCE_SCOPE, jurisdiction)) {
        const completed = isComplianceCompleted(profile, COMPLIANCE_POLICY_VERSION);
        if (!completed) {
          const url = request.nextUrl.clone();
          const nextPath = `${pathname}${request.nextUrl.search}`;
          url.pathname = '/compliance/check';
          url.searchParams.set('next', nextPath);
          return NextResponse.redirect(url);
        }
      }
    } catch (error) {
      // Fail open if compliance lookup fails to avoid accidental global lockout.
      console.warn('[middleware] compliance lookup failed; skipping compliance redirect', error);
    }
  }

  return supabaseResponse;
}
