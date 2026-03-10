# Pricing Debate Decision — 2026-03-10

## Scope

This document records the outcome of a three-subagent debate on your proposed annual-credit model and defines the final pricing strategy and implementation plan for Pitchr.

- Agents: `Lovelace` (Market/Customer context), `Sartre` (Quant/financial lens), `Halley` (Pricing and trend lens)
- Trigger: decision over:
  - (A) keep current structure (Free + Day Pass + Pro), versus
  - (B) force annual commitment with low credits and top-ups, versus
  - (C) optional annual commitment with credit support.
- Context sources used:
  - `planning/integrations/BILLING_STRIPE.md`
  - `planning/julius/2026-02-25-pricing-strategy-day-passes.md`
  - `planning/julius/2026-03-03-credit-system-pricing-research.md`

---

## Subagent Positions (and mutual critiques)

### 1) Analyst A — Market/Customer Lens

**Position**
- Founders and early-stage teams usually consume Pitchr in **bursty windows** (demo days, investor meetings, pitch competitions).
- A forced annual commitment at low base credits is likely to reduce trial-to-paid conversion because users often need immediate value, not contract commitment.
- Day Pass (`€9` one-off access window) is a strong on-ramp for high-intent, high-anxiety users.
- Keep yearly commitment **optional**, not default.

**Critique to others**
- Rejects the idea that higher minimum ticket size automatically improves quality; for pitch prep, **fit-to-intent** matters more than commitment length.
- Warns that mandatory yearly lock-in risks users abandoning before trying premium features.

### 2) Analyst B — Quant/Financial Lens

**Position**
- Unit economics in repo analysis are healthy: realistic per-run cost is far lower than earlier conservative placeholders.
- Forcing annual paywalls with low credits can improve upfront cash per converted user but risks lowering conversion enough to hurt top-line.
- Best risk-adjusted shape is a **hybrid**: recurring plans for steady users plus Day Pass for spikes.

**Critique to others**
- Notes that annual commitments without clear optionality can produce a false-positive short-term revenue uplift while reducing funnel throughput.
- Cautions that "big ticket size" must be evaluated on net margin and conversion funnel, not gross ticket alone.

### 3) Analyst C — Pricing/Trend/Strategy Lens

**Position**
- Best long-term SaaS architecture: `Free + Day Pass + Monthly Pro + Optional Annual Pro`.
- Optional annual discount is valuable for predictability but should not block low-friction entry.
- Credits should be an **add-on mechanism** (top-ups/overage), not a replacement for clear subscription tiers.

**Critique to others**
- Supports option B only if annual is optional and optional top-up pack exists.
- Argues complexity control is critical: too many credit rules reduce conversion confidence.

---

## Debate Outcome (Final Decision)

### Decision: Hybrid, not forced annual commitment

We will **not** adopt the proposed “mandatory 12-month commitment with 10–15 base credits” as the primary pricing design.

We adopt:

1. Keep the existing funnel as base:
   - `Free` (acquisition)
   - `Day Pass €9 one-time` (urgent burst conversion)
   - `Pro Monthly €29/mo`
2. Add/optimize `Pro Annual` as **optional** discount path:
   - `€290/yr` (or `€300/yr` if legal/commercial preference; keep explicit framing as “save vs monthly”)
3. Add **small credit top-up packs** as a secondary layer:
   - For Day Pass/Pro overage, optional and simple; no feature complexity.
4. Optional micro-carry-forward only:
   - capped and bounded (anti-abuse, minimal complexity), e.g. `max 5` pro credits rollover.

This maximizes conversion safety for burst users, preserves recurring economics for active users, and raises predictability via annual upgrades without gatekeeping the top-of-funnel.

---

## Why this is the best fit for our exact market

- **Behavioral fit:** pitch users buy in moments, not smoothly recurring loops.
- **Business durability:** recurring base still exists through monthly/annual Pro.
- **Ticket size improvement:** annual option increases committed value where user intent is proven.
- **Choice architecture:** no binary lock-out for low-commitment users.
- **Cash control:** annual plans improve forecasting, while Day Pass supplies short-term liquidity spikes.

---

## Proposed Pricing Structure (Recommended V1)

Use current pricing language and only evolve where necessary.

### Core plans

| Plan | Price | Access | Included usage |
|---|---:|---|---|
| Free | `€0/mo` | Basic analysis only | 3 runs, 1 deck, 1 QA |
| Day Pass | `€9` one-time | Full Pro features | 15 runs, 5 decks, 5 QA, 24h or exhaustion |
| Pro Monthly | `€29/mo` | Full Pro | 50 runs, 20 decks, 30 QA, history + priority |
| Pro Annual | `€290/yr` (or `€300/yr` preferred label) | Full Pro | Same entitlement as monthly |

### Credit top-up layer (secondary)

Offer simple optional top-ups to reduce quota failure friction:

- Starter: 5 credits for `€4.99`
- Sprint: 15 credits for `€12.00`
- Marathon: 30 credits for `€20.00`

`1 credit = 1 core action` for consumption logic (runs, deck upload analysis, QA session). Keep deck generation explicitly charged at the same or 2-credit pricing depending on product decision; if included in core action, keep 1 for simplicity initially.

### Carry-forward policy

- Cap rollover to prevent debt accumulation and leakage:
  - Pro monthly rollover: max `5` unused credits/month carried into next cycle (optional).
  - Annual plans: no monthly rollover needed (annual quota handles it), but a small temporary top-up carry window (`≤10` credits for 14 days) can be considered later.

---

## Implementation Plan (Engineering + Product)

### A. Billing/config changes

1. Keep `config/billing.ts` as source of truth.
2. Ensure plans in config include:
   - Free, Day Pass, Pro Monthly, Pro Annual, Top-up packs.
3. Add explicit credit entities:
   - `CreditPackId`, `creditPrice`, `creditAmount`, `validityDays`, `maxCarryover`.
4. Keep Stripe Price IDs per plan/pack in env:
   - `STRIPE_DAY_PASS_PRICE_ID`
   - `STRIPE_PRO_MONTHLY_PRICE_ID`
   - `STRIPE_PRO_YEARLY_PRICE_ID`
   - `STRIPE_CREDIT_PACK_*` IDs if top-ups are implemented in Stripe Checkout/Payment links.

### B. API / usage enforcement

Order of usage consumption should stay simple:

1. Dev bypass (`BILLING_DEV_USER_IDS`) still allowed.
2. If user has active Day Pass: consume Day Pass bucket.
3. Else if user has active Pro subscription: consume plan bucket.
4. Else if user has paid credit top-up: consume top-up bucket.
5. Else deny with detailed 429 payload containing current remaining + upgrade options.

Record all consumption in ledger table to keep billing and analytics auditable.

### C. Data model updates (if top-up becomes first-class)

- Add/update tables for paid credits:
  - `credit_purchases` (user_id, pack_id, amount, remaining, expires_at, source, created_at)
  - `credit_events` (user_id, resource, consumed, source_ref, created_at)
- Keep existing usage tracking for plan/daily pass logic intact.
- Add rollover columns with hard caps only when feature launched.

### D. Frontend/pricing UX

- Pricing page should read:
  - “Day Pass for urgent prep” (primary, low-friction CTA)
  - “Go monthly” (standard recurring option)
  - “Save with annual” (secondary, value framing)
- On quota exhaustion:
  - show clear next best upgrade path:
    - Upgrade plan
    - Buy top-up credits
    - Switch to annual
- Add usage meter with states at 70% and 90% remaining.

### E. Operations and pricing hygiene

- Keep naming and behavior consistent:
  - avoid silent rule drift between API usage logic and UI messaging
  - ensure `merge-conflict-log` is appended for any billing model conflicts.

---

## Reoccurring Users and Payments: How this model helps

- **Reoccurring users:** guided naturally into Pro Monthly and annual.
- **One-off high urgency users:** captured by Day Pass with no subscription friction.
- **LTV/Lifecycle:** Annual path increases committed value for users with demonstrated repeated usage.
- **Cash flow stability:** more than one revenue shape without sacrificing top-of-funnel conversion.

---

## Pilot and Decision Gates (first 4–6 weeks)

Run A/B pilot: current plan + top-up flow + optional annual discount emphasis.

### Success gates

- Day Pass → Pro Monthly conversion uplift: **+15–25%**
- Annual conversion rate (from active monthly cohort): **8–12% within 30 days**
- No increase in billing support tickets above baseline after rollout
- Churn deltas: non-negative monthly/quarterly trend after month 2
- Revenue mix target (steady-state):
  - Pro recurring ≥ 60–70% of gross revenue
  - Day Pass/top-up remaining as spike layer, not base layer

If gates fail, keep annual optional but pause any further reduction in free/day-pass friction.

---

## Decision Statement

We should implement a **hybrid ladder model** with:

- free funnel,
- Day Pass for urgent burst demand,
- monthly subscription for active users,
- optional annual subscription for commitment-ready users,
- and bounded credit top-ups as an optional, low-complexity overage mechanism.

This matches the behavior of our market (founders with bursty but repeatable pain points), increases ticket size where evidence supports it, and preserves conversion safety.
