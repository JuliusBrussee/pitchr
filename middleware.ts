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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
