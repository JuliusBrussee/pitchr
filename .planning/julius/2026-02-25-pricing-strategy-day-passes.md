# Pricing Strategy Analysis: Profitability, Willingness to Pay, and Day Passes

**Date:** 2026-02-25
**Status:** Analysis + Implementation Plan

---

## 1. Current Pricing (as-is)

| Plan | Monthly | Yearly | Runs/mo | Decks | Q&A | Key Features |
|------|---------|--------|---------|-------|-----|-------------|
| Free | $0 | $0 | 3 | 1 | 1 | Basic analysis only |
| Pro | $29/mo | $290/yr | 50 | 20 | 30 | Section feedback, vocab, history, deck gen |
| Team | $79/mo | $790/yr | Unlimited | Unlimited | Unlimited | All Pro + priority queue, 10 concurrent |

---

## 2. What Does Each Run Actually Cost Us?

### LLM Costs (the real variable cost)

**Claude Sonnet 4.6** (our primary model):
- Input: $3/million tokens
- Output: $15/million tokens

**Per-run token usage (measured from our codebase):**
- Judge agent: ~2,500-3,500 input + ~2,000-3,000 output tokens
- Section agent (Pro/Team only): ~2,000-2,500 input + ~1,500-2,000 output tokens

**Actual model cost per run:**

| Scenario | Input Tokens | Output Tokens | Model Cost |
|----------|-------------|---------------|------------|
| Free user (judge only) | ~3,000 | ~2,500 | **$0.047** |
| Pro user (judge + section) | ~5,500 | ~4,500 | **$0.084** |
| With prompt caching (repeat pitch) | ~500 new | ~2,500 | **$0.039** |

**The real LLM cost per run is $0.05-0.09.** Not $2.50.

### The $2.50 Floor is Wrong

The economics service hardcodes a $2.50 minimum run cost (`ECON_MIN_RUN_COST_USD`) and $1.50 platform overhead (`ECON_PLATFORM_OVERHEAD_USD`). These were set as conservative estimates but they dramatically overstate actual costs:

- **Actual LLM cost:** $0.05-0.09 per run
- **Supabase (DB + storage):** ~$0.001 per run (free tier covers most usage)
- **Vercel/hosting:** ~$0.01-0.02 per run at moderate scale
- **Stripe processing:** 2.9% + $0.30 per monthly charge (not per run)
- **ElevenLabs STT (if used):** ~$0.01-0.03 per minute of audio

**Realistic all-in cost per run: $0.08-0.15**

### Cost Optimization Available

- **Prompt caching:** 90% reduction on repeated prompt prefixes = ~$0.04/run
- **Batch API:** 50% reduction if we can tolerate slight latency = ~$0.04/run
- **Haiku 4.5 for section agent:** $1/$5 per MTok = saves ~60% on section analysis
- **Gemini Flash fallback:** Even cheaper at ~$0.075/$0.30 per MTok

---

## 3. Revenue vs. Cost Analysis (Current Plans)

### Free Plan (3 runs/month)
- Revenue: $0
- Cost: 3 x $0.09 = **$0.27/month**
- Purpose: Acquisition funnel. Acceptable loss if conversion > 2-3%.

### Pro Plan ($29/month, 50 runs)
- Revenue: $29 - $1.14 (Stripe) = **$27.86 net**
- Max cost: 50 x $0.09 = **$4.50/month**
- **Gross margin: $23.36 (83.9%)**
- At average usage (15 runs/month): cost = $1.35, **margin = $26.51 (95.3%)**

### Team Plan ($79/month, unlimited)
- Revenue: $79 - $2.59 (Stripe) = **$76.41 net**
- At 100 runs/month: cost = $9, **margin = $67.41 (88.2%)**
- At 200 runs/month: cost = $18, **margin = $58.41 (76.5%)**
- Breakeven: ~850 runs/month (won't happen with real usage patterns)

### Verdict: These margins are excellent.

SaaS typically targets 70-80% gross margins. AI products average 50-60%. We're at **80-95% gross margins** because:
1. LLM costs have dropped dramatically (Sonnet 4.6 = Opus-quality at 1/5 price)
2. Our prompts are well-optimized (adaptive clipping, caching)
3. Infrastructure costs are minimal at MVP scale

---

## 4. Will People Pay? Market Analysis

### Competitor Pricing Comparison

| Product | Free | Paid | Model |
|---------|------|------|-------|
| **Yoodli** (AI speech coach) | 5 sessions | $8/mo (Pro), $20/mo (Advanced) | Monthly sub |
| **Orai** (speaking AI) | Limited | $9.99/mo or $99.99/yr | Monthly sub |
| **Pitch.com** (deck tool) | Free tier | $25/mo (Pro), $50/mo (Business) | Monthly sub |
| **Beautiful.ai** (deck tool) | None | $12/mo (Pro), $40/mo (Team) | Monthly sub |
| **Google Gemini** (AI assistant) | Limited | $2.99/day pass, $19.99/mo | Day pass + sub |
| **Pitchr (us)** | 3 runs | $29/mo (Pro), $79/mo (Team) | Monthly sub |

### Key Observations

1. **Yoodli at $8-20/mo is our closest comp.** They do general speech coaching. We do pitch-specific scoring with rubrics, rewrites, deck analysis, and Q&A — significantly more value per session.

2. **We're priced 45% above Yoodli's Advanced plan ($20 vs $29).** This is defensible because:
   - Our output is more actionable (score + ranked fixes + rewrite + deck feedback)
   - We target a higher-value use case (raising money, not general speaking)
   - Founders raising $500K-$5M won't blink at $29/mo if it helps their pitch

3. **Human pitch coaches charge $100-400/hour.** A single coaching session costs more than our entire monthly Pro plan. One VC pitch coaching package runs $1,500-10,000.

4. **The Pro plan at $29/mo is correctly positioned** — premium enough to signal quality, cheap enough vs. human coaches (10-50x cheaper), and aligned with founder willingness to pay for fundraising tools.

### Who Will Pay and When?

**High intent moments (pitch imminent):**
- Just got accepted to Y Combinator / accelerator batch
- Demo Day is in 1-2 weeks
- Investor meeting scheduled for tomorrow
- Preparing for a pitch competition
- About to send cold outreach to VCs

**Sustained use (ongoing subscribers):**
- Actively fundraising (3-6 month period)
- Accelerator cohorts (3-4 month programs)
- Serial pitchers (business development, sales)

**The problem:** Most founders need Pitchr for 1-3 intense days, not 30 days. A founder with a pitch meeting tomorrow doesn't want a monthly subscription — they want access NOW, for today.

---

## 5. The Case for Day Passes

### Why Day Passes Make Sense for Pitchr

1. **Usage pattern matches the product:** Pitch prep is bursty. A founder might run 5-10 analyses in one intense day, then not touch it for weeks. Forcing a $29/month commitment for a 1-day need creates friction.

2. **Google Gemini validated the model:** Gemini's $2.99 day pass gives 24 hours of Pro access and 800 queries. It works because AI usage is often bursty.

3. **Lower barrier to conversion:** Free (3 runs) -> Day Pass ($9) is a much easier upsell than Free -> $29/month. It lets users experience the full product without commitment anxiety.

4. **Captures "pitch panic" revenue:** The founder with a VC meeting tomorrow will happily pay $9 for immediate full access. They might not subscribe for $29/month for "just one meeting."

5. **Upsell funnel:** Day pass users who see value convert to monthly at higher rates because they've already experienced the premium features and already entered payment info.

### Proposed Day Pass Pricing

**$9 for 24-hour full Pro access**

Why $9:
- **Above impulse threshold but below friction threshold.** $2.99 (Gemini's price) undervalues our product. $9 says "this is a serious tool."
- **Cost math:** At $0.09/run, a user doing 15 runs in a day costs us $1.35. Margin: **$7.65 (85%)**. Even a power user doing 30 runs costs $2.70 — still **$6.30 margin (70%)**.
- **Anchoring:** $9 day pass makes $29/month look like a deal (3.2 day passes = 1 month). Users doing 4+ pitch days/month should naturally upgrade.
- **Competitive:** More expensive than Gemini's $2.99 (generic AI), cheaper than a human coaching session ($200+). Positioned as a serious pitch prep tool.

### What a Day Pass Includes

- All Pro features (section feedback, vocabulary metrics, history, deck gen)
- 15 pitch analyses (enough for a full prep session)
- 5 deck uploads
- 5 Q&A sessions
- Priority queue (same as Pro)
- 24-hour window from purchase time

### Why Not Unlimited Runs on Day Pass?

Risk of abuse. A user could buy a $9 day pass and run 100 analyses. At $0.09/run, that's $9 in LLM costs alone — breakeven. Capping at 15 runs keeps margin healthy while being generous enough for real prep use (most founders won't do more than 8-10 iterations in a day).

---

## 6. Recommended Pricing Changes

### Keep (No Change)
- **Free:** 3 runs/month — good acquisition funnel
- **Pro at $29/month** — well-positioned, excellent margins
- **Team at $79/month** — good for accelerators/teams

### Add: Day Pass ($9/24h)
- 15 runs, 5 decks, 5 Q&A sessions
- All Pro features
- 24-hour window
- No auto-renewal (one-time Stripe payment)

### Consider Later
- **3-Day Pass ($19):** For Demo Day prep week. 30 runs over 72 hours.
- **Run packs (10 runs for $15):** No time pressure, use whenever. Good for casual users.
- **Annual discount messaging:** $290/yr = $24.17/mo. Emphasize "save 2 months free."

### Updated Pricing Page Layout

```
Free        Day Pass     Pro              Team
$0          $9           $29/mo           $79/mo
3 runs/mo   15 runs/24h  50 runs/mo       Unlimited
Basic       All Pro      Full suite       Everything
            features     + history        + priority
            One-time     Most Popular     For teams
```

---

## 7. Profitability Summary

| Plan | Revenue | Cost (avg usage) | Gross Margin | Margin % |
|------|---------|-------------------|-------------|----------|
| Free | $0 | $0.27/mo | -$0.27 | N/A |
| Day Pass | $9 | ~$1.00 (10 runs) | $8.00 | 89% |
| Pro Monthly | $29 | ~$1.35 (15 runs avg) | $27.65 | 95% |
| Pro Yearly | $290/yr ($24.17/mo) | ~$16.20/yr | $273.80/yr | 94% |
| Team Monthly | $79 | ~$9.00 (100 runs avg) | $70.00 | 89% |

**Yes, this will be profitable.** Even in the worst case (every user maxes out their runs), margins stay above 70%. With realistic usage patterns, margins are 85-95%.

---

## 8. Implementation Plan for Day Pass

### Types to Add
- Add `'day_pass'` to `BillingPlanId`
- Add `DayPassPurchase` type for tracking active passes
- Update `PlanPricing` to support one-time price

### Config Changes (`config/billing.ts`)
- Add `DAY_PASS` plan definition with limits
- Add `DAY_PASS_PRICING` with one-time price
- Add `DAY_PASS_DURATION_HOURS = 24`

### Billing Service Changes
- Add `purchaseDayPass()` — creates a time-limited subscription
- Add `checkDayPassActive()` — checks if user has active pass
- Modify `checkUsageLimit()` — check day pass before subscription
- Day pass usage tracked separately in `usage_events`

### Stripe Integration
- Create a Stripe Price for the day pass (one-time payment mode)
- Checkout session with `mode: 'payment'` (not subscription)
- Webhook handler for `checkout.session.completed`

### UI Changes
- Add Day Pass card to pricing page
- Show "Day Pass Active" badge with countdown timer
- Add "Buy Day Pass" CTA on free plan usage limit screen

### Database
- New `day_passes` table: `id, user_id, purchased_at, expires_at, runs_used, runs_limit, status`
- Or extend `subscriptions` table with `pass_type` and `expires_at` fields
