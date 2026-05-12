import type { LlmCompletionRequest, LlmProvider } from '@/lib/llm/types';

const DEFAULT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS = 2;

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
    code?: number;
  };
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

export class GeminiProvider implements LlmProvider {
  async complete(request: LlmCompletionRequest): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('Missing GOOGLE_API_KEY');
    }

    const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const body: Record<string, unknown> = {
          contents: [
            {
              role: 'user',
              parts: [{ text: request.userPrompt }],
            },
          ],
          systemInstruction: {
            parts: [{ text: request.systemPrompt }],
          },
          generationConfig: {
            temperature: request.temperature ?? DEFAULT_TEMPERATURE,
            maxOutputTokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
            ...(request.responseFormat === 'json'
              ? { responseMimeType: 'application/json' }
              : {}),
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const raw = await response.text();
        let payload: GeminiResponse = {};
        try {
          payload = JSON.parse(raw) as GeminiResponse;
        } catch {
          payload = {};
        }

        if (!response.ok) {
          const errorMessage =
            payload.error?.message ??
            `Gemini request failed with status ${response.status}`;
          if (attempt < MAX_ATTEMPTS && shouldRetry(response.status)) {
            continue;
          }
          throw new Error(errorMessage);
        }

        const text = payload.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? '')
          .join('')
          .trim();

        if (!text) {
          throw new Error('Gemini returned an empty completion');
        }

        return text;
      } catch (error) {
        if (attempt < MAX_ATTEMPTS) {
          continue;
        }
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Gemini request timed out');
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error('Gemini request failed');
  }
}
