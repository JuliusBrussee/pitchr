# Paid AI Integration

This project supports optional Paid AI signal sync for completed pitch runs.

## What It Does

When a run finishes in the queue (`services/pitchRunQueueService.ts`), Pitchr calls `syncRunToPaid()` (`services/paidService.ts`) and sends outcome/value signals.

Signals sent:
- `pitch_analysis_completed` for every completed run
- `investor_ready_achieved` when `overall_score >= 80`

## Environment Variables

Set these in `.env.local`:

```env
PAID_ENABLED=true
PAID_API_KEY=your_paid_api_key
PAID_API_BASE_URL=https://api.paid.ai
PAID_PRODUCT_ID=
PAID_EXTERNAL_PRODUCT_ID=product_456
PAID_CUSTOMER_ID=
PAID_EXTERNAL_CUSTOMER_ID=customer_123
PAID_ORDER_ID=
PAID_SIGNAL_EVENT_COMPLETED=pitch_analysis_completed
PAID_SIGNAL_EVENT_INVESTOR_READY=investor_ready_achieved
```

Notes:
- If `PAID_ENABLED` is not truthy, sync is skipped.
- If enabled but `PAID_API_KEY` is missing, sync is skipped with an explicit error status.
- If both product and customer identifiers are missing, sync is skipped.
- Endpoint path is `/v2/usage/bulk`; base URL is configurable.

## Payload Shape (High Level)

Each request contains:
- `usageRecords` array
- Per record:
  - `event_name`
  - one customer identifier (`customer_id` or `external_customer_id`)
  - one product identifier (`product_id` or `external_product_id`)
  - optional `idempotency_key`
  - optional `data` with run/economics metadata

## Reliability + Failure Behavior

- Requests timeout after 2 seconds and retry up to 1 additional time on network errors, `429`, or `5xx`.
- Paid sync is non-blocking for run completion.
- Sync result is persisted into `analysis.meta.economics.paid_sync` with:
  - `status: sent | skipped | failed`
  - `sent_at`
  - optional `error`
