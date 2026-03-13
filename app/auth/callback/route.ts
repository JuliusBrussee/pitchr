import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  let redirectTo = searchParams.get('redirectTo') || '/setup';
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) redirectTo = '/setup';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // For OAuth sign-ins (e.g. Google) where redirectTo is not /setup,
      // detect first-time users by checking if their account was just created
      // (within the last 2 minutes) and route them through onboarding.
      if (redirectTo !== '/setup') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.created_at) {
          const ageMs = Date.now() - new Date(user.created_at).getTime();
          if (ageMs < 2 * 60 * 1000) {
            return NextResponse.redirect(new URL('/setup', origin));
          }
        }
      }
      return NextResponse.redirect(new URL(redirectTo, origin));
    }
  }

  // Auth code exchange failed — redirect to login with error context
  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('error', 'auth_callback_failed');
  return NextResponse.redirect(loginUrl);
}
