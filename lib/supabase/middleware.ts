import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { detectDeviceType, type DeviceType } from '@/lib/detectDevice';

// Keep in sync with the matcher in middleware.ts.
export const PROTECTED_ROUTES = [
  '/arena',
  '/orb-preview',
  '/progress',
  '/setup',
  '/upload',
  '/dashboard',
  '/session',
  '/history',
  '/analytics',
  '/insights',
  '/results',
  '/review',
  '/deck',
  '/qa',
  '/settings',
  '/projects',
  '/demo',
  '/reset-password',
];

export const AUTH_ROUTES = ['/login', '/signup', '/auth', '/forgot-password'];

// Signup is gated behind NEXT_PUBLIC_SIGNUP_ENABLED=true.
// When disabled, /signup redirects to the landing page waitlist.
const SIGNUP_ENABLED = process.env.NEXT_PUBLIC_SIGNUP_ENABLED === 'true';
export const BLOCKED_ROUTES: string[] = SIGNUP_ENABLED ? [] : ['/signup'];
const PLAYWRIGHT_AUTH_BYPASS = process.env.PLAYWRIGHT_DISABLE_SUPABASE_AUTH === 'true';
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

function hasSupabaseRuntimeConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Device detection ---
  // Reuse cookie if already set; otherwise parse UA header once.
  const DEVICE_COOKIE = 'x-device-type';
  const deviceType: DeviceType =
    (request.cookies.get(DEVICE_COOKIE)?.value as DeviceType) ||
    detectDeviceType(request.headers.get('user-agent'));

  /** Stamp the device-type cookie onto any response before returning it. */
  function stampDevice(response: NextResponse): NextResponse {
    if (!response.cookies.get(DEVICE_COOKIE)) {
      response.cookies.set(DEVICE_COOKIE, deviceType, {
        path: '/',
        httpOnly: false, // readable by client JS
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 h — re-evaluated on every request anyway
      });
    }
    return response;
  }

  // Redirect blocked routes (signup) to waitlist without auth lookup.
  if (BLOCKED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.hash = 'waitlist';
    return stampDevice(NextResponse.redirect(url));
  }

  // Public routes skip Supabase auth resolution to avoid request-time latency.
  if (!requiresAuthLookup(pathname)) {
    return stampDevice(NextResponse.next({ request }));
  }

  // Local E2E can opt out of remote auth lookups to keep route smoke tests stable
  // when Supabase credentials are intentionally not configured.
  if (PLAYWRIGHT_AUTH_BYPASS) {
    return stampDevice(NextResponse.next({ request }));
  }

  if (!hasSupabaseRuntimeConfig()) {
    if (isProtectedRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return stampDevice(NextResponse.redirect(url));
    }
    return stampDevice(NextResponse.next({ request }));
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
    return stampDevice(NextResponse.redirect(url));
  }

  // Redirect authenticated users away from auth routes (except callback)
  if (user && isAuthRoute(pathname) && !pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return stampDevice(NextResponse.redirect(url));
  }

  return stampDevice(supabaseResponse);
}
