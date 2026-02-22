const TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';

export interface SynthesizeResult {
  audio: Buffer;
  mimeType: 'audio/mpeg';
}

export async function synthesizeMp3(text: string): Promise<SynthesizeResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY_TTS?.trim();
  const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();
  if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY_TTS');
  if (!voiceId) throw new Error('Missing ELEVENLABS_VOICE_ID');

  const url = `${TTS_URL}/${voiceId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: DEFAULT_MODEL_ID,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let message = `ElevenLabs TTS failed: ${response.status}`;
    try {
      const json = JSON.parse(errText) as { detail?: { message?: string; code?: string } };
      const detail = json.detail?.message ?? json.detail?.code;
      if (detail) message += ` ${detail}`;
      else message += ` ${errText.slice(0, 200)}`;
    } catch {
      message += ` ${errText.slice(0, 200)}`;
    }
    throw new Error(message);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audio = Buffer.from(arrayBuffer);
  return { audio, mimeType: 'audio/mpeg' as const };
}
