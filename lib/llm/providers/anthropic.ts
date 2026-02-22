import type { LlmCompletionRequest, LlmProvider } from '@/lib/llm/types';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS = 2;

interface AnthropicResponse {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  error?: {
    message?: string;
  };
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

export class AnthropicProvider implements LlmProvider {
  async complete(request: LlmCompletionRequest): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }

    const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(ANTHROPIC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            temperature: request.temperature ?? DEFAULT_TEMPERATURE,
            max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
            system: request.systemPrompt,
            messages: [{ role: 'user', content: request.userPrompt }],
          }),
          signal: controller.signal,
        });

        const payload = (await response.json()) as AnthropicResponse;
        if (!response.ok) {
          const errorMessage =
            payload.error?.message ??
            `Anthropic request failed with status ${response.status}`;
          if (attempt < MAX_ATTEMPTS && shouldRetry(response.status)) {
            continue;
          }
          throw new Error(errorMessage);
        }

        const text = payload.content
          ?.filter((part) => part.type === 'text')
          .map((part) => part.text ?? '')
          .join('')
          .trim();

        if (!text) {
          throw new Error('Anthropic returned an empty completion');
        }

        return text;
      } catch (error) {
        if (attempt < MAX_ATTEMPTS) {
          continue;
        }
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Anthropic request timed out');
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new Error('Anthropic request failed');
  }
}
