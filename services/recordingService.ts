import { supabase } from '@/lib/supabase';

const BUCKET = 'recordings';
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export async function uploadRecording(id: string, blob: Blob): Promise<string> {
  if (blob.size > MAX_SIZE_BYTES) {
    throw new Error(`Recording too large (${Math.round(blob.size / 1024 / 1024)} MB). Max is 100 MB.`);
  }

  const filePath = `${id}/recording.webm`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || 'video/webm',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload recording: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Delete a recording by its public URL. Extracts the storage path from the URL
 * to handle cases where the upload path doesn't match the run ID.
 */
export async function deleteRecordingByUrl(audioUrl: string): Promise<void> {
  // Extract the file path from the public URL.
  // URL format: {supabaseUrl}/storage/v1/object/public/recordings/{path}
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
