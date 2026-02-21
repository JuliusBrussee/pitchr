import { AnthropicProvider } from '@/lib/llm/providers/anthropic';
import { OpenRouterProvider } from '@/lib/llm/providers/openrouter';
import type {
  LlmCompletionRequest,
  LlmProvider,
  LlmProviderName,
  LlmRouterResponse,
} from '@/lib/llm/types';

type RoutingMode =
  | 'openrouter_then_anthropic'
  | 'openrouter_only'
  | 'anthropic_only';

function readRoutingMode(): RoutingMode {
  const mode = process.env.LLM_ROUTING_MODE?.trim().toLowerCase();
  if (mode === 'openrouter_only') return 'openrouter_only';
  if (mode === 'anthropic_only') return 'anthropic_only';
  return 'openrouter_then_anthropic';
}

function providerFromEnv(
  value: string | undefined,
  fallback: LlmProviderName,
): LlmProviderName {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'anthropic') return 'anthropic';
  if (normalized === 'openrouter') return 'openrouter';
  return fallback;
}

function getProviderSequence(): LlmProviderName[] {
  const mode = readRoutingMode();
  const legacyPrimary = providerFromEnv(process.env.LLM_PROVIDER, 'openrouter');
  const primary = providerFromEnv(
    process.env.LLM_PROVIDER_PRIMARY,
    legacyPrimary,
  );
  const fallback = providerFromEnv(process.env.LLM_PROVIDER_FALLBACK, 'anthropic');

  if (mode === 'openrouter_only') return ['openrouter'];
  if (mode === 'anthropic_only') return ['anthropic'];

  const ordered = primary === fallback ? [primary] : [primary, fallback];
  const configured = ordered.filter((provider) => {
    if (provider === 'anthropic') {
      return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    }
    return Boolean(process.env.OPENROUTER_API_KEY?.trim());
  });

  return configured.length > 0 ? configured : ordered;
}

function getProviderInstance(name: LlmProviderName): LlmProvider {
  if (name === 'anthropic') return new AnthropicProvider();
  return new OpenRouterProvider();
}

export async function completeWithLlmRouterWithTelemetry(
  request: LlmCompletionRequest,
): Promise<LlmRouterResponse> {
  const startedAt = Date.now();
  const sequence = getProviderSequence();
  const failedAttempts: Array<{ provider: LlmProviderName; message: string }> = [];

  for (let index = 0; index < sequence.length; index += 1) {
    const providerName = sequence[index];
    const provider = getProviderInstance(providerName);

    try {
      const text = await provider.complete(request);
      return {
        text,
        telemetry: {
          providerUsed: providerName,
          fallbackUsed: index > 0,
          attemptCount: index + 1,
          latencyMs: Date.now() - startedAt,
          llmCallsUsed: index + 1,
          failedAttempts,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failedAttempts.push({ provider: providerName, message });
    }
  }

  const errorMessage = `All LLM providers failed (${sequence.join(' -> ')}): ${failedAttempts
    .map((attempt) => `${attempt.provider}: ${attempt.message}`)
    .join(' | ')}`;
  const error = new Error(errorMessage) as Error & {
    telemetry?: LlmRouterResponse['telemetry'];
  };
  error.telemetry = {
    providerUsed: sequence[0] ?? 'openrouter',
    fallbackUsed: sequence.length > 1,
    attemptCount: sequence.length,
    latencyMs: Date.now() - startedAt,
    llmCallsUsed: sequence.length,
    failedAttempts,
  };
  throw error;
}

export async function completeWithLlmRouter(
  request: LlmCompletionRequest,
): Promise<string> {
  const result = await completeWithLlmRouterWithTelemetry(request);
  return result.text;
}

export function getActiveLlmProviderName(): LlmProviderName {
  return getProviderSequence()[0] ?? 'openrouter';
}
