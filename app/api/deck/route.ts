import { NextResponse } from 'next/server';
import { listDecks } from '@/services/deckService';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';

export async function GET() {
  try {
    const { supabase } = await getAuthenticatedUser();
    const decks = await listDecks(supabase);
    return NextResponse.json(decks);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Failed to list decks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
