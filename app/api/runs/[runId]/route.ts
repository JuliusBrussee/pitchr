import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';

/* ——————————————————————————————————————————————————————————
 * PATCH /api/runs/[runId] — Patch mutable run fields post-creation.
 * Currently supports: audioUrl (patched after background upload completes).
 * —————————————————————————————————————————————————————————— */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { user } = await getAuthenticatedUser();
    const admin = createAdminClient();
    const { runId } = await params;

    if (!runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    }

    const body = (await req.json()) as { audioUrl?: unknown };
    const audioUrl = body.audioUrl;
    if (typeof audioUrl !== 'string' || !audioUrl) {
      return NextResponse.json({ error: 'audioUrl must be a non-empty string' }, { status: 400 });
    }

    const { error } = await admin
      .from('runs')
      .update({ audio_url: audioUrl })
      .eq('id', runId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update run' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
