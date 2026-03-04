// Edge Function: transcribe-audio
// Accepts an audio file URL from Supabase Storage, transcribes it via
// ElevenLabs Speech-to-Text file API, and returns the transcript.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';

const ELEVENLABS_STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Auth check
    await getAuthenticatedUser(req);

    const body = await req.json();
    const { audioUrl } = body as { audioUrl?: string };

    if (!audioUrl || typeof audioUrl !== 'string') {
      return errorResponse('audioUrl is required.', 400);
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY_STT');
    if (!apiKey) {
      return errorResponse('Speech-to-text service is not configured.', 503);
    }

    // Fetch the audio file from Supabase Storage
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return errorResponse(
        `Failed to fetch audio file: ${audioResponse.status} ${audioResponse.statusText}`,
        400,
      );
    }

    const audioBlob = await audioResponse.blob();

    // Determine filename from URL for the multipart form
    const urlPath = new URL(audioUrl).pathname;
    const fileName = urlPath.split('/').pop() ?? 'recording.webm';

    // Send to ElevenLabs STT file API
    const formData = new FormData();
    formData.append('file', audioBlob, fileName);
    formData.append('model_id', 'scribe_v1');

    const sttResponse = await fetch(ELEVENLABS_STT_URL, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!sttResponse.ok) {
      const errorText = await sttResponse.text();
      console.error('[transcribe-audio] ElevenLabs STT failed', {
        status: sttResponse.status,
        body: errorText,
      });
      return errorResponse(
        `Transcription failed (${sttResponse.status}). Please try again.`,
        502,
      );
    }

    const sttResult = await sttResponse.json() as { text?: string };
    const transcript = sttResult.text?.trim() ?? '';

    if (!transcript) {
      return errorResponse(
        'No speech detected in the recording. Please upload a recording with audible speech.',
        422,
      );
    }

    return jsonResponse({ transcript });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    console.error('[transcribe-audio] unexpected error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Transcription failed',
      500,
    );
  }
});
