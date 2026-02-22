export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export interface LlmCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  maxAttempts?: number;
  responseFormat?: 'json' | 'text';
}

export interface LlmProvider {
  complete(request: LlmCompletionRequest): Promise<string>;
}

export type LlmProviderName = 'openrouter' | 'anthropic';

export interface LlmRouterTelemetry {
  providerUsed: LlmProviderName;
  fallbackUsed: boolean;
  attemptCount: number;
  latencyMs: number;
  llmCallsUsed: number;
  failedAttempts?: Array<{
    provider: LlmProviderName;
    message: string;
  }>;
}

export interface LlmRouterResponse {
  text: string;
  telemetry: LlmRouterTelemetry;
}
