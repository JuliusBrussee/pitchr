import { type NextRequest } from 'next/server';
import {
  AUTH_ROUTES,
  BLOCKED_ROUTES,
  PROTECTED_ROUTES,
  updateSession,
} from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Keep in sync with PROTECTED_ROUTES, AUTH_ROUTES, and BLOCKED_ROUTES in lib/supabase/middleware.ts.
const MIDDLEWARE_ROUTES = Array.from(
  new Set([...AUTH_ROUTES, ...PROTECTED_ROUTES, ...BLOCKED_ROUTES]),
);

export const config = {
  matcher: MIDDLEWARE_ROUTES.map((route) => `${route}/:path*`),
};
