import { type NextRequest } from 'next/server';
import {
  updateSession,
} from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Catch-all matcher excluding static assets.
// Device detection (x-device-type cookie) needs to run on ALL page routes,
// including marketing and auth pages that were previously excluded.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
