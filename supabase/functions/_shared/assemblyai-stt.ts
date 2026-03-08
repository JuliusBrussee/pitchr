/**
 * AssemblyAI Speech-to-Text for Supabase Edge (Deno).
 * Upload audio bytes, create transcript, poll until completed. Returns { text }.
 */

const DEFAULT_BASE_URL = 'https://api.assemblyai.com';
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 60_000;

function getApiKey(): string {
  const key = Deno.env.get('ASSEMBLYAI_API_KEY')?.trim();
  if (!key) {
    throw new Error(
      'Missing ASSEMBLYAI_API_KEY. Set it in Supabase Edge secrets for transcription.',
    );
  }
  return key;
}

function getBaseUrl(): string {
  return Deno.env.get('ASSEMBLYAI_BASE_URL')?.trim() || DEFAULT_BASE_URL;
}

interface AssemblyAIUploadResponse {
  upload_url?: string;
}

interface AssemblyAICreateResponse {
  id?: string;
}

interface AssemblyAITranscriptResponse {
  status?: string;
  text?: string;
  error?: string;
}

/**
 * Transcribe audio bytes via AssemblyAI. Returns transcript text.
 */
export async function transcribeAudioBytes(
  bytes: Uint8Array,
): Promise<{ text: string }> {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl().replace(/\/$/, '');

  if (bytes.length === 0) {
    return { text: '' };
  }

  // 1. Upload
  const uploadRes = await fetch(`${baseUrl}/v2/upload`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: bytes,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error('[assemblyai-stt] Upload failed', uploadRes.status, errText);
    throw new Error(
      `AssemblyAI upload failed (${uploadRes.status}): ${errText.slice(0, 200)}`,
    );
  }

  const uploadJson = (await uploadRes.json()) as AssemblyAIUploadResponse;
  const uploadUrl = uploadJson?.upload_url;
  if (!uploadUrl || typeof uploadUrl !== 'string') {
    throw new Error('AssemblyAI upload response missing upload_url.');
  }

  // 2. Create transcript
  const createRes = await fetch(`${baseUrl}/v2/transcript`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadUrl,
      speech_models: ['universal-3-pro', 'universal-2'],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('[assemblyai-stt] Create transcript failed', createRes.status, errText);
    throw new Error(
      `AssemblyAI create transcript failed (${createRes.status}): ${errText.slice(0, 200)}`,
    );
  }

  const createJson = (await createRes.json()) as AssemblyAICreateResponse;
  const transcriptId = createJson?.id;
  if (!transcriptId || typeof transcriptId !== 'string') {
    throw new Error('AssemblyAI create transcript response missing id.');
  }

  // 3. Poll until completed or error
  const startedAt = Date.now();
  let lastStatus: string | undefined;

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const getRes = await fetch(`${baseUrl}/v2/transcript/${transcriptId}`, {
      method: 'GET',
      headers: { Authorization: apiKey },
    });

    if (!getRes.ok) {
      const errText = await getRes.text();
      console.error('[assemblyai-stt] Get transcript failed', getRes.status, errText);
      throw new Error(
        `AssemblyAI get transcript failed (${getRes.status}): ${errText.slice(0, 200)}`,
      );
    }

    const transcript = (await getRes.json()) as AssemblyAITranscriptResponse;
    lastStatus = transcript?.status;

    if (transcript?.status === 'error') {
      const errMsg =
        typeof transcript.error === 'string'
          ? transcript.error
          : 'Transcription failed';
      console.error('[assemblyai-stt] Transcript error', errMsg);
      throw new Error(`AssemblyAI transcription error: ${errMsg}`);
    }

    if (transcript?.status === 'completed') {
      const text = typeof transcript.text === 'string' ? transcript.text.trim() : '';
      return { text };
    }
  }

  throw new Error(
    `AssemblyAI transcription timed out (last status: ${lastStatus ?? 'unknown'}).`,
  );
}
