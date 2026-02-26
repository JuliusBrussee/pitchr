import type { SupabaseClient } from 'npm:@supabase/supabase-js@^2.97.0';

const BUCKET = 'recordings';

/**
 * Delete a recording by its public URL. Extracts the storage path from the URL.
 */
export async function deleteRecordingByUrl(supabase: SupabaseClient, audioUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = audioUrl.indexOf(marker);
  if (idx === -1) {
    throw new Error('Could not extract storage path from recording URL');
  }
  const filePath = audioUrl.slice(idx + marker.length);

  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) {
    throw new Error(`Failed to delete recording: ${error.message}`);
  }
}
