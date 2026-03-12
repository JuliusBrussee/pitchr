import { type NextRequest } from 'next/server';
import {
  updateSession,
} from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Keep in sync with PROTECTED_ROUTES, AUTH_ROUTES, and BLOCKED_ROUTES in lib/supabase/middleware.ts.
// Next.js only accepts inline-literal matcher values here.
export const config = {
  matcher: [
    '/login/:path*',
    '/signup/:path*',
    '/auth/:path*',
    '/forgot-password/:path*',
    '/arena/:path*',
    '/orb-preview/:path*',
    '/progress/:path*',
    '/setup/:path*',
    '/upload/:path*',
    '/dashboard/:path*',
    '/session/:path*',
    '/history/:path*',
    '/analytics/:path*',
    '/results/:path*',
    '/review/:path*',
    '/deck/:path*',
    '/qa/:path*',
    '/settings/:path*',
    '/projects/:path*',
    '/demo/:path*',
  ],
};
