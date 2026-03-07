// Edge Function: transcribe-audio
// Accepts an audio file URL from Supabase Storage, transcribes it via
// ElevenLabs Speech-to-Text file API, and returns the transcript.

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse, rateLimitResponse } from '../_shared/response.ts';
import { checkRateLimit, RateLimitExceededError } from '../_shared/rate-limit.ts';

const ELEVENLABS_STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

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

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY_STT');
    if (!apiKey) {
      return errorResponse('Speech-to-text service is not configured.', 503);
    }

    // Fetch the audio file from Supabase Storage
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      const detail = audioResponse.status === 404
        ? 'The uploaded audio file could not be found. It may have expired — please try uploading again.'
        : `Failed to retrieve the audio file (${audioResponse.status}). Please try uploading again.`;
      return errorResponse(detail, 400);
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
        errorText,
      });

      let userMessage: string;
      if (sttResponse.status === 400) {
        userMessage = 'The audio file could not be processed. It may be corrupted or in an unsupported format. Try converting it to MP3 or WAV and uploading again.';
      } else if (sttResponse.status === 413) {
        userMessage = 'The audio file is too large for transcription. Try trimming it to under 30 minutes or compressing it.';
      } else if (sttResponse.status === 429) {
        userMessage = 'Transcription service is temporarily busy. Please wait a moment and try again.';
      } else if (sttResponse.status >= 500) {
        userMessage = 'The transcription service is temporarily unavailable. Please try again in a few minutes.';
      } else {
        userMessage = `Transcription failed (${sttResponse.status}). Please try again.`;
      }
      return errorResponse(userMessage, 502);
    }

    const sttResult = await sttResponse.json() as { text?: string };
    const transcript = sttResult.text?.trim() ?? '';

    if (!transcript) {
      return errorResponse(
        'No speech was detected in your recording. This can happen if the audio is too quiet, contains only background noise, or is mostly silence. Try re-recording in a quieter environment and speaking clearly into the microphone.',
        422,
      );
    }

    return jsonResponse({ transcript });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse(error.message, 401);
    }
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error.message, error.retryAfter);
    }
    console.error('[transcribe-audio] unexpected error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Transcription failed',
      500,
    );
  }
});
