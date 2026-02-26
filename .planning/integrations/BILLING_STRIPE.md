# Billing & Stripe Integration

## Plans & Pricing

| Plan | Price | Period | Runs | Decks | QA Sessions | Deck Gen | Section Feedback |
|------|-------|--------|------|-------|-------------|----------|------------------|
| **Free** | $0 | Monthly | 3 | 1 | 1 | No | No |
| **Day Pass** | $9 | 24 hours | 15 | 5 | 5 | Yes | Yes |
| **Pro** | $29/mo or $290/yr | Monthly | 50 | 20 | 30 | Yes | Yes |

- Day Pass is a one-time Stripe payment, not a subscription
- Day Pass expires after 24 hours **or** when all resource limits are exhausted (whichever comes first)
- Day Pass takes priority over subscription limits when active
- No free trial (`TRIAL_PERIOD_DAYS = 0`)
- 48-hour grace period after subscription expiry before downgrading to Free

**Single source of truth:** `config/billing.ts` — all limits, pricing, and Stripe Price IDs live here.

## Architecture

```
Client (useBilling hook)
  |
  v
API Routes (app/api/billing/*)
  |
  v
billingService.ts ──> stripeService.ts ──> Stripe API
  |
  v
Supabase (subscriptions, usage_events, billing_events, day_passes)
```

Rate limiting is enforced in **two places**:
1. **Next.js API routes** — via `billingService.checkUsageLimit()` (full logic, day pass aware)
2. **Supabase Edge Functions** — via `_shared/billing-service.ts` (lightweight duplicate, also day pass aware)

Both must stay in sync. If you change limits in `config/billing.ts`, also update `supabase/functions/_shared/billing-service.ts`.

## API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/billing/checkout` | POST | Yes | Create Stripe Checkout Session for Pro subscription |
| `/api/billing/day-pass` | POST | Yes | Create Stripe one-time payment for Day Pass |
| `/api/billing/day-pass` | GET | Yes | Get active Day Pass status |
| `/api/billing/subscription` | GET | Yes | Get subscription + usage + day pass info |
| `/api/billing/usage` | GET | Yes | Check usage for a specific resource |
| `/api/billing/portal` | POST | Yes | Open Stripe Billing Portal for managing subscription |
| `/api/billing/webhook` | POST | No* | Stripe webhook endpoint (signature-verified) |

*Webhook uses Stripe signature verification instead of user auth.

## Stripe Setup

### 1. Create Products & Prices in Stripe Dashboard

Create three products:

- **Day Pass** — One-time price of $9.00 USD
- **Pro Monthly** — Recurring price of $29.00 USD / month
- **Pro Yearly** — Recurring price of $290.00 USD / year

Copy the Price IDs (e.g., `price_1ABC...`) into your `.env.local`:

```env
STRIPE_DAY_PASS_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
```

### 2. Set API Keys

```env
STRIPE_SECRET_KEY=sk_test_xxx        # or sk_live_xxx for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### 3. Configure Webhook

Create a webhook endpoint in Stripe Dashboard pointing to:

```
https://your-domain.com/api/billing/webhook
```

Listen for these events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Copy the webhook signing secret:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**For local development**, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

### 4. Enable Billing Portal

In Stripe Dashboard > Settings > Billing > Customer Portal:
- Enable "Cancel subscription"
- Enable "Switch plans" (if offering plan changes)
- Set a return URL (the portal route handles this dynamically)

## Database Tables

All tables are created by migrations 18-21. Run them in order via Supabase SQL Editor.

### `subscriptions`

One row per user. Tracks their current plan and Stripe IDs.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | Unique, FK to auth.users |
| `plan_id` | text | `free`, `day_pass`, or `pro` |
| `status` | text | `active`, `trialing`, `past_due`, `canceled`, etc. |
| `stripe_customer_id` | text | Stripe Customer ID |
| `stripe_subscription_id` | text | Null for free/day_pass |
| `stripe_price_id` | text | Null for free |
| `current_period_start` | timestamptz | Billing period start |
| `current_period_end` | timestamptz | Billing period end |
| `cancel_at_period_end` | boolean | Whether cancellation is pending |

### `usage_events`

One row per resource consumption (run, deck, qa_session). Used for counting usage within a billing period.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to auth.users |
| `resource` | text | `run`, `deck`, or `qa_session` |
| `period_start` | timestamptz | From subscription or calendar month |
| `period_end` | timestamptz | From subscription or calendar month |
| `created_at` | timestamptz | When the event was recorded |

### `billing_events`

Stripe webhook idempotency. Prevents double-processing of events.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `stripe_event_id` | text | Unique — Stripe event ID |
| `event_type` | text | e.g. `checkout.session.completed` |
| `payload` | jsonb | Full event data for debugging |
| `created_at` | timestamptz | When processed |

### `day_passes`

Tracks 24-hour access passes with per-resource usage counters.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to auth.users |
| `purchased_at` | timestamptz | When purchased |
| `expires_at` | timestamptz | `purchased_at` + 24 hours |
| `runs_used` / `runs_limit` | int | Usage tracking per resource |
| `decks_used` / `decks_limit` | int | |
| `qa_sessions_used` / `qa_sessions_limit` | int | |
| `stripe_payment_intent_id` | text | For refunds/disputes |
| `status` | text | `active`, `expired`, or `exhausted` |

## Rate Limiting Flow

```
User action (e.g. start pitch run)
  |
  v
Is dev user? (BILLING_DEV_USER_IDS) ──yes──> Allow, skip counting
  |
  no
  v
Has active Day Pass? ──yes──> Check day pass limits
  |                              |
  no                             allowed? ──yes──> Allow + record
  |                              |
  v                              no (exhausted)
Check subscription limits         |
  |                              v
  v                            Fall through to subscription
allowed? ──yes──> Allow + record usage_event
  |
  no
  v
Return 429 with usage info
```

## Dev Bypass

Set `BILLING_DEV_USER_IDS` in `.env.local` with comma-separated Supabase user IDs:

```env
BILLING_DEV_USER_IDS=uuid-1,uuid-2
```

These users get unlimited usage and all features unlocked. Used for development and demo accounts.

## UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `PlanCard` | `views/components/billing/PlanCard.tsx` | Displays plan details with upgrade CTA |
| `UsageBar` | `views/components/billing/UsageBar.tsx` | Visual progress bar for resource usage |
| `SubscriptionBadge` | `views/components/billing/SubscriptionBadge.tsx` | Badge showing current plan status |
| `LandingPricing` | Landing page | Public pricing comparison table |

The `useBilling()` hook provides all billing state:
- `subscription` — plan, status, period
- `usage` — runs/decks/QA used vs limits
- `limits` — full plan limits object
- `dayPass` — active day pass info (id, expiresAt, runsUsed, runsLimit) or null
- `startCheckout(planId, interval)` — initiate Stripe Checkout
- `openPortal()` — open Stripe Billing Portal
- `checkUsage(resource)` — check if a specific action is allowed

## Webhook Flow

```
Stripe event
  |
  v
POST /api/billing/webhook
  |
  v
Verify signature (constructWebhookEvent)
  |
  v
Check idempotency (billing_events table)
  |
  v
Route by event type:
  checkout.session.completed ──> Log (sub events handle upsert) OR activate Day Pass
  subscription.created/updated ──> Upsert subscription row
  subscription.deleted ──> Downgrade to free
  invoice.payment_failed ──> Mark subscription past_due
  |
  v
Record billing_event for idempotency
```

## Changing Plans or Limits

1. Edit `config/billing.ts` — this is the single source of truth
2. Update `supabase/functions/_shared/billing-service.ts` — the edge function duplicate
3. If adding a new plan: add type to `types/billing.ts`, add migration if new DB columns needed
4. If changing Stripe prices: create new Price in Stripe Dashboard, update env vars
