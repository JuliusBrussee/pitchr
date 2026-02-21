import { NextResponse } from 'next/server';
import { listDecks } from '@/services/deckService';

export async function GET() {
  try {
    const decks = await listDecks();
    return NextResponse.json(decks);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list decks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
