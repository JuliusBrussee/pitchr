import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect new users to onboarding unless an explicit redirectTo was set
      if (redirectTo === '/dashboard') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !user.user_metadata?.onboarding_completed) {
          return NextResponse.redirect(new URL('/setup', origin));
        }
      }
      return NextResponse.redirect(new URL(redirectTo, origin));
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(new URL('/login', origin));
}
