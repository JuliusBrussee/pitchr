// Edge Function: transcribe-audio
// Accepts an audio file URL from Supabase Storage, transcribes it via
// AssemblyAI, and returns the transcript.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse, rateLimitResponse } from '../_shared/response.ts';
import { checkRateLimit, RateLimitExceededError } from '../_shared/rate-limit.ts';
import { transcribeAudioBytes } from '../_shared/assemblyai-stt.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Auth + rate limit
    const { user } = await getAuthenticatedUser(req);
    await checkRateLimit(user.id, 'transcribe-audio');

    const body = await req.json();
    const { audioUrl } = body as { audioUrl?: string };

    if (!audioUrl || typeof audioUrl !== 'string') {
      return errorResponse('audioUrl is required.', 400);
    }

    // Fetch the audio file from Supabase Storage
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      const detail = audioResponse.status === 404
        ? 'The uploaded audio file could not be found. It may have expired — please try uploading again.'
        : `Failed to retrieve the audio file (${audioResponse.status}). Please try uploading again.`;
      return errorResponse(detail, 400);
    }

    const audioBytes = new Uint8Array(await audioResponse.arrayBuffer());

    const { text: transcript } = await transcribeAudioBytes(audioBytes);

    const trimmed = transcript?.trim() ?? '';

    if (!trimmed) {
      return errorResponse(
        'No speech was detected in your recording. This can happen if the audio is too quiet, contains only background noise, or is mostly silence. Try re-recording in a quieter environment and speaking clearly into the microphone.',
        422,
      );
    }

    return jsonResponse({ transcript: trimmed });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error.message, error.retryAfter);
    }
    if (error instanceof Error && error.message.includes('ASSEMBLYAI_API_KEY')) {
      return errorResponse('Speech-to-text service is not configured.', 503);
    }
    console.error('[transcribe-audio] unexpected error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Transcription failed',
      500,
    );
  }
});
