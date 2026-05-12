import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';
import type { DeckRecord, SlideRecord } from './types.ts';

/* ─── Supabase Storage ─── */

export async function uploadToStorage(
  supabase: SupabaseClient,
  userId: string,
  deckId: string,
  fileName: string,
  buffer: Uint8Array,
  contentType: string,
): Promise<string> {
  const filePath = `${userId}/${deckId}/${fileName}`;

  const { error } = await supabase.storage
    .from('decks')
    .upload(filePath, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed for path "${filePath}": ${error.message}`);

  const { data } = supabase.storage.from('decks').getPublicUrl(filePath);
  return data.publicUrl;
}

/* ─── Database Operations ─── */

export async function insertDeck(
  supabase: SupabaseClient,
  deck: Omit<DeckRecord, 'id' | 'created_at'>,
): Promise<DeckRecord> {
  const { data, error } = await supabase
    .from('decks')
    .insert(deck)
    .select()
    .single();

  if (error) throw new Error(`Failed to insert deck: ${error.message}`);
  return data;
}

export async function insertSlides(
  supabase: SupabaseClient,
  deckId: string,
  slides: { slideNum: number; text: string }[],
): Promise<void> {
  const rows = slides.map((s) => ({
    deck_id: deckId,
    slide_num: s.slideNum,
    text: s.text,
  }));

  const { error } = await supabase.from('slides').insert(rows);
  if (error) throw new Error(`Failed to insert slides: ${error.message}`);
}

export async function listDecks(
  supabase: SupabaseClient,
  opts?: { projectId?: string },
): Promise<DeckRecord[]> {
  let query = supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });
  if (opts?.projectId) {
    query = query.eq('project_id', opts.projectId);
  }
  const { data, error } = await query;

  if (error) throw new Error(`Failed to list decks: ${error.message}`);
  return data;
}

export async function getDeckWithSlides(
  supabase: SupabaseClient,
  deckId: string,
): Promise<{ deck: DeckRecord; slides: SlideRecord[] }> {
  const [deckRes, slidesRes] = await Promise.all([
    supabase.from('decks').select('*').eq('id', deckId).single(),
    supabase
      .from('slides')
      .select('*')
      .eq('deck_id', deckId)
      .order('slide_num', { ascending: true }),
  ]);

  if (deckRes.error) throw new Error(`Failed to get deck: ${deckRes.error.message}`);
  if (slidesRes.error) throw new Error(`Failed to get slides: ${slidesRes.error.message}`);

  return { deck: deckRes.data, slides: slidesRes.data };
}

export async function deleteDeck(supabase: SupabaseClient, userId: string, deckId: string): Promise<void> {
  // Delete storage files first
  const { data: files } = await supabase.storage.from('decks').list(`${userId}/${deckId}`);

  if (files && files.length > 0) {
    const paths = files.map((f: { name: string }) => `${userId}/${deckId}/${f.name}`);
    await supabase.storage.from('decks').remove(paths);
  }

  // Delete DB record (slides cascade via FK)
  const { error } = await supabase.from('decks').delete().eq('id', deckId);
  if (error) throw new Error(`Failed to delete deck: ${error.message}`);
}
