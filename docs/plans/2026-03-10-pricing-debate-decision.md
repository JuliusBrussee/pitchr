# Pricing Model Debate Decision (2026-03-10)

## Goal
Decide whether to keep the current pricing path or move to a stronger annual-commitment model, while fitting **Pitchr’s founder/pitch-prep market**:
- Founders buy for bursty, high-stakes events (pitch practice weeks, demo day, investor meetings)
- Recurring revenue is needed for business sustainability
- Pricing must stay simple enough to avoid friction and abandonment

## Inputs
Primary reference docs used:
- `.\planning\integrations\BILLING_STRIPE.md` (implemented billing foundation)
- `.\planning\julius\2026-02-25-pricing-strategy-day-passes.md` (strategy + market/cost analysis)
- `.\planning\julius\2026-03-03-credit-system-pricing-research.md` (pricing experiments and credit design)

## Debriefing of the 3 Subagents

### Analyst A (Market/Customer Lens)
**Thesis:** A fully committed annual-paywall is a bad fit for the typical founder use pattern.

- Founders are often episodic buyers. They do not want long contracts when they only need help for a short pre-pitch window.
- The current **Day Pass** is a strong acquisition instrument for high-intent urgency moments.
- A pure annual commitment would likely reduce trial-to-paid conversion and shift too much of the funnel toward abandonment.
- Free → Day Pass → Pro remains the most behaviorally aligned flow, with annual as an **optional power-user path**, not a gate.

**Critique of Day-Pass-only:**  
It likely increases spikes and CAC efficiency, but it creates noisy cashflow and weak LTV.

### Analyst B (Quant/Unit Economics Lens)
**Thesis:** Keep the economics simple and defendable; force only what the unit economics and observed behavior justify.

- Internal cost work already shows per-run economics around roughly `$0.05-0.15` all-in at realistic usage.  
  That gives room for healthy margins at current price points.
- Forced annual minimum at low credit allowance increases upfront cash but risks low conversion and high acquisition drag, which can wipe out the upside in a founder-facing market.
- Better formula is:
  - maximize recurring base with predictable monthly/yearly revenue,
  - monetize one-off spikes through Day Pass or small top-ups.
- A hybrid model increases LTV more safely than changing everything to annual commitment.

**Critique of over-commitment plan:**  
If annual contract is mandatory, projected conversion efficiency can fall faster than the cash gain from higher ticket size.

### Analyst C (Pricing/Trend/Strategy Lens)
**Thesis:** The best architecture is a **hybrid with three clear intents**.

- `Day Pass` = urgent spike conversion
- `Monthly Pro` = recurring cash engine
- `Annual Pro` = anti-churn anchor for active teams

**Critique of strict annual-first:**  
- Good for predictability and ticket size, but misaligned with “one-week runway” founder behavior.
- Good pricing should preserve optionality: users who are not ready for annual commitment should still enter with low-friction options.

## Final agreed model (consensus)

### Keep this structure, do not force annual commitment
1. **Free**
   - 3 runs / month, basic feature set
2. **Day Pass (one-off)**
   - `$9` one-time, `24h` + usage bundle
   - 15 runs / 5 decks / 5 Q&A (or existing feature-equivalent)
3. **Pro Monthly**
   - `$29` per month
   - Existing feature set and usage caps as implemented
4. **Pro Annual**
   - `$290` per year (or `$300` as a rounded discount variant if product communication prefers)
   - Same entitlement as monthly; positioned as discount and stability option
5. **Credit Top-ups (optional, for both Day Pass and Pro users)**
   - Small top-up packs for extra usage
   - Keep pricing simple and easy to reason about

### Credit mechanics
- Do **not** reduce core Pro baseline to only 10–15 credits/month.
- Use **credits as a secondary add-on layer**, not the core value metric for base plans.
- Keep base plans with clear caps first.
- Top-ups and carry-forward:
  - Offer limited carry-forward to reduce user anxiety and perceived rigidity.
  - Cap rollover at a small amount (example: max 5 credits on monthly plans) to avoid abuse and liability.

### Anti-churn safeguards
- Optional annual with discount as a stronger default upgrade nudge from monthly.
- Post-upgrade journey: usage reminders at 70%/90% quota and one-click top-up.
- Add pass-to-Pro upgrade prompts at first usage gate hit.
- Auto-grace for renewal: communicate one to two days before renewal period closes.

## Why this is a better fit for our market
- It respects burst behavior (founder reality: high-intent, short windows).
- It protects predictable recurring revenue (annual + monthly plans).
- It preserves conversion for low-commitment users (Day Pass).
- It avoids the biggest downside of annual lock-ins: excluding people who need immediate value but not long commitments.

## Implementation outline

### 1) Product/Business layer (documentation + rollout)
- Update pricing page messaging:
  - “Get started with Day Pass” CTA for urgency.
  - “Go monthly, upgrade annual” as recurring ladder.
- Keep Day Pass visible in pricing cards and upgrade flows.

### 2) Configuration (`config/billing.ts`)
- Keep source-of-truth in config, including:
  - Plan IDs and Stripe price IDs
  - Credit definitions (if top-up packs are added)
  - Daily/monthly usage limits and any rollover caps

### 3) API / usage logic
- In usage-limit checks:
  - Day Pass path first (when active)
  - Then subscription logic
  - Then paid top-up credits
- Ensure top-up consumption happens only when the base bucket is exhausted.

### 4) DB schema updates (if top-up credits are first-class)
- Add/extend usage ledgers to track top-up purchase and consumption.
- Store optional rollover balance with hard cap and expiry timestamp.

### 5) Frontend upgrade UX
- Add:
  - “Credit top-up” modal/button
  - “Usage near cap” prompt
  - Annual switch explanation with discount and value framing
- Keep copy simple and action-oriented (avoid credit math unless user is in top-up path).

## Metrics to validate (3-week pilot)
Track A/B between:
- Control: current current plan set
- Variant: same + annual discount + capped rollover + top-ups

Decision thresholds:
- +20% Day Pass → Pro conversion
- Pro annual take rate at least `8-12%` within 30 days of signup
- Churn on Pro down vs baseline after 60/90 days
- No significant increase in support tickets around billing/credits

## Decision summary
We should **not** adopt the strict annual commitment plan as the main path.

The recommended decision is a **hybrid ladder**:
- Day Pass for spikes,
- Monthly Pro for recurring users,
- Annual Pro as optional discount commitment,
- Optional small top-up packs with capped rollover.

This preserves conversion, raises predictability where users are ready, and matches the high-stakes but bursty economics of pitch preparation.
