# Credit System Pricing Research: Replacing Day Passes with Credits

**Date:** 2026-03-03
**Status:** Research & Proposal
**Context:** Evaluating whether a credit-based model can replace or complement the current Day Pass ($9/24h) system for better revenue, user experience, and margin retention.

---

## Table of Contents

1. [Current State Recap](#1-current-state-recap)
2. [Why Consider Credits Over Day Passes?](#2-why-consider-credits-over-day-passes)
3. [Industry Landscape: How AI SaaS Does Credits](#3-industry-landscape-how-ai-saas-does-credits)
4. [Pitchr Cost Model (Ground Truth)](#4-pitchr-cost-model-ground-truth)
5. [Proposed Credit System Design](#5-proposed-credit-system-design)
6. [Pricing Tiers & Credit Packs](#6-pricing-tiers--credit-packs)
7. [Margin Analysis](#7-margin-analysis)
8. [Pros vs. Cons: Credits vs. Day Pass](#8-pros-vs-cons-credits-vs-day-pass)
9. [Hybrid Model (Recommended)](#9-hybrid-model-recommended)
10. [Credit Policies & Edge Cases](#10-credit-policies--edge-cases)
11. [Revenue Projections](#11-revenue-projections)
12. [Migration Path](#12-migration-path)
13. [Implementation Scope](#13-implementation-scope)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Decision Framework](#15-decision-framework)

---

## 1. Current State Recap

### Current Plans

| Plan | Price | Period | Runs | Decks | Q&A | Margin |
|------|-------|--------|------|-------|-----|--------|
| **Free** | $0 | Monthly | 3 | 1 | 2 min | N/A (funnel) |
| **Day Pass** | $9 | 24 hours | 15 | 5 | 10 min | ~89% |
| **Pro** | $29/mo ($290/yr) | Monthly | 50 | 20 | 60 min | ~95% |

### What Works Well
- **Pro subscription** — excellent margins (85-95%), well-positioned at $29/mo vs. human coaches ($200+/hr)
- **Free tier** — solid acquisition funnel at negligible cost ($0.27/mo)
- **Day Pass** — captures bursty "pitch panic" usage

### Day Pass Pain Points
- **Time pressure anxiety:** Users feel rushed to use their 24 hours, even if they only need 5 runs
- **Wasted value:** If a user buys at 8pm and sleeps 8 hours, 33% of their window is wasted
- **No accumulation:** Can't save unused runs for later; it's all-or-nothing
- **Repeat purchases:** Founders preparing over multiple days must buy multiple passes ($9 x 3 days = $27 — nearly Pro price for fewer runs)
- **Poor conversion path:** Day pass doesn't naturally lead users toward Pro because the mental model is completely different (time-based vs. subscription)

---

## 2. Why Consider Credits Over Day Passes?

### The Core Insight

Pitchr's usage pattern is **action-based, not time-based.** Users care about "I need to analyze my pitch 8 times before Demo Day" — not "I need 24 hours of access." Credits align the payment model with the actual value unit.

### What Credits Solve

| Day Pass Problem | Credit Solution |
|-----------------|----------------|
| Time pressure (24h window) | Use credits whenever you want — no expiration pressure |
| Wasted overnight hours | Credits only consumed when used |
| Multi-day prep = multiple purchases | Buy once, use across prep sessions |
| Binary access (all features or none) | Graduated access with different credit costs per feature |
| Weak upsell path to Pro | Natural upsell: "You're buying credits often — Pro would save you 40%" |
| No way to "try one more" | Users can top up exactly what they need |

### Industry Momentum

Credit-based pricing grew **126% YoY** in 2025 across the SaaS index (PricingSaaS 500). 79 companies now use credit models, up from 35 in 2024. Adopters include Figma, HubSpot, Salesforce, ElevenLabs, Runway ML, and most AI-native startups.

---

## 3. Industry Landscape: How AI SaaS Does Credits

### Comparable Credit Models

| Product | Credit Unit | Free Tier | Entry Paid | Top Tier | Rollover |
|---------|-------------|-----------|------------|----------|----------|
| **ElevenLabs** | Characters | 10K/mo | $5/mo (30K) | $99/mo (500K) | 2 months |
| **Runway ML** | Seconds of video | 125 one-time | $12/mo (625) | $76/mo (2,250) | No |
| **Midjourney** | GPU hours | None | $10/mo (3.3h) | $60/mo (30h) | No |
| **Jasper AI** | Words | Limited | $49/mo | $125/mo | No |
| **Copy.ai** | Words/workflows | 2K words/mo | $49/mo | Custom | No |
| **Descript** | Transcription min | 1hr | $24/mo (10h) | $33/mo (30h) | No |

### Key Patterns Observed

1. **Credits bundle into subscriptions** — Nearly all use hybrid (base sub + credit allotment), not pure pay-per-credit
2. **Free tier includes credits** — Lets users experience credit consumption mechanics
3. **Overage is purchasable** — Top-up packs available when monthly allotment runs out
4. **Feature gating still exists** — Credits handle volume; plan tier handles feature access
5. **Annual discounts are standard** — ~20% savings on annual plans

### How Credits Typically Work

Most AI SaaS follows this pattern:

```
Subscription Tier → Monthly Credit Allotment → Credits Consumed Per Action → Top-Up Available
```

Credits are **not** a replacement for subscriptions — they're **the currency within subscriptions.**

---

## 4. Pitchr Cost Model (Ground Truth)

### Per-Action Costs (Measured from Codebase)

| Action | Input Tokens | Output Tokens | LLM Cost | Infra | **Total Cost** |
|--------|-------------|---------------|----------|-------|----------------|
| **Pitch Analysis (Free - judge only)** | ~3,000 | ~2,500 | $0.047 | $0.02 | **$0.07** |
| **Pitch Analysis (Pro - judge + section)** | ~5,500 | ~4,500 | $0.084 | $0.02 | **$0.10** |
| **Pitch Analysis (cached repeat)** | ~500 new | ~2,500 | $0.039 | $0.02 | **$0.06** |
| **Deck Upload + Analysis** | ~4,000 | ~3,000 | $0.060 | $0.03 | **$0.09** |
| **Q&A Session (per minute)** | ~2,000 | ~1,500 | $0.030 | $0.01 | **$0.04** |
| **Deck Generation** | ~3,000 | ~5,000 | $0.084 | $0.02 | **$0.10** |

**Pricing sources (current as of 2026):**
- Claude Sonnet 4.6: $3/MTok input, $15/MTok output
- Prompt caching: 90% reduction on cached prefixes
- Supabase: ~$0.001/query at current scale
- Vercel hosting: ~$0.01-0.02/request

### Cost Optimization Levers

| Optimization | Savings | Availability |
|-------------|---------|--------------|
| Prompt caching (repeat prefixes) | ~40% on LLM | Available now |
| Batch API (non-urgent) | ~50% on LLM | Available now |
| Haiku 4.5 for section agent | ~60% on section analysis | Available now |
| Gemini Flash fallback | ~80% cheaper | Available as fallback |

**Optimized cost floor:** ~$0.04/run with aggressive caching + Haiku for section analysis.

---

## 5. Proposed Credit System Design

### Credit Currency: "Pitch Credits"

One **Pitch Credit** = the abstract unit of value in Pitchr. Different actions cost different amounts of credits.

### Credit Cost Table

| Action | Credits | Why |
|--------|---------|-----|
| **Pitch Analysis (full)** | 1 credit | Core action, anchor unit |
| **Deck Upload + Analysis** | 1 credit | Similar compute to a pitch run |
| **Q&A Session (per session)** | 1 credit | Each interactive Q&A session |
| **Deck Generation** | 2 credits | Heavier compute, higher value output |
| **Re-analysis (same pitch, tweaked)** | 1 credit | Same as new analysis (simplicity) |

**Design principle:** Keep it dead simple. 1 credit = 1 core action. Don't make users do math. Deck generation costs 2 because it's both compute-heavy and high-value (produces a full slide deck).

### Why Not Fractional Credits?

Fractional credits (0.5, 0.25) create confusion and anxiety. ElevenLabs and Runway both suffered from users not understanding consumption rates. Pitchr has a small action surface — keep credits whole-number and intuitive.

### Feature Access vs. Credits

Credits handle **volume.** Plan tier handles **features.**

| Feature | Free | Credit Packs (Starter) | Pro |
|---------|------|----------------------|-----|
| Basic pitch analysis | Yes | Yes | Yes |
| Section-level feedback | No | **Yes** | Yes |
| Vocabulary metrics | No | **Yes** | Yes |
| Historical comparison | No | No | Yes |
| Deck generation | No | **Yes** | Yes |
| Queue priority | Low | Medium | High |

**Key decision:** Credit pack users get most Pro features (section feedback, vocabulary, deck gen) but not historical comparison or highest queue priority. This creates a clear upgrade path to Pro.

---

## 6. Pricing Tiers & Credit Packs

### Proposed Pricing Structure

```
┌──────────────┬───────────────┬───────────────┬───────────────┐
│    Free      │  Credit Packs │     Pro       │   Pro Annual  │
│              │  (à la carte) │               │               │
├──────────────┼───────────────┼───────────────┼───────────────┤
│    $0/mo     │  From $5      │   $29/mo      │   $249/yr     │
│   3 credits  │  one-time     │  60 credits   │  60 credits/mo│
│   Basic only │  use anytime  │  All features │  Save $99/yr  │
│              │               │  Most Popular │               │
└──────────────┴───────────────┴───────────────┴───────────────┘
```

### Credit Pack Options

| Pack | Credits | Price | Per-Credit | Savings vs Base | Target User |
|------|---------|-------|------------|-----------------|-------------|
| **Starter** | 5 | $5 | $1.00 | — | Try before subscribing |
| **Prep** | 15 | $12 | $0.80 | 20% | Single pitch session |
| **Sprint** | 30 | $20 | $0.67 | 33% | Multi-day prep |
| **Marathon** | 60 | $35 | $0.58 | 42% | Extended fundraising |

### Subscription Allotments

| Plan | Monthly Credits | Extra Features | Price |
|------|----------------|----------------|-------|
| **Free** | 3 | Basic analysis only | $0 |
| **Pro Monthly** | 60 | Full feature suite + history + priority | $29/mo |
| **Pro Annual** | 60/mo (720/yr) | Same as Pro Monthly | $249/yr (~$20.75/mo) |

### Why 60 Credits/mo for Pro (up from 50 runs)?

- **Psychological:** 60 feels generous and maps to "2 per day"
- **Mixed usage:** Users now spend credits on runs + decks + Q&A + deck gen, so 60 credits may yield ~40 pitch runs and ~10 decks and ~10 Q&A sessions
- **Competitive:** 60 credits at $29/mo = $0.48/credit in-plan — makes credit packs look expensive and drives subscription conversion

### Overage for Pro Users

Pro subscribers who exhaust their 60 monthly credits can:
1. **Wait for next cycle** (free)
2. **Buy a top-up pack** at the same credit pack rates
3. Top-up credits never expire (separate from monthly allotment)

---

## 7. Margin Analysis

### Per-Credit Economics

| Metric | Value |
|--------|-------|
| Average COGS per credit consumed | $0.10 |
| Optimized COGS (with caching) | $0.06 |
| Credit pack floor price | $0.58/credit (Marathon pack) |
| Credit pack ceiling price | $1.00/credit (Starter pack) |

### Margin by Scenario

| Scenario | Revenue/Credit | COGS/Credit | Gross Margin | Margin % |
|----------|---------------|-------------|-------------|----------|
| **Starter pack (5 for $5)** | $1.00 | $0.10 | $0.90 | **90%** |
| **Prep pack (15 for $12)** | $0.80 | $0.10 | $0.70 | **88%** |
| **Sprint pack (30 for $20)** | $0.67 | $0.10 | $0.57 | **85%** |
| **Marathon pack (60 for $35)** | $0.58 | $0.10 | $0.48 | **83%** |
| **Pro sub (60 credits, $29)** | $0.48 | $0.10 | $0.38 | **79%** |
| **Pro sub (avg 25 used, $29)** | $1.16 | $0.10 | $1.06 | **91%** |
| **Pro Annual (60/mo, ~$20.75)** | $0.35 | $0.10 | $0.25 | **71%** |
| **Pro Annual (avg 25/mo used)** | $0.83 | $0.10 | $0.73 | **88%** |

### After Stripe Fees

| Product | Revenue | Stripe Fee | Net Revenue | COGS | **Net Margin** |
|---------|---------|------------|-------------|------|----------------|
| Starter ($5) | $5.00 | $0.45 (2.9%+$0.30) | $4.55 | $0.50 | **$4.05 (81%)** |
| Prep ($12) | $12.00 | $0.65 | $11.35 | $1.50 | **$9.85 (82%)** |
| Sprint ($20) | $20.00 | $0.88 | $19.12 | $3.00 | **$16.12 (81%)** |
| Marathon ($35) | $35.00 | $1.32 | $33.69 | $6.00 | **$27.69 (79%)** |
| Pro Monthly ($29) | $29.00 | $1.14 | $27.86 | $2.50* | **$25.36 (87%)** |
| Pro Annual ($249) | $249.00 | $7.52 | $241.48 | $30.00* | **$211.48 (85%)** |

*Pro COGS assumes average 25 credits/month used.

### Stripe Fee Impact on Small Transactions

| Amount | Stripe Fee | Fee % | Effective Margin Loss |
|--------|-----------|-------|----------------------|
| $1 | $0.33 | 33% | Unacceptable |
| $3 | $0.39 | 13% | Too high |
| **$5** | $0.45 | **9%** | **Acceptable minimum** |
| $10 | $0.59 | 5.9% | Good |
| $20 | $0.88 | 4.4% | Great |

**Conclusion:** $5 is the minimum viable credit pack price. Below that, Stripe fees erode margins too much.

### Comparison: Credits vs. Day Pass Margins

| Model | Revenue | Avg COGS | Margin % | Notes |
|-------|---------|----------|----------|-------|
| **Day Pass ($9, 15 runs)** | $9 | $1.00 (10 runs avg) | 89% | Time-pressured, may waste |
| **Prep Pack ($12, 15 credits)** | $12 | $1.50 (15 credits used) | 82% | No waste, all credits used |
| **Starter Pack ($5, 5 credits)** | $5 | $0.50 | 81% | Impulse purchase gateway |

Credits have slightly lower margins per-purchase but:
- Higher total revenue per user (buy multiple packs vs. single day pass)
- Better user experience (no time pressure)
- Stronger conversion to Pro (visible credit depletion creates urgency)

---

## 8. Pros vs. Cons: Credits vs. Day Pass

### Credits: Pros

| Advantage | Impact | Evidence |
|-----------|--------|----------|
| **No time pressure** | Users don't feel rushed, leading to better product experience | ElevenLabs and Runway both moved away from time-limited access |
| **Higher LTV per user** | Users buy multiple packs over weeks of prep | Credit packs are naturally repeatable |
| **Natural upsell to Pro** | "You've spent $40 on credits this month — Pro is $29" | Visible spend history creates conversion signals |
| **Granular purchase sizes** | From $5 (impulse) to $35 (committed) | Multiple entry points vs. single $9 day pass |
| **No wasted value** | Users only spend credits when they take action | Day pass wastes hours while sleeping |
| **Transparent value exchange** | 1 credit = 1 analysis. Simple, clear. | Reduces purchase hesitation |
| **Revenue smoothing** | Credits purchased throughout the month vs. spiky day pass revenue | Better cash flow predictability |
| **Referral/bonus mechanics** | "Invite a friend, get 3 free credits" — easy to implement | Credits are a natural reward currency |
| **Industry standard** | 79 SaaS companies use credits (126% growth in 2025) | Users are increasingly familiar with the model |

### Credits: Cons

| Disadvantage | Impact | Mitigation |
|-------------|--------|------------|
| **Consumption anxiety** | Users may hoard credits, reducing engagement | Show clear credit costs before each action; generous monthly allotment |
| **More complex UX** | Credit balance display, purchase flow, usage history | Keep credit costs simple (1 credit = 1 action); build good dashboard |
| **"Nickel and diming" perception** | Some users hate paying per-action | Pro subscription exists for those who want flat-rate |
| **Accounting complexity** | Revenue recognition for unused credits | Credits expire after 12 months (deferred revenue accounting) |
| **Stripe fees on small purchases** | $5 pack loses 9% to fees | $5 minimum pack size; bundle deals |
| **No "unlimited" feeling** | Pro users still have a credit cap (60/mo) | 60 is generous; overage packs available |
| **Migration complexity** | Existing day pass users/code needs migration | Phased rollout; honor existing day passes |

### Day Pass: Pros (What We Lose)

| Day Pass Advantage | Credit Equivalent |
|-------------------|-------------------|
| Simple mental model ("$9 = 24 hours") | "5 credits for $5" is equally simple |
| Captures "pitch panic" impulse buys | Starter pack ($5) captures same impulse at lower friction |
| All-you-can-eat within window | Prep pack (15 credits) covers same volume without time pressure |
| No credit math needed | Credit costs are whole numbers — minimal math |

---

## 9. Hybrid Model (Recommended)

### The Best of Both Worlds

Rather than pure credits OR pure subscriptions, the recommended model is a **subscription + credit hybrid** — the dominant pattern in AI SaaS.

### Final Recommended Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     PITCHR PRICING MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SUBSCRIPTIONS (Recurring)                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Free   │  │  Pro Monthly │  │  Pro Annual  │              │
│  │   $0/mo  │  │   $29/mo     │  │   $249/yr    │              │
│  │ 3 cr/mo  │  │  60 cr/mo    │  │  60 cr/mo    │              │
│  │ Basic    │  │  All features│  │  Save $99/yr │              │
│  └──────────┘  └──────────────┘  └──────────────┘              │
│                                                                 │
│  CREDIT TOP-UPS (One-Time, no expiry*)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Starter  │  │   Prep   │  │  Sprint  │  │ Marathon │       │
│  │ 5 cr/$5  │  │ 15cr/$12 │  │ 30cr/$20 │  │ 60cr/$35 │       │
│  │ $1.00/cr │  │ $0.80/cr │  │ $0.67/cr │  │ $0.58/cr │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  * Top-up credits expire after 12 months of account inactivity │
│                                                                 │
│  CREDIT CONSUMPTION                                             │
│  • Pitch Analysis = 1 credit                                    │
│  • Deck Upload = 1 credit                                       │
│  • Q&A Session = 1 credit                                       │
│  • Deck Generation = 2 credits                                  │
│                                                                 │
│  CREDIT PRIORITY: Monthly allotment consumed first,             │
│  then top-up credits are used. Monthly credits do not roll over.│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Hybrid Works

1. **Subscriptions for committed users** — Pro at $29/mo is the core revenue engine with 85-95% margins
2. **Credit packs for casual/bursty users** — Replace the day pass with more flexibility
3. **Free tier unchanged** — Still 3 credits/month for acquisition
4. **Clear upgrade path:** Free (3 credits) → Buy packs → Realize Pro is better value → Subscribe
5. **No cannibalization:** Pro at $0.48/credit is better value than any pack — heavy users always upgrade

### Consumption Priority Order

```
1. Monthly subscription credits (expire at period end — use-it-or-lose-it)
2. Top-up credits (purchased, never expire unless 12 months inactive)
3. If no credits remain → show upgrade/purchase prompt
```

This ensures subscription credits are consumed first (so monthly feels valuable) and purchased credits are preserved as a safety net.

---

## 10. Credit Policies & Edge Cases

### Expiration

| Credit Type | Expiration | Rationale |
|-------------|-----------|-----------|
| **Monthly allotment (Free/Pro)** | End of billing period | Standard SaaS — drives consistent engagement |
| **Purchased top-up credits** | 12 months of account inactivity | Generous but prevents indefinite liability; ElevenLabs does 2 months which feels stingy |
| **Bonus/referral credits** | 90 days from grant | Creates urgency to use and share |

### Rollover

**Monthly allotment does NOT roll over.** This is standard across ElevenLabs, Runway, Midjourney, and most AI SaaS. Reasons:
- Prevents liability accumulation
- Drives consistent monthly usage
- Makes the "60/month" feel like a fresh allocation, not a growing pool

**Purchased credits DO persist** (with 12-month inactivity expiration). This is the key differentiator from subscriptions — you paid real money for them.

### Failed / Partial Operations

| Scenario | Credit Policy |
|----------|--------------|
| **Analysis fails (LLM error)** | Credit refunded automatically |
| **Analysis fails (user cancels mid-run)** | Credit refunded if no result delivered |
| **Analysis uses fallback (cached sample)** | Credit charged — user still got a result |
| **Deck upload fails (bad file)** | Credit refunded |
| **Q&A session < grace period (10s)** | No credit charged |
| **Q&A session disconnects early** | Credit charged if > grace period |

### Bonus & Referral Credits

| Mechanism | Amount | Expiry | Notes |
|-----------|--------|--------|-------|
| **Sign-up bonus** | +2 credits | 90 days | On top of 3 free monthly credits |
| **Referral (referrer)** | +3 credits | 90 days | When referred user signs up |
| **Referral (referred)** | +2 credits | 90 days | Bonus on first sign-up |
| **Feedback/review bonus** | +1 credit | 90 days | Leave a review on Product Hunt/G2 |
| **Achievement milestone** | +1-3 credits | 90 days | e.g., "Score 80+ on a pitch" |

### Edge Cases

**Q: What if a Pro user has 0 monthly credits left but has purchased top-up credits?**
A: Top-up credits are consumed. All Pro features remain available since they're a Pro subscriber.

**Q: What if a Free user has purchased top-up credits?**
A: Top-up credits are consumed, but they only get Free-tier features (basic analysis, no section feedback). To unlock Pro features, they need to either subscribe to Pro or we can offer a "per-credit Pro feature unlock" (+0.5 credits surcharge for Pro features on Free plan).

**Decision needed:** Should Free users with top-up credits get Pro features per-credit, or should they be limited to Free-tier analysis? **Recommendation: Give them Pro features.** If someone pays for credits, limiting their analysis quality feels punishing. This also creates a better trial experience that drives Pro conversion.

**Q: Can users gift credits?**
A: Not in V1. Consider for V2 — useful for accelerator cohorts.

---

## 11. Revenue Projections

### Assumptions (Conservative)

| Metric | Value | Rationale |
|--------|-------|-----------|
| Monthly active users (Month 1) | 500 | Early launch |
| Free-to-paid conversion | 5% | SaaS average is 2-5% |
| Credit pack average | $15/purchase | Weighted between Starter and Sprint |
| Pack purchases per user per month | 1.5 | Bursty usage pattern |
| Pro conversion from packs | 15% within 3 months | Users who buy 3+ packs realize Pro is better value |
| Pro churn | 8%/month | Early-stage SaaS average |

### Month 6 Revenue Model

| Segment | Users | Revenue/User/Mo | Monthly Revenue |
|---------|-------|----------------|----------------|
| **Free** | 1,800 | $0 | $0 |
| **Credit-only purchasers** | 150 | $15 x 1.5 = $22.50 | $3,375 |
| **Pro Monthly** | 40 | $29 | $1,160 |
| **Pro Annual** | 10 | $20.75 | $208 |
| **Total** | 2,000 | — | **$4,743/mo** |

### Month 12 Revenue Model

| Segment | Users | Revenue/User/Mo | Monthly Revenue |
|---------|-------|----------------|----------------|
| **Free** | 4,000 | $0 | $0 |
| **Credit-only purchasers** | 400 | $22.50 | $9,000 |
| **Pro Monthly** | 120 | $29 | $3,480 |
| **Pro Annual** | 30 | $20.75 | $623 |
| **Total** | 4,550 | — | **$13,103/mo** |

### Credits vs. Day Pass Revenue Comparison (Projected)

| Model | Month 6 | Month 12 | Notes |
|-------|---------|----------|-------|
| **Day Pass model** | ~$3,600 | ~$10,200 | Single $9 price point, lower repeat rate |
| **Credit model** | ~$4,743 | ~$13,103 | Multiple price points, higher repeat rate |
| **Delta** | +$1,143 (+32%) | +$2,903 (+28%) | Credits capture more casual revenue |

### Revenue Upside Drivers

1. **Lower entry friction:** $5 starter pack vs. $9 day pass = more first-time buyers
2. **Higher repeat rate:** Credits don't expire — users come back and buy more when they need them
3. **Upgrade pressure:** Visible credit spend creates natural "just subscribe" moments
4. **Referral loop:** Credit bonuses drive viral acquisition

---

## 12. Migration Path

### Phase 1: Introduce Credit Packs (Alongside Day Pass)

**Timeline:** 2-3 weeks
**Effort:** Medium

- Add credit balance to user accounts (new `credit_balance` field or `credits` table)
- Implement credit consumption tracking
- Add 4 credit pack purchase flows (Stripe one-time payments)
- Credit balance display in dashboard
- Actions deduct credits before checking subscription limits
- **Day Pass remains available** as a legacy option

### Phase 2: Sunset Day Pass, Full Credit Model

**Timeline:** 2-3 weeks after Phase 1
**Effort:** Medium

- Remove Day Pass from pricing page (hide, don't delete)
- Honor existing active day passes until expiration
- Add credit top-up prompts where day pass CTAs existed
- Update Pro subscription to use credit allotment model
- Add overage/top-up flow for Pro users

### Phase 3: Optimize & Expand

**Timeline:** Ongoing
**Effort:** Low

- Add referral credit program
- Add achievement-based credit bonuses
- Implement credit gifting for teams/accelerators
- A/B test credit pack prices
- Add annual credit pre-purchase discount

### Database Migration

```sql
-- New table: credit_balances
CREATE TABLE credit_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  monthly_credits integer NOT NULL DEFAULT 0,
  monthly_credits_limit integer NOT NULL DEFAULT 3,
  purchased_credits integer NOT NULL DEFAULT 0,
  bonus_credits integer NOT NULL DEFAULT 0,
  bonus_credits_expires_at timestamptz,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- New table: credit_transactions (audit log)
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  amount integer NOT NULL,              -- positive = add, negative = consume
  balance_after integer NOT NULL,       -- snapshot after transaction
  credit_type text NOT NULL,            -- 'monthly', 'purchased', 'bonus', 'refund'
  source text NOT NULL,                 -- 'subscription_renewal', 'pack_purchase', 'referral', 'pitch_run', 'deck_upload', etc.
  reference_id text,                    -- Stripe payment ID, run ID, etc.
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- New table: credit_packs (product catalog)
CREATE TABLE credit_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_usd numeric(10,2) NOT NULL,
  stripe_price_id text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_credit_balances_user ON credit_balances(user_id);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(user_id, created_at);
CREATE INDEX idx_credit_packs_active ON credit_packs(active, sort_order);
```

---

## 13. Implementation Scope

### Types Changes (`types/billing.ts`)

```typescript
// Add to BillingPlanId
type BillingPlanId = 'free' | 'pro';  // Remove 'day_pass'

// New types
interface CreditBalance {
  userId: string;
  monthlyCredits: number;
  monthlyCreditsLimit: number;
  purchasedCredits: number;
  bonusCredits: number;
  bonusCreditsExpiresAt: string | null;
  totalAvailable: number;  // computed: monthly + purchased + bonus
  periodStart: string;
  periodEnd: string;
}

interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  creditType: 'monthly' | 'purchased' | 'bonus' | 'refund';
  source: string;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  stripePriceId: string | null;
  active: boolean;
}

// Updated action costs
interface CreditCosts {
  pitchAnalysis: number;   // 1
  deckUpload: number;      // 1
  qaSession: number;       // 1
  deckGeneration: number;  // 2
}
```

### Config Changes (`config/billing.ts`)

- Add `CREDIT_COSTS` constant
- Add `CREDIT_PACKS` constant array
- Update plan definitions with `monthlyCredits` field
- Remove day_pass plan definition (or deprecate)

### Service Changes

- New `creditService.ts`:
  - `getBalance(userId)` — get current credit balance
  - `consumeCredits(userId, amount, source, referenceId)` — atomic deduction
  - `refundCredits(userId, amount, source, referenceId)` — refund on failed action
  - `addPurchasedCredits(userId, amount, stripePaymentId)` — after pack purchase
  - `addBonusCredits(userId, amount, reason, expiresAt)` — referral/achievement
  - `resetMonthlyCredits(userId)` — on subscription renewal
  - `getTransactionHistory(userId, limit, offset)` — audit trail

- Update `billingService.ts`:
  - `checkUsageLimit()` → check credit balance instead of usage_events counting
  - `recordUsage()` → call `creditService.consumeCredits()`

### API Routes

- `POST /api/billing/credits/purchase` — Buy a credit pack
- `GET /api/billing/credits` — Get credit balance + recent transactions
- Update `/api/billing/subscription` response to include credit balance

### UI Changes

- Credit balance indicator in header/nav (pill showing remaining credits)
- Credit packs on pricing page (replacing day pass card)
- Credit consumption confirmation before actions ("This will use 1 credit. You have 12 remaining.")
- Credit purchase prompt when balance is low
- Transaction history in billing settings
- "Pro is better value" upsell when user has spent $29+ on packs in a month

---

## 14. Risks & Mitigations

### Risk: Credit Hoarding / Low Engagement

**Problem:** Users buy credits but don't use them, reducing engagement and product stickiness.

**Mitigation:**
- Monthly credits expire (use-it-or-lose-it for subscription credits)
- Bonus credits have 90-day expiry
- In-app nudges: "You have 8 credits remaining this month. Try analyzing your updated pitch!"
- Achievement system incentivizes regular use

### Risk: Cannibalization of Pro Subscriptions

**Problem:** Users buy credit packs instead of subscribing, reducing predictable MRR.

**Mitigation:**
- Pro is objectively better value ($0.48/credit vs. $0.58-1.00/credit in packs)
- Smart upsell triggers: "You've spent $32 on credit packs this month. Pro is $29/mo for 60 credits."
- Pro-exclusive features (historical comparison, highest queue priority)
- Annual plan discount ($249/yr = $20.75/mo) makes Pro even more attractive

### Risk: "Nickel and Diming" Perception

**Problem:** Users feel every click costs money, creating negative product experience.

**Mitigation:**
- Generous free tier (3 credits/month — enough for genuine evaluation)
- Credit costs are simple whole numbers (not "0.3 credits for a Q&A")
- Confirmation prompts are informative, not annoying ("This analysis will use 1 credit" — not a popup)
- Failed operations always refund credits

### Risk: Revenue Recognition Complexity

**Problem:** Purchased credits are deferred revenue until consumed or expired.

**Mitigation:**
- 12-month inactivity expiration caps the liability window
- Credit transactions table provides clear audit trail
- At Pitchr's scale, this is a simple bookkeeping task, not an audit concern

### Risk: Technical Complexity

**Problem:** Credit system is more complex than day passes (balances, transactions, consumption priority, refunds).

**Mitigation:**
- Atomic PostgreSQL operations (RPC functions) prevent race conditions
- Transaction log provides full audit trail and debugging
- Clear consumption priority (monthly → purchased → bonus)
- Phased rollout: credits alongside day passes first, then sunset day passes

---

## 15. Decision Framework

### When to Choose Credits Over Day Passes

| Factor | Day Pass | Credits | **Pitchr Fit** |
|--------|----------|---------|----------------|
| Usage pattern | Time-bound sessions | Action-based, bursty | **Credits** — users care about actions, not hours |
| Entry price point | $9 (medium) | $5 (lower) | **Credits** — lower barrier |
| Repeat purchase | Occasional | Frequent | **Credits** — higher LTV |
| User perception | "24h access pass" | "Pay for what you use" | **Credits** — fairer |
| Upsell to subscription | Weak link | Strong link | **Credits** — visible spend drives conversion |
| Implementation complexity | Simple (time check) | Medium (balance mgmt) | Day Pass — but credit complexity is manageable |
| Revenue predictability | Spiky | Smoother | **Credits** — multiple purchase sizes |

### Recommendation: **Proceed with Credits (Hybrid Model)**

The credit system is the stronger model for Pitchr because:

1. **It matches how users think about the product** — "I need to analyze my pitch 10 times" not "I need 24 hours"
2. **It creates a natural upgrade funnel** — Free → Credit Packs → Pro subscription
3. **It captures more revenue** — multiple price points ($5-$35) vs. single ($9)
4. **It's the industry direction** — 126% growth in credit model adoption in 2025
5. **Margins remain excellent** — 79-91% across all scenarios
6. **It's more user-friendly** — no wasted time, no rush, no overnight value loss

### What We Give Up

- Simplicity of the day pass model (time-based is easy to explain)
- Slightly higher implementation effort
- The "all-you-can-eat for 24h" urgency that drives intense usage sessions

### What We Gain

- Higher LTV per user (repeat purchases, natural upgrade path)
- Lower entry barrier ($5 vs. $9)
- Better user experience (no time pressure)
- More revenue flexibility (A/B test pack sizes and prices)
- Foundation for team/enterprise credit pools later
- Referral and achievement mechanics via credit rewards

---

## Appendix A: Competitive Credit Pricing Deep Dive

### AI Speech/Pitch Tools

| Tool | Model | Entry Price | Notes |
|------|-------|-------------|-------|
| Yoodli | Sub ($8-20/mo) | $8/mo | No credits, session-based |
| Orai | Sub ($9.99/mo) | $9.99/mo | No credits, limited sessions |
| Otter.ai | Sub + overage | $8.33/mo | Minutes-based, overage per minute |
| Descript | Sub ($24-33/mo) | $24/mo | Transcription hours as credit-like unit |

### AI Content/Generation Tools

| Tool | Model | Credit Unit | Markup |
|------|-------|-------------|--------|
| ElevenLabs | Sub + credits | Characters | ~5-10x over raw API cost |
| Runway ML | Sub + credits | Seconds of video | ~8-15x over compute cost |
| Midjourney | Sub (GPU hours) | GPU time | ~3-5x over compute cost |
| Jasper | Sub (words) | Words | ~10-20x over LLM cost |

**Pitchr's implied markup:** $1.00/credit at Starter, actual cost ~$0.10 = **~10x markup.** This is right in line with industry norms (5-20x).

### Key Takeaway

Pitchr's credit pricing is competitive and within normal AI SaaS margins. The $5 entry point is lower than most competitors, which helps with conversion.

---

## Appendix B: Credit System UX Mockup

### Dashboard Credit Display

```
┌─────────────────────────────────────────────┐
│  🔥 12 credits remaining                    │
│  ██████████████░░░░░░░░  12/60 this month  │
│  + 5 purchased credits                      │
│  [Buy Credits]  [Upgrade to Pro]            │
└─────────────────────────────────────────────┘
```

### Pre-Action Confirmation

```
┌─────────────────────────────────────────────┐
│  Analyze Pitch                              │
│                                             │
│  This will use 1 credit                     │
│  Balance: 12 monthly + 5 purchased = 17     │
│                                             │
│  [Analyze]              [Cancel]            │
└─────────────────────────────────────────────┘
```

### Low-Credit Prompt

```
┌─────────────────────────────────────────────┐
│  ⚡ Running low on credits                   │
│                                             │
│  You have 1 credit remaining this month.    │
│                                             │
│  [Buy 5 for $5]   [Buy 15 for $12]         │
│  [Upgrade to Pro — 60 credits/mo for $29]   │
└─────────────────────────────────────────────┘
```

### Pricing Page Layout

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│   Free   │  │   Pro    │  │ Pro Year │
│  $0/mo   │  │ $29/mo   │  │ $249/yr  │
│ 3 cr/mo  │  │ 60 cr/mo │  │ 60 cr/mo │
│ Basic    │  │ ★ Best   │  │ Save $99 │
│ analysis │  │  Value   │  │          │
│          │  │ All feat │  │ All feat │
│ [Start]  │  │[Get Pro] │  │[Get Pro] │
└──────────┘  └──────────┘  └──────────┘

     ── or buy credits as you go ──

  ┌────┐  ┌────┐  ┌────┐  ┌────┐
  │ 5  │  │ 15 │  │ 30 │  │ 60 │
  │ $5 │  │$12 │  │$20 │  │$35 │
  └────┘  └────┘  └────┘  └────┘
```

---

## Appendix C: Sources & References

- [Metronome: The Rise of AI Credits](https://metronome.com/blog/the-rise-of-ai-credits-why-cost-plus-credit-models-work-until-they-dont)
- [Metronome: AI Pricing in Practice 2025](https://metronome.com/blog/ai-pricing-in-practice-2025-field-report-from-leading-saas-teams)
- [Growth Unhinged: State of SaaS Pricing 2025](https://www.growthunhinged.com/p/2025-state-of-saas-pricing-changes)
- [Monetizely: 2026 Guide to SaaS & AI Pricing](https://www.getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models)
- [Bessemer: AI Pricing & Monetization Playbook](https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook)
- [Salesforce Ventures: How to Develop AI Pricing](https://salesforceventures.com/perspectives/how-to-develop-an-ai-pricing-model/)
- [Flexprice: Best Credit-Based Pricing Software 2026](https://flexprice.io/blog/best-credit-based-pricing-software-for-ai-companies)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- [Runway ML: How Credits Work](https://help.runwayml.com/hc/en-us/articles/15124877443219-How-do-credits-work)
- [Midjourney Plans Comparison](https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans)
- [Anthropic Claude Pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)
- Pitchr internal: `.planning/julius/2026-02-25-pricing-strategy-day-passes.md`
- Pitchr internal: `config/billing.ts`, `types/billing.ts`, `services/billingService.ts`
