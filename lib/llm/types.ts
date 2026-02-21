export interface LlmCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  responseFormat?: 'json' | 'text';
}

export interface LlmProvider {
  complete(request: LlmCompletionRequest): Promise<string>;
}
