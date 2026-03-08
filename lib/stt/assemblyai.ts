/**
 * AssemblyAI Speech-to-Text: upload audio, create transcript, poll until completed.
 * Server-only; uses ASSEMBLYAI_API_KEY and optional ASSEMBLYAI_BASE_URL.
 */

const DEFAULT_BASE_URL = 'https://api.assemblyai.com';
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 60_000;

function getApiKey(): string {
  const key = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'Missing ASSEMBLYAI_API_KEY. Set it in .env.local for transcription.',
    );
  }
  return key;
}

function getBaseUrl(): string {
  return process.env.ASSEMBLYAI_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

export interface TranscribeAudioInput {
  /** Raw audio bytes (e.g. WAV, webm, mp3). */
  bytes: Buffer | Uint8Array;
  /** Optional; used for logging. */
  mimeType?: string;
}

export interface TranscribeAudioOutput {
  text: string;
  words?: Array<{ text: string; start: number; end: number }>;
}

interface AssemblyAIUploadResponse {
  upload_url?: string;
}

interface AssemblyAICreateResponse {
  id?: string;
}

interface AssemblyAIWord {
  text?: string;
  start?: number;
  end?: number;
}

interface AssemblyAITranscriptResponse {
  status?: string;
  text?: string;
  words?: AssemblyAIWord[];
  error?: string;
}

/**
 * Upload bytes to AssemblyAI, create transcript with speech_models, poll until completed.
 * Returns text and optional words with start/end in seconds.
 */
export async function transcribeAudio(
  input: TranscribeAudioInput,
): Promise<TranscribeAudioOutput> {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const bytes =
    input.bytes instanceof Buffer ? input.bytes : Buffer.from(input.bytes);

  if (bytes.length === 0) {
    return { text: '' };
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[AssemblyAI STT] Uploading', bytes.length, 'bytes');
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AssemblyAI STT] Upload failed', uploadRes.status, errText);
    }
    throw new Error(
      `AssemblyAI upload failed (${uploadRes.status}): ${errText.slice(0, 200)}`,
    );
  }

  const uploadJson = (await uploadRes.json()) as AssemblyAIUploadResponse;
  const uploadUrl = uploadJson?.upload_url;
  if (!uploadUrl || typeof uploadUrl !== 'string') {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AssemblyAI STT] Upload response missing upload_url', uploadJson);
    }
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
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AssemblyAI STT] Create transcript failed', createRes.status, errText);
    }
    throw new Error(
      `AssemblyAI create transcript failed (${createRes.status}): ${errText.slice(0, 200)}`,
    );
  }

  const createJson = (await createRes.json()) as AssemblyAICreateResponse;
  const transcriptId = createJson?.id;
  if (!transcriptId || typeof transcriptId !== 'string') {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AssemblyAI STT] Create response missing id', createJson);
    }
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
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AssemblyAI STT] Get transcript failed', getRes.status, errText);
      }
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
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AssemblyAI STT] Transcript error', errMsg);
      }
      throw new Error(`AssemblyAI transcription error: ${errMsg}`);
    }

    if (transcript?.status === 'completed') {
      const text = typeof transcript.text === 'string' ? transcript.text.trim() : '';
      const rawWords = transcript.words;
      let words: TranscribeAudioOutput['words'];

      if (Array.isArray(rawWords) && rawWords.length > 0) {
        words = rawWords
          .map((w) => {
            const text = typeof w.text === 'string' ? w.text : '';
            const startMs = typeof w.start === 'number' ? w.start : 0;
            const endMs = typeof w.end === 'number' ? w.end : startMs;
            return {
              text,
              start: startMs / 1000,
              end: endMs / 1000,
            };
          })
          .filter((w) => w.text.length > 0);
      }

      return { text, words };
    }
  }

  throw new Error(
    `AssemblyAI transcription timed out (last status: ${lastStatus ?? 'unknown'}).`,
  );
}
