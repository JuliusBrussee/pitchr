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

interface UsageRecord {
  event_name: string;
  customer_id?: string;
  external_customer_id?: string;
  product_id?: string;
  external_product_id?: string;
  data?: Record<string, unknown>;
  idempotency_key?: string;
}

interface UsageBulkPayload {
  usageRecords: UsageRecord[];
}

interface PaidAttributionIds {
  customer_id?: string;
  external_customer_id?: string;
  product_id?: string;
  external_product_id?: string;
}

const DEFAULT_PAID_API_BASE_URL = 'https://api.paid.ai';
const DEFAULT_TIMEOUT_MS = 2_000;
const MAX_ATTEMPTS = 2;
const DEFAULT_COMPLETED_EVENT = 'pitch_analysis_completed';
const DEFAULT_INVESTOR_READY_EVENT = 'investor_ready_achieved';

function isPaidEnabled(): boolean {
  const value = process.env.PAID_ENABLED?.toLowerCase().trim();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

function getBulkUsageEndpoint(): string {
  const base = process.env.PAID_API_BASE_URL?.trim() || DEFAULT_PAID_API_BASE_URL;
  return `${base.replace(/\/+$/u, '')}/v2/usage/bulk`;
}

function getAttributionIds(): PaidAttributionIds {
  const internalCustomerId = process.env.PAID_CUSTOMER_ID?.trim();
  const externalCustomerId = process.env.PAID_EXTERNAL_CUSTOMER_ID?.trim();
  const internalProductId = process.env.PAID_PRODUCT_ID?.trim();
  const externalProductId = process.env.PAID_EXTERNAL_PRODUCT_ID?.trim();

  return {
    ...(internalCustomerId
      ? { customer_id: internalCustomerId }
      : externalCustomerId
        ? { external_customer_id: externalCustomerId }
        : {}),
    ...(internalProductId
      ? { product_id: internalProductId }
      : externalProductId
        ? { external_product_id: externalProductId }
        : {}),
  };
}

function validateAttributionIds(ids: PaidAttributionIds): string | null {
  if (!ids.customer_id && !ids.external_customer_id) {
    return 'Missing customer identifier. Set PAID_CUSTOMER_ID or PAID_EXTERNAL_CUSTOMER_ID.';
  }

  if (!ids.product_id && !ids.external_product_id) {
    return 'Missing product identifier. Set PAID_PRODUCT_ID or PAID_EXTERNAL_PRODUCT_ID.';
  }

  return null;
}

function buildUsageRecord(
  input: SyncRunToPaidInput,
  eventName: string,
  timestamp: string,
  ids: PaidAttributionIds,
): UsageRecord {
  return {
    event_name: eventName,
    ...ids,
    idempotency_key: `${input.runId}:${eventName}`,
    data: {
      run_id: input.runId,
      mode: input.mode,
      overall_score: input.overallScore,
      event_timestamp: timestamp,
      latency_ms: input.latencyMs,
      fallback_used: input.fallbackUsed,
      estimated_input_tokens: input.economics.estimated_input_tokens,
      estimated_output_tokens: input.economics.estimated_output_tokens,
      estimated_cost_usd: input.economics.estimated_cost_usd,
      estimated_value_usd: input.economics.estimated_value_usd,
      coach_hourly_rate_usd: input.economics.coach_hourly_rate_usd,
      savings_realization_rate: input.economics.savings_realization_rate,
      money_saved_vs_coach_usd: input.economics.money_saved_vs_coach_usd,
      net_savings_usd: input.economics.gross_margin_usd,
      roi_multiple: input.economics.roi_multiple,
      time_saved_minutes: input.economics.time_saved_minutes,
      order_id: process.env.PAID_ORDER_ID?.trim() || undefined,
    },
  };
}

function buildUsageRecords(
  input: SyncRunToPaidInput,
  timestamp: string,
  ids: PaidAttributionIds,
): UsageRecord[] {
  const completedEvent =
    process.env.PAID_SIGNAL_EVENT_COMPLETED?.trim() || DEFAULT_COMPLETED_EVENT;
  const investorReadyEvent =
    process.env.PAID_SIGNAL_EVENT_INVESTOR_READY?.trim() ||
    DEFAULT_INVESTOR_READY_EVENT;

  const records: UsageRecord[] = [
    buildUsageRecord(input, completedEvent, timestamp, ids),
  ];

  if (input.overallScore >= 80) {
    records.push(buildUsageRecord(input, investorReadyEvent, timestamp, ids));
  }

  return records;
}

async function postUsageRecords(
  apiKey: string,
  payload: UsageBulkPayload,
): Promise<void> {
  const endpoint = getBulkUsageEndpoint();

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
        `Paid usage bulk request failed (${response.status})${body ? `: ${body}` : ''}`,
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
        throw new Error('Paid usage bulk request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
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

  const attributionIds = getAttributionIds();
  const attributionError = validateAttributionIds(attributionIds);
  if (attributionError) {
    return {
      status: 'skipped',
      sent_at: sentAt,
      error: attributionError,
    };
  }

  try {
    const usageRecords = buildUsageRecords(input, sentAt, attributionIds);
    await postUsageRecords(apiKey, { usageRecords });

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
