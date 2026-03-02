import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/signup/:path*',
    '/login/:path*',
    '/auth/:path*',
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
