const CONVAI_BASE_URL = 'https://api.elevenlabs.io/v1/convai';
const SIGNED_URL_ENDPOINTS = ['conversation/get-signed-url', 'conversation/get_signed_url'] as const;

function getNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseProviderError(
  rawBody: string,
): {
  providerStatus?: string;
  providerMessage?: string;
} {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const payload = JSON.parse(trimmed) as unknown;
    if (!payload || typeof payload !== 'object') {
      return { providerMessage: trimmed };
    }

    const root = payload as Record<string, unknown>;
    const detail = root.detail;
    if (detail && typeof detail === 'object') {
      const detailRecord = detail as Record<string, unknown>;
      return {
        providerStatus: getNonEmptyString(detailRecord.status) ?? getNonEmptyString(root.status),
        providerMessage: getNonEmptyString(detailRecord.message) ?? getNonEmptyString(root.message),
      };
    }

    return {
      providerStatus: getNonEmptyString(root.status),
      providerMessage:
        getNonEmptyString(root.message) ??
        (typeof detail === 'string' ? getNonEmptyString(detail) : undefined),
    };
  } catch {
    return { providerMessage: trimmed };
  }
}

export class ElevenLabsConvaiError extends Error {
  readonly statusCode: number;
  readonly providerStatus?: string;
  readonly providerMessage?: string;

  constructor(params: {
    operation: string;
    statusCode: number;
    statusText: string;
    rawBody: string;
  }) {
    const parsed = parseProviderError(params.rawBody);
    const summary = parsed.providerMessage || params.statusText || 'Unknown provider error.';
    super(`ElevenLabs ${params.operation} failed (${params.statusCode}): ${summary}`);
    this.name = 'ElevenLabsConvaiError';
    this.statusCode = params.statusCode;
    this.providerStatus = parsed.providerStatus;
    this.providerMessage = parsed.providerMessage;
  }
}

function getApiKey(): string {
  return (
    process.env.ELEVENLABS_API_KEY_CONVAI?.trim() ||
    process.env.ELEVENLABS_API_KEY_STT?.trim() ||
    process.env.ELEVENLABS_API_KEY?.trim() ||
    ''
  );
}

function requireApiKey(): string {
  const key = getApiKey();
  if (!key) {
    throw new Error(
      'Missing ElevenLabs API key. Set ELEVENLABS_API_KEY_CONVAI (or ELEVENLABS_API_KEY_STT).',
    );
  }
  return key;
}

export interface SignedConversationUrl {
  signedUrl: string;
  conversationId?: string;
}

export async function getSignedUrl(
  agentId: string,
  includeConversationId = true,
): Promise<SignedConversationUrl> {
  const apiKey = requireApiKey();
  if (!agentId?.trim()) {
    throw new Error('Missing ElevenLabs agent id.');
  }

  const params = new URLSearchParams({
    agent_id: agentId.trim(),
  });
  if (includeConversationId) {
    params.set('include_conversation_id', 'true');
  }

  let lastError: ElevenLabsConvaiError | null = null;
  for (const endpoint of SIGNED_URL_ENDPOINTS) {
    const response = await fetch(
      `${CONVAI_BASE_URL}/${endpoint}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      const rawBody = await response.text();
      const providerError = new ElevenLabsConvaiError({
        operation: 'signed URL request',
        statusCode: response.status,
        statusText: response.statusText,
        rawBody,
      });
      lastError = providerError;
      const canFallback =
        endpoint === 'conversation/get-signed-url' &&
        (response.status === 404 || response.status === 405);
      if (canFallback) {
        continue;
      }
      throw providerError;
    }

    const payload = (await response.json()) as {
      signed_url?: string;
      signedUrl?: string;
      conversation_id?: string;
      conversationId?: string;
    };
    const signedUrl = payload.signed_url ?? payload.signedUrl;
    if (!signedUrl) {
      throw new Error('ElevenLabs signed URL response missing signed_url.');
    }

    return {
      signedUrl,
      conversationId: payload.conversation_id ?? payload.conversationId,
    };
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error('ElevenLabs signed URL request failed.');
}

export interface ElevenLabsConversationPayload {
  conversation_id?: string;
  transcript?: string;
  turns?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
  status?: string;
}

export async function getConversation(
  conversationId: string,
): Promise<ElevenLabsConversationPayload> {
  const apiKey = requireApiKey();
  if (!conversationId?.trim()) {
    throw new Error('conversationId is required.');
  }

  const response = await fetch(
    `${CONVAI_BASE_URL}/conversations/${encodeURIComponent(conversationId.trim())}`,
    {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const rawBody = await response.text();
    throw new ElevenLabsConvaiError({
      operation: 'conversation fetch',
      statusCode: response.status,
      statusText: response.statusText,
      rawBody,
    });
  }

  return (await response.json()) as ElevenLabsConversationPayload;
}
