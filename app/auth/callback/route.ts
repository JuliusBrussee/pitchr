import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') || '/setup';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(redirectTo, origin));
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(new URL('/login', origin));
}
