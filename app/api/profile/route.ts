import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

/* ——————————————————————————————————————————————————————————
 * GET /api/profile — Get current user's profile
 * PUT /api/profile — Update display_name
 * —————————————————————————————————————————————————————————— */

export async function GET() {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[profile] GET error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ displayName: data?.display_name ?? '' });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[profile] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();

    const body = await request.json();
    const displayName = typeof body.displayName === 'string'
      ? body.displayName.trim().slice(0, 50)
      : '';

    if (!displayName) {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
    }

    const { error } = await admin
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[profile] PUT error:', error.message);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ displayName });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[profile] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
