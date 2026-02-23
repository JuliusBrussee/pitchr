import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';
import { getRunStats } from '@/services/runService';

export async function GET(): Promise<NextResponse> {
  try {
    const { supabase } = await getAuthenticatedUser();
    const stats = await getRunStats(supabase);
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stats' },
      { status: 500 },
    );
  }
}
