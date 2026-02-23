import { NextRequest, NextResponse } from 'next/server';
import { getDeckWithSlides, deleteDeck } from '@/services/deckService';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> },
) {
  try {
    const { supabase } = await getAuthenticatedUser();
    const { deckId } = await params;
    const result = await getDeckWithSlides(supabase, deckId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to get deck';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> },
) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const { deckId } = await params;
    await deleteDeck(supabase, user.id, deckId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to delete deck';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
