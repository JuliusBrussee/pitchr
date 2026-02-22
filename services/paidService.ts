import type { PaidSyncMeta, RunEconomics } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

interface SyncRunToPaidInput {
  runId: string;
  mode: PitchMode;
  overallScore: number;
  latencyMs: number;
  fallbackUsed: boolean;
  economics: RunEconomics;
}

interface SignalPayload {
  signal_key: string;
  signal_timestamp: string;
  product_id?: string;
  customer_id?: string;
  order_id?: string;
  data: Record<string, unknown>;
}

const DEFAULT_PAID_API_BASE_URL = 'https://api.paid.ai';
const DEFAULT_TIMEOUT_MS = 2_000;
const MAX_ATTEMPTS = 2;

function isPaidEnabled(): boolean {
  const value = process.env.PAID_ENABLED?.toLowerCase().trim();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

function getEndpoint(): string {
  const base = process.env.PAID_API_BASE_URL?.trim() || DEFAULT_PAID_API_BASE_URL;
  return `${base.replace(/\/+$/u, '')}/v1/signals`;
}

async function postSignal(apiKey: string, payload: SignalPayload): Promise<void> {
  const endpoint = getEndpoint();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.ok) {
        return;
      }

      const body = await response.text();
      if (attempt < MAX_ATTEMPTS && shouldRetry(response.status)) {
        continue;
      }

      throw new Error(
        `Paid signal failed (${response.status})${body ? `: ${body}` : ''}`,
      );
    } catch (error) {
      if (attempt < MAX_ATTEMPTS) {
        const message = error instanceof Error ? error.message : String(error);
        const isAbort = error instanceof Error && error.name === 'AbortError';
        const isNetwork =
          isAbort ||
          message.toLowerCase().includes('network') ||
          message.toLowerCase().includes('fetch');
        if (isNetwork) {
          continue;
        }
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Paid signal request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildPayload(
  signalKey: string,
  input: SyncRunToPaidInput,
  timestamp: string,
): SignalPayload {
  return {
    signal_key: signalKey,
    signal_timestamp: timestamp,
    product_id: process.env.PAID_PRODUCT_ID?.trim() || undefined,
    customer_id: process.env.PAID_CUSTOMER_ID?.trim() || 'demo-founder',
    order_id: process.env.PAID_ORDER_ID?.trim() || undefined,
    data: {
      run_id: input.runId,
      mode: input.mode,
      overall_score: input.overallScore,
      latency_ms: input.latencyMs,
      fallback_used: input.fallbackUsed,
      estimated_input_tokens: input.economics.estimated_input_tokens,
      estimated_output_tokens: input.economics.estimated_output_tokens,
      estimated_cost_usd: input.economics.estimated_cost_usd,
      estimated_value_usd: input.economics.estimated_value_usd,
      roi_multiple: input.economics.roi_multiple,
      time_saved_minutes: input.economics.time_saved_minutes,
    },
  };
}

export async function syncRunToPaid(input: SyncRunToPaidInput): Promise<PaidSyncMeta> {
  const sentAt = new Date().toISOString();
  const apiKey = process.env.PAID_API_KEY?.trim();

  if (!isPaidEnabled()) {
    return {
      status: 'skipped',
      sent_at: sentAt,
      error: 'PAID_ENABLED is not true.',
    };
  }

  if (!apiKey) {
    return {
      status: 'skipped',
      sent_at: sentAt,
      error: 'Missing PAID_API_KEY.',
    };
  }

  try {
    await postSignal(apiKey, buildPayload('pitch_analysis_completed', input, sentAt));
    if (input.overallScore >= 80) {
      await postSignal(apiKey, buildPayload('investor_ready_achieved', input, sentAt));
    }

    return {
      status: 'sent',
      sent_at: sentAt,
    };
  } catch (error) {
    return {
      status: 'failed',
      sent_at: sentAt,
      error: error instanceof Error ? error.message : 'Failed to sync signals to Paid.',
    };
  }
}
