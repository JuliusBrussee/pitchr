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
PAID_CUSTOMER_ID=demo-founder
PAID_ORDER_ID=
```

Notes:
- If `PAID_ENABLED` is not truthy, sync is skipped.
- If enabled but `PAID_API_KEY` is missing, sync is skipped with an explicit error status.
- Endpoint path is always `/v1/signals`; base URL is configurable.

## Payload Shape (High Level)

Each signal contains:
- `signal_key`, `signal_timestamp`
- Optional metadata: `product_id`, `customer_id`, `order_id`
- `data` including:
  - run identifiers (`run_id`, `mode`)
  - quality/latency (`overall_score`, `latency_ms`, `fallback_used`)
  - economics (`estimated_cost_usd`, `estimated_value_usd`, `money_saved_vs_coach_usd`, `roi_multiple`, `time_saved_minutes`)

## Reliability + Failure Behavior

- Requests timeout after 2 seconds and retry up to 1 additional time on network errors, `429`, or `5xx`.
- Paid sync is non-blocking for run completion.
- Sync result is persisted into `analysis.meta.economics.paid_sync` with:
  - `status: sent | skipped | failed`
  - `sent_at`
  - optional `error`
