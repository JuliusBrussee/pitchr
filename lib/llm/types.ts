export type ChatTurn = { role: 'user' | 'assistant'; content: string };

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
