import { AnthropicProvider } from '@/lib/llm/providers/anthropic';
import { GeminiProvider } from '@/lib/llm/providers/gemini';
import { OpenRouterProvider } from '@/lib/llm/providers/openrouter';
import type {
  LlmCompletionRequest,
  LlmProvider,
  LlmProviderName,
  LlmRouterResponse,
} from '@/lib/llm/types';

function getConfiguredProvider(): LlmProviderName {
  const configured = process.env.LLM_PROVIDER?.toLowerCase();
  if (configured === 'openrouter') return 'openrouter';
  if (configured === 'gemini') return 'gemini';
  return 'anthropic';
}

function getProviderInstance(name: LlmProviderName): LlmProvider {
  if (name === 'anthropic') return new AnthropicProvider();
  if (name === 'gemini') return new GeminiProvider();
  return new OpenRouterProvider();
}

export async function completeWithLlmRouterWithTelemetry(
  request: LlmCompletionRequest,
): Promise<LlmRouterResponse> {
  const startedAt = Date.now();
  const providerName = getConfiguredProvider();
  const provider = getProviderInstance(providerName);

  try {
    const text = await provider.complete(request);
    return {
      text,
      telemetry: {
        providerUsed: providerName,
        fallbackUsed: false,
        attemptCount: 1,
        latencyMs: Date.now() - startedAt,
        llmCallsUsed: 1,
        failedAttempts: [],
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const telemetryError = new Error(`LLM provider ${providerName} failed: ${message}`) as Error & {
      telemetry?: LlmRouterResponse['telemetry'];
    };
    telemetryError.telemetry = {
      providerUsed: providerName,
      fallbackUsed: false,
      attemptCount: 1,
      latencyMs: Date.now() - startedAt,
      llmCallsUsed: 1,
      failedAttempts: [{ provider: providerName, message }],
    };
    throw telemetryError;
  }
}

export async function completeWithLlmRouter(
  request: LlmCompletionRequest,
): Promise<string> {
  const providerName = getConfiguredProvider();
  const provider = getProviderInstance(providerName);
  return provider.complete(request);
}

export function getActiveLlmProviderName(): LlmProviderName {
  return getConfiguredProvider();
}
