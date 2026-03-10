# Pricing Model Debate Decision (Subagent Consensus)

**Date:** 2026-03-10  
**Context:** Evaluate the proposed 12-month commitment vs annual discount idea for Pitchr pricing using repo research, existing billing model, and user behavior assumptions.  
**Relevant references:**  
-.planning/integrations/BILLING_STRIPE.md  
-.planning/julius/2026-02-25-pricing-strategy-day-passes.md  
-.planning/julius/2026-03-03-credit-system-pricing-research.md

## Debated Proposal in Question

**User idea summary**
- Option A: Keep subscription-style commitment (`30 €/month` equivalent) with low monthly credits (`10-15`), add-on top-up (`10 €` for `5` credits), and long commitment framing.
- Option B: Charge annual upfront (`300-320 €`) instead, with similar credit mechanics and possible limited rollover.

## Subagent Roundtable (3 independent opinions)

### Analyst A — Market/Customer Context
- Finds the model **promising in principle** because founders are in a bursty, high-stakes decision flow and like clear "one-shot readiness" purchasing.
- Critiques the 12-month commitment as the default plan because:
  - Founder usage is event-driven (demo day/week before meetings).
  - Many users only need intense usage in a short window.
  - Forcing time commitment introduces avoidable friction versus day-pass-first conversion.
- Recommends preserving a **low-friction entry** (Free + Day Pass) and treating annual commitment as **optional**.
- Strongly argues for optional, not mandatory, annual products.

### Analyst B — Quant/Unit-Economics Lens
- Uses repo cost work showing model run costs around `~$0.08-$0.15` per run (before margin assumptions), which supports high gross margin and room for packaging tweaks.
- Notes that annual bundles increase cash upfront only if conversion drop is controlled.  
- Points out a known risk: if default annual commitment reduces new paid conversion materially, it can hurt near-term growth despite higher ticket size.
- Concludes the **risk-adjusted option** is:
  - Keep current recurring base with clear annual discount.
  - Add credit purchases/overages for bursty users.
  - Avoid hard commitment on landing flow.

### Analyst C — Pricing/Research Strategy Lens
- Validates from strategy docs that founder pitch behavior matches mixed monetization:
  - Urgent users convert on day-level urgency.
  - Ongoing campaign users need recurring certainty.
- Evaluates Team plan context:
  - Team plan can remain as a later expansion if onboarding of startup programs/accelerators increases.
  - Pushing forced 1-year low-credit plans now would likely confuse positioning (`Day Pass`, `Pro`, `Annual`) and raise support overhead.
- Recommendation: Keep a **dual path**:
  1) immediate-use path  
  2) recurring path with optional annual commitment discount.

## Cross-Critique (the debate’s conflict points)

1. **Analyst A** says forcing commitment harms conversion; **Analyst B** warns this mainly matters only if conversion decay is material, but the startup market is likely sensitive enough that it is material.
2. **Analyst B** says annual can protect against low retention; **Analyst C** counters that retention risk should be managed by campaign-based packaging, not by coercive contract lock.
3. **Analyst C** wants clean positioning; **Analyst A** warns burst users need urgent purchase simplicity.  
   => Both agree Day Pass should remain prominent and annual should be optional.

## Final Settlement (Mediator Decision)

**Recommendation:**  
Do **not** adopt a forced 12-month commitment with low included credits as the default.  
Adopt a **hybrid model**:
- Keep Free + Day Pass + Pro Monthly as-is for acquisition conversion.
- Keep/offer Pro Annual as a **discounted, optional** commitment.
- Add a bounded credit/overage layer to support burst behavior without hurting default conversion.

## Final Pricing Model (proposed to implement)

### 1) Free
- Keep current limits.

### 2) Day Pass (impulse/urgent path)
- Keep current `9 €` one-time 24-hour full-feature access with clear caps.

### 3) Pro Monthly
- Keep current `29 €/month`.

### 4) Pro Annual (new framing)
- Offer `300 €/year` (or `290 €/year` if we keep exact Stripe existing economics).
- Includes the same feature and resource entitlement as monthly Pro, prorated annually.
- Keep this as **commitment by choice**, not by default onboarding requirement.

### 5) Overage / credit layer (soft + low-friction)
- Add optional credit top-up packs for both Day Pass and Annual users who exceed monthly limits (for example: pack equivalent to `5 credits = 10 €`, as your idea suggests).
- Allow small **carry-forward cap** only for overage/unused credits (for example max `5` credits) to limit bookkeeping complexity and abuse.
- Prefer feature-gated conversion path over pure tokenization (do not make every action fractional).

## Why this model is best for this market

- Aligns with founder behavior:
  - Burst users still get an immediate, low-friction path.
  - Campaign users can commit for a full year with discount and stable costs.
- Preserves margin upside:
  - Keeps high recurring potential while retaining pass-to-subscription conversion paths.
- Reduces implementation risk:
  - No major disruption to existing plans or code logic.
  - Easier to A/B test against current state.

## Implementation Notes (for code + ops)

- Billing config:
  - Keep single source in `config/billing.ts`.
  - Add/align `pro_annual` as explicit tier with credit carry/expiry policy.
- Stripe:
  - Ensure pricing IDs for day pass, pro monthly, pro annual updated in `.env.local`.
- Edge / API:
  - Enforce `checkUsageLimit()` logic for monthly and yearly contexts.
  - Add overage credit checks before rejecting usage.
- UX:
  - Add conversion prompts at cap:
    - Day Pass exhausted → upgrade to Annual with discount rationale (`you already used X units`).
    - Monthly approaching cap → suggest Annual or top-up credits.
- Metrics:
  - Track conversion from Day Pass to Annual/Monthly.
  - Track annual conversion and upgrade downgrades after 14 and 30 days.
  - Track usage beyond cap and top-up conversion rate.

## Decision Rules to Validate After Launch (30 days)

1) If annual upsell conversion from cap-exhausted users is below `12%`, reduce credit constraints and simplify message.
2) If day-pass-to-paid conversion drops after any annual changes, remove any mention of time commitment in landing copy.
3) If annual churn after first renewal exceeds current monthly churn assumptions, test a `quarterly` alternative before scaling annual lock emphasis.
4) Keep a fallback to current model if conversion quality deteriorates > `15%` week-over-week in the first `4` weeks.

## Outcome

This settlement keeps your high-margin business model intact, improves user fit for a founder/pitch-prep market, and maximizes stable recurring revenue without over-committing users into a contract they may not want.
