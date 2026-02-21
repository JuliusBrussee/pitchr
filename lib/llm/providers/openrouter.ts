import type { LlmCompletionRequest, LlmProvider } from '@/lib/llm/types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-3-flash-preview';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS = 2;

interface OpenRouterMessage {
  content: string | Array<{ text?: string }>;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: OpenRouterMessage;
  }>;
  error?: {
    message?: string;
  };
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

function extractContent(message: OpenRouterMessage | undefined): string {
  if (!message) return '';
  if (typeof message.content === 'string') return message.content;
  return message.content
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

export class OpenRouterProvider implements LlmProvider {
  async complete(request: LlmCompletionRequest): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }

    const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature: request.temperature ?? DEFAULT_TEMPERATURE,
            max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
            response_format:
              request.responseFormat === 'json'
                ? { type: 'json_object' }
                : undefined,
            messages: [
              { role: 'system', content: request.systemPrompt },
              { role: 'user', content: request.userPrompt },
            ],
          }),
          signal: controller.signal,
        });

        const payload = (await response.json()) as OpenRouterResponse;
        if (!response.ok) {
          const errorMessage =
            payload.error?.message ??
            `OpenRouter request failed with status ${response.status}`;
          if (attempt < MAX_ATTEMPTS && shouldRetry(response.status)) {
            continue;
          }
          throw new Error(errorMessage);
        }

        const content = extractContent(payload.choices?.[0]?.message);
        if (!content) {
          throw new Error('OpenRouter returned an empty completion');
        }

        return content;
      } catch (error) {
        if (attempt < MAX_ATTEMPTS) {
          continue;
        }
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('OpenRouter request timed out');
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error('OpenRouter request failed');
  }
}
