# Pitch Competitions, Game Mode & Leaderboards — Feature Planning

**Date:** 2026-03-03
**Status:** Research Complete / Ready for Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Legal Analysis: Using Real Pitch Decks](#2-legal-analysis-using-real-pitch-decks)
3. [Competitor Landscape](#3-competitor-landscape)
4. [Feature Design Overview](#4-feature-design-overview)
5. [Challenge System (Weekly Competitions)](#5-challenge-system-weekly-competitions)
6. [Game Mode (Random Pitch Scenarios)](#6-game-mode-random-pitch-scenarios)
7. [Leaderboard & Ranking System](#7-leaderboard--ranking-system)
8. [XP, Streaks & Progression](#8-xp-streaks--progression)
9. [Content Strategy: Pitch Scenarios](#9-content-strategy-pitch-scenarios)
10. [Monetization & Billing Integration](#10-monetization--billing-integration)
11. [Database Schema](#11-database-schema)
12. [Architecture & Integration](#12-architecture--integration)
13. [Implementation Phases](#13-implementation-phases)
14. [Retention Metrics & Targets](#14-retention-metrics--targets)
15. [Open Questions & Risks](#15-open-questions--risks)
16. [Sources & References](#16-sources--references)

---

## 1. Executive Summary

### The Problem

Pitchr currently delivers one-shot value: record a pitch, get a score, read feedback. There is no reason to come back tomorrow. Most founders use Pitchr for 1-3 intense days of prep and then churn. This is reflected in our pricing analysis — the Day Pass exists specifically because monthly subscriptions don't match the bursty usage pattern.

### The Opportunity

Add a **recurring engagement layer** that gives users a reason to open Pitchr every week, even when they're not actively fundraising:

1. **Weekly Pitch Challenges** — A new business scenario drops every week. Pitch it. Get scored. See how you rank against everyone else.
2. **Game Mode** — On-demand random pitch scenarios. You get a business outline, 60 seconds to read it, then pitch. Like flash cards for founders.
3. **Leaderboard** — Duolingo-style tiered leagues with weekly promotion/demotion. Creates status pressure and competitive drive.

### Why This Works

- **Duolingo's leaderboard system** increased daily visits by 15-25% and session length by 10-22%. Their league system drove 25% more lesson completions. Users with 7-day streaks are 3.6x more likely to stay long-term.
- **No competitor does this for startup pitching.** Yoodli ($300M+ valuation) does general speech coaching. Altitut does pitch coaching with achievements. Nobody combines AI pitch scoring + gamified competitions + leaderboards.
- **Solves the retention problem** without requiring us to build fundamentally new AI — we reuse our existing scoring engine on new content.

### Cost Impact

Each challenge submission runs through our existing analysis pipeline. At $0.05-0.09 per run (see pricing strategy doc), a user doing 5 challenge runs/week costs us ~$0.35-0.45/week ($1.50-$1.80/month). Well within Pro plan margins.

---

## 2. Legal Analysis: Using Real Pitch Decks

### Can We Use Real YC/Funded Startup Pitch Decks?

**Short answer: Not safely for a commercial product, but there are good alternatives.**

#### What's Publicly Available

| Source | Size | Notes |
|--------|------|-------|
| Pitch Deck Hunt | 1,000+ decks | Community-curated, weekly additions |
| AngelMatch | 2,000+ decks | $355M+ raised collectively |
| FoundEvo | 490+ decks | AI startups specifically |
| Failory | Hundreds | Organized by industry/stage |
| BestPitchDeck.com | Growing | Includes 2025-2026 decks |

Famous widely-shared decks: Airbnb (2009), Buffer, Dropbox (2007), Uber (2010), YouTube, Facebook, LinkedIn, WhatsApp.

YC Demo Day presentations are **invite-only** and not publicly distributed. However, YC publishes official templates/guides, and many YC founders voluntarily share their applications (Dropbox, GitLab, OpenPhone, Basedash, etc.).

#### Copyright/Fair Use Analysis

Real startup pitch decks are **copyrighted works automatically upon creation**. The fair use test for our use case:

| Factor | For Us | Against Us |
|--------|--------|------------|
| **Purpose & Character** | Transformative — we score/analyze, not display | Commercial product, not nonprofit |
| **Nature of Work** | Factual/functional content | Still original expression |
| **Amount Used** | Could use summaries/excerpts | Full decks are problematic |
| **Market Effect** | No substitute for original fundraising purpose | Diminished control argument |

**Key risk:** The commercial nature of Pitchr weighs against fair use. The classroom exception (Section 110(1)) only applies to nonprofit educational institutions. "Transformative use" (scoring a pitch rather than displaying it) is our strongest argument but is not guaranteed.

**No existing platform holds explicit licenses** for interactive training use of real decks. Sites like Pitch Deck Hunt, Failory, and Slidebean operate in legally ambiguous territory by curating voluntarily shared decks.

#### Recommendation: Tiered Content Strategy

| Tier | Content | Legal Risk | Implementation |
|------|---------|------------|----------------|
| **Tier 1 (Primary)** | AI-generated synthetic scenarios | Zero risk | LLM generates business outlines inspired by real patterns |
| **Tier 2 (Curated)** | Founder-submitted original pitches | Zero risk | Users opt-in to share their pitches for challenges |
| **Tier 3 (Licensed)** | Partnered deck content | Low risk | Explicit written permission from founders/accelerators |
| **Tier 4 (Reference)** | Public deck analysis | Medium risk | Brief excerpts + heavy commentary (transformative use) |

**We should launch with Tier 1 (synthetic) and Tier 2 (community) only.** This eliminates legal risk entirely while providing unlimited content. Tier 3 can be pursued later through accelerator partnerships.

---

## 3. Competitor Landscape

### Direct Competitors

| Product | What They Do | Pricing | Gamification? | Gap |
|---------|-------------|---------|---------------|-----|
| **Yoodli** | General AI speech coaching, roleplay | Free / $8-20/mo | Basic analytics, no competitions | No startup-specific scoring, no leaderboards |
| **Orai** | Speaking AI — filler words, tone, pacing | $12.99/mo or $49.99/yr | Personalized curriculum | No competitive element, no pitch scenarios |
| **Poised** | Live meeting coach (Zoom/Teams) | Freemium | Real-time feedback | No practice mode, no async competition |
| **Altitut** | AI pitch coaching for entrepreneurs | Unknown | Achievements, structured curriculum | Closest competitor — has gamified achievements but no competitive leaderboard |
| **Pitcherific** | Pitch rehearsal + templates | Freemium | Training mode | No AI scoring, no social features |
| **PitchBob** | AI deck generator + VC Q&A training | Freemium | 11-parameter evaluation | Deck-focused, no speaking practice or leaderboard |

### Adjacent Competitors

| Product | Relevance | What We Can Learn |
|---------|-----------|-------------------|
| **Slidebean** | Deck creation + analytics | Their deck teardown content (Airbnb, etc.) drives organic traffic |
| **Spinify / Centrical** | Sales gamification platforms | Leaderboard + coaching loop proven in enterprise sales |
| **Hyperbound** | AI sales roleplay + leaderboards | Customizable leaderboards + KPI tracking for practice |
| **Founders Live** | Live pitch events (99-second format) | Community + crowd voting creates engagement |

### The Gap

**No existing platform combines all three for startup pitching:**
1. AI-powered pitch scoring (like Yoodli + PitchScore)
2. Gamification with leaderboards and competitions (like Spinify)
3. Structured pitch scenarios for practice (like Pitcherific + Pitch Deck Hunt)

**This is Pitchr's differentiated opportunity.**

---

## 4. Feature Design Overview

### Three Interconnected Features

```
┌─────────────────────────────────────────────────────────┐
│                    PITCH ARENA                          │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   WEEKLY      │  │   GAME       │  │  LEADERBOARD │  │
│  │   CHALLENGE   │  │   MODE       │  │  & LEAGUES   │  │
│  │              │  │              │  │              │  │
│  │  New scenario │  │  Random biz  │  │  Weekly      │  │
│  │  every week   │  │  outlines    │  │  rankings    │  │
│  │              │  │              │  │              │  │
│  │  Same prompt  │  │  On-demand   │  │  Promotion/  │  │
│  │  for everyone │  │  practice    │  │  demotion    │  │
│  │              │  │              │  │              │  │
│  │  ────────►   │  │  ────────►   │  │              │  │
│  │  Earns XP +  │  │  Earns XP    │  │  ◄────────   │  │
│  │  challenge   │  │  (less than  │  │  Driven by   │  │
│  │  ranking     │  │  challenges) │  │  XP earned   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              XP + STREAK SYSTEM                     │ │
│  │  Tracks all activity, powers leagues, unlocks       │ │
│  │  badges, drives daily/weekly return                 │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### User Journey

1. **Discovery:** User sees "Weekly Challenge" banner on dashboard after completing their first pitch
2. **First challenge:** Reads scenario (a synthetic business brief), records pitch, gets scored
3. **Hook:** Sees their rank on the weekly leaderboard — "You're #14 out of 47 participants"
4. **Return:** Notification on Monday "New challenge dropped: Pitch a fintech disrupting remittances"
5. **Habit:** User starts doing Game Mode practice to improve, building skill + XP
6. **Status:** After 4 weeks, they've climbed to Gold league and have a 15-day streak
7. **Lock-in:** Social pressure (league demotion), sunk cost (streak), and genuine skill improvement keep them returning

---

## 5. Challenge System (Weekly Competitions)

### How It Works

Every **Monday at 00:00 UTC**, a new pitch challenge is released. All participants receive the **same business scenario** and pitch under identical conditions. This creates a fair, comparable competition.

#### Challenge Structure

```
WEEKLY CHALLENGE #12: "ClimateLock"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 THE BUSINESS
ClimateLock is a B2B SaaS platform that helps commercial real estate
owners monitor and reduce carbon emissions across their building
portfolios. Using IoT sensors and ML models, ClimateLock identifies
energy waste patterns and recommends retrofits with projected ROI.

📊 KEY METRICS
- Founded: 2025
- Stage: Seed
- Team: 3 co-founders (ex-Google, ex-Siemens, MIT PhD)
- Revenue: $180K ARR, 12 buildings onboarded
- Market: $14B commercial building energy management (growing 18% YoY)
- Ask: $3M seed round

🎯 YOUR MISSION
Deliver a 2-minute elevator pitch to a seed-stage VC partner.
Focus on: problem, solution, traction, and the ask.

⏱️ Time limit: 2 minutes
📅 Challenge ends: Sunday 23:59 UTC
🏆 Top 3 earn bonus XP + badge
```

#### Challenge Types (Rotating Weekly)

| Type | Description | Frequency |
|------|-------------|-----------|
| **Elevator Pitch** | 2-min pitch of a seed-stage startup | Every other week |
| **VC Pitch** | 5-min full pitch with deck context | Monthly |
| **Pivot Pitch** | Given a failing startup, pitch the pivot | Monthly |
| **Speed Round** | 60-second pitch — ruthless brevity | Bi-weekly |
| **Industry Deep-Dive** | Specific vertical (fintech, healthtech, climate) | Monthly |
| **Objection Gauntlet** | Pitch + handle 3 VC objections via Q&A | Quarterly (special event) |

#### Scoring

Challenges use the **existing Pitchr scoring rubric** (structure, clarity, evidence, market, delivery) with an additional **challenge-specific bonus**:

```
Challenge Score = Base Pitchr Score (0-100) + Challenge Bonus (0-20)

Challenge Bonus criteria:
- Addressed all key metrics in the brief: +5
- Stayed within time limit: +5
- Used specific numbers from the brief (not vague): +5
- Clear call-to-action / ask: +5
```

Max possible challenge score: **120 points**

#### Submission Rules

- **One submission per challenge** (no re-dos — forces preparation)
- Users can practice in Game Mode with different scenarios before attempting the challenge
- Submissions open Monday 00:00 UTC through Sunday 23:59 UTC
- Late submissions are not accepted
- Results and rankings revealed Monday when the new challenge drops

#### Anti-Gaming

- Transcript is checked for AI-generated content patterns (we can detect if someone is reading ChatGPT output vs. speaking naturally — delivery metrics like filler words, pacing variance, and pause patterns differ significantly)
- Audio is required (no text-only submissions for challenges)
- Duplicate/near-duplicate transcripts across users are flagged
- Score calibration ensures the AI judge doesn't inflate scores for confident-sounding but substance-free pitches (our rubric already handles this with the evidence/market categories)

---

## 6. Game Mode (Random Pitch Scenarios)

### Concept

On-demand practice with **randomly generated business scenarios**. Think of it as "flash cards for pitching" — you get a random business brief, have a short reading window, then pitch. Scored instantly.

### How It Works

```
┌──────────────────────────────────────────┐
│           GAME MODE                      │
│                                          │
│  1. Choose difficulty:                   │
│     [ Starter ]  [ Pro ]  [ Expert ]     │
│                                          │
│  2. Random scenario generated            │
│     ┌──────────────────────────────┐     │
│     │ "PetPulse: IoT health        │     │
│     │  monitoring for pets..."      │     │
│     │                              │     │
│     │  Read time: 45s remaining    │     │
│     └──────────────────────────────┘     │
│                                          │
│  3. Pitch! (timer starts)                │
│     ┌──────────────────────────────┐     │
│     │  🔴 Recording...             │     │
│     │  01:23 / 02:00               │     │
│     └──────────────────────────────┘     │
│                                          │
│  4. Instant score + XP earned            │
│     ┌──────────────────────────────┐     │
│     │  Score: 74/100    +35 XP     │     │
│     │  "Strong hook, but you       │     │
│     │   forgot the market size"    │     │
│     │                              │     │
│     │  [ Try Again ] [ New Prompt ] │     │
│     └──────────────────────────────┘     │
└──────────────────────────────────────────┘
```

### Difficulty Levels

| Level | Read Time | Pitch Time | Brief Detail | Scoring |
|-------|-----------|------------|--------------|---------|
| **Starter** | 90 seconds | 2 minutes | Full brief with hints | Standard rubric, lenient |
| **Pro** | 60 seconds | 2 minutes | Full brief, no hints | Standard rubric |
| **Expert** | 30 seconds | 90 seconds | Minimal brief (one-liner + 3 metrics) | Strict rubric + time bonus |

### Scenario Generation

Scenarios are **pre-generated in batches** using Claude and stored in the database (not generated on-the-fly per user). This ensures:
- Consistent quality across all scenarios
- No LLM latency at game-start time
- Scenarios can be reviewed/curated before going live
- Same scenario pool for fair comparison if users share scores

#### Generation Prompt Strategy

Each scenario includes:
- **Company name** (fictional)
- **One-sentence description**
- **Industry vertical** (fintech, healthtech, edtech, climate, SaaS, marketplace, etc.)
- **Stage** (pre-seed, seed, Series A)
- **Team background** (2-3 sentences)
- **Key metrics** (revenue, users, growth rate — all fictional but realistic)
- **Market size** (TAM/SAM/SOM)
- **The ask** (funding amount + use of funds)
- **One unique differentiator / moat**

We already have pitch scenario knowledge in our codebase:
- `pitch backend/` — 25 real pitch transcripts (Dropbox, Airbnb, NimbleRx, etc.)
- `knowledge/curated/pitch_deck_playbook.md` — Patterns and structures
- `knowledge/curated/elevator-pitch-dataset/` — Dataset of elevator pitches
- `knowledge/patterns.v1.json` — Pitch patterns

These serve as **training examples** for generating realistic synthetic scenarios.

### XP Awards for Game Mode

| Action | XP |
|--------|-----|
| Complete a game mode pitch | +15 XP |
| Score above 70 | +25 XP |
| Score above 85 | +40 XP |
| Score above 95 | +60 XP |
| Try Expert difficulty | +10 XP bonus |
| Complete 3 game mode pitches in one session | +20 XP bonus |
| First game mode pitch of the day | +10 XP bonus |

---

## 7. Leaderboard & Ranking System

### Duolingo-Inspired League Structure

Based on Duolingo's proven model (15-25% increase in daily visits, 10-22% longer sessions), we implement **tiered weekly leagues**:

```
LEAGUE PROGRESSION
━━━━━━━━━━━━━━━━━

🥉 Bronze League     ← Everyone starts here
🥈 Silver League
🥇 Gold League
💎 Diamond League
👑 Champion League   ← Top performers only

Each league: 30 users, ranked by weekly XP
Top 5: Promoted to next league
Bottom 5: Demoted to previous league
Everyone else: Stays in current league
```

### League Details

| League | Entry | Promotion | Demotion | Perks |
|--------|-------|-----------|----------|-------|
| **Bronze** | Default start | Top 5 → Silver | N/A (can't go lower) | — |
| **Silver** | Promoted from Bronze | Top 5 → Gold | Bottom 5 → Bronze | Silver badge on profile |
| **Gold** | Promoted from Silver | Top 5 → Diamond | Bottom 5 → Silver | Gold badge, priority in matchmaking |
| **Diamond** | Promoted from Gold | Top 5 → Champion | Bottom 5 → Gold | Diamond badge, featured in community |
| **Champion** | Promoted from Diamond | Top 3 → Hall of Fame | Bottom 5 → Diamond | Champion badge, "Champion Pitcher" title |

### Matchmaking (Critical for Retention)

Following Duolingo's key innovation — **match users with similar engagement levels**:

- Users are grouped into leagues of ~30 people with **similar XP from the previous week**
- A user who earned 200 XP last week competes against others who earned ~150-250 XP
- This prevents beginners from being crushed by power users (which causes churn)
- Time zone grouping ensures league deadlines feel fair
- League resets every **Monday 00:00 UTC** (same as challenge drops)

### Weekly Leaderboard UI

```
┌──────────────────────────────────────────────┐
│  🥇 GOLD LEAGUE          Week of Mar 3       │
│  Resets in 4d 12h 23m                        │
│                                              │
│  ▲ PROMOTION ZONE                            │
│  ─────────────────────────────────────────── │
│  1. SarahPitches        487 XP    ▲ +2       │
│  2. VCSlayer99          451 XP    ▲ +1       │
│  3. PitchPerfect        423 XP    ▼ -1       │
│  4. StartupSteve        398 XP    ▲ +3       │
│  5. FounderFrank        372 XP    — 0        │
│  ─────────────────────────────────────────── │
│  6. TechTina            345 XP    ▼ -2       │
│  ...                                         │
│  14. ➤ You              278 XP    ▲ +1       │
│  ...                                         │
│  ─────────────────────────────────────────── │
│  ▼ DEMOTION ZONE                             │
│  26. SlowPitcher        45 XP     ▼ -3       │
│  27. NewbieNate         32 XP     ▼ -1       │
│  28. QuietQuinn         18 XP     — 0        │
│  29. InactiveSam        5 XP      ▼ -5       │
│  30. GhostUser          0 XP      — 0        │
│                                              │
│  [ View Full Leaderboard ]                   │
└──────────────────────────────────────────────┘
```

### All-Time Leaderboard

In addition to weekly leagues, a persistent **all-time leaderboard** tracks cumulative achievement:

- **Total XP earned** (lifetime)
- **Highest league reached**
- **Challenge wins** (total #1 finishes)
- **Best single score** (highest score on any pitch)
- **Current streak** (consecutive weeks with activity)

This provides long-term status and makes it costly to abandon the platform.

---

## 8. XP, Streaks & Progression

### XP System

XP (Experience Points) is the **single currency** that powers leagues, progression, and status.

#### XP Earning Activities

| Activity | XP | Notes |
|----------|-----|-------|
| **Complete a regular pitch analysis** | +20 | Core product usage |
| **Submit weekly challenge** | +50 | Highest single-action reward |
| **Challenge score bonus** | +1 per point above 70 | Score 85 = +15 bonus XP |
| **Complete game mode pitch** | +15 | Quick practice |
| **Game mode score >85** | +40 | Encourages quality |
| **First pitch of the day** | +10 | Daily return incentive |
| **3-day streak maintained** | +25 | Weekly milestone |
| **7-day streak maintained** | +75 | Strong weekly commitment |
| **30-day streak maintained** | +300 | Monthly milestone |
| **Score improvement >10pts** | +30 | Rewards growth, not just talent |
| **Try a new pitch mode** | +20 | Exploration bonus (one-time per mode) |

#### XP Scaling Philosophy

- **Challenge submissions earn the most XP** because they're time-limited and create the weekly competitive loop
- **Score-based bonuses** reward quality over quantity (can't just spam low-effort pitches)
- **Streaks** reward consistency, which is the strongest predictor of long-term retention
- **Improvement bonuses** keep beginners motivated (even a bad pitcher can earn XP by getting better)

### Streak System

Inspired by Duolingo (users with 7-day streaks are **3.6x more likely** to stay engaged long-term):

```
STREAK TRACKER
━━━━━━━━━━━━━━

🔥 Current streak: 12 days

Mon  Tue  Wed  Thu  Fri  Sat  Sun
 ✓    ✓    ✓    ✓    ✓    ✓    ✓    ← Last week
 ✓    ✓    ✓    ✓    ✓    ·    ·    ← This week

Streak requirement: Complete at least ONE pitch activity per day
(regular analysis, game mode, or challenge submission)

Streak freeze: 1 free per week (Pro users get 2)
```

#### Streak Mechanics

- **Minimum daily activity:** One pitch of any kind (game mode counts — low friction)
- **Streak freeze:** Protects your streak for one missed day. Free users get 1/week, Pro gets 2/week.
- **Streak recovery:** If you miss a day without a freeze, streak resets to 0. But we show "longest streak" on profile so past achievement isn't lost.
- **Streak milestones:** Visual badges at 7, 30, 60, 100, 365 days

### Badges & Achievements

Cosmetic rewards that display on the user's profile:

| Badge | Requirement | Rarity |
|-------|-------------|--------|
| **First Pitch** | Complete your first analysis | Common |
| **Weekly Warrior** | Submit 4 weekly challenges in a row | Uncommon |
| **Century Club** | Score 100 on any pitch | Rare |
| **Diamond Pitcher** | Reach Diamond league | Rare |
| **Champion** | Reach Champion league | Epic |
| **Iron Streak** | 30-day streak | Uncommon |
| **Obsidian Streak** | 100-day streak | Rare |
| **Speed Demon** | Score 80+ on Expert game mode | Rare |
| **Genre Master** | Complete challenges in 5 different industries | Uncommon |
| **Pitch Perfect** | Score 90+ three times in one week | Rare |
| **Community Pick** | Receive 50+ votes on a shared pitch (future) | Rare |
| **Challenge Champion** | Win (#1) a weekly challenge | Epic |

---

## 9. Content Strategy: Pitch Scenarios

### Primary: AI-Generated Synthetic Scenarios (Tier 1)

Generate scenarios in batches using Claude. Each batch produces 20-50 scenarios across industries and stages.

#### Industry Coverage

| Category | Example Verticals | Weight |
|----------|-------------------|--------|
| **SaaS / B2B** | DevTools, HR, Finance, Security | 25% |
| **Fintech** | Payments, Lending, Insurance, Crypto | 15% |
| **Healthtech** | Diagnostics, Telehealth, Mental Health, Biotech | 15% |
| **Climate / Energy** | Carbon tracking, EV, Grid, Agriculture | 10% |
| **Consumer** | Social, Marketplace, D2C, Food | 10% |
| **Edtech** | Learning platforms, Tutoring, Credentialing | 10% |
| **AI / ML** | Infrastructure, Applications, Agents | 10% |
| **Hardware / Deep Tech** | Robotics, Space, Materials, Quantum | 5% |

#### Stage Distribution

- Pre-seed (idea + early traction): 30%
- Seed (product-market fit signals): 40%
- Series A (growth metrics): 20%
- Pivot scenarios: 10%

#### Generation Pipeline

```
1. Generate batch of scenarios via Claude
   → Prompt includes: industry, stage, metrics ranges, team archetype
   → Output: structured JSON matching our ScenarioSchema

2. Human review (curator)
   → Check for realism, balance, no offensive content
   → Flag any that too closely resemble real companies
   → Approve / reject / edit

3. Store in Supabase `scenarios` table
   → Tagged by industry, stage, difficulty, challenge_eligible

4. Weekly challenge selection
   → Auto-select from approved pool, or manually curate
   → Ensure variety (don't repeat industries back-to-back)

5. Game mode random selection
   → Weighted random from full approved pool
   → Track which scenarios each user has seen (avoid repeats)
```

#### Scenario Quality Bar

Each scenario must have:
- A **plausible business model** (not fantasy)
- **Realistic metrics** for the claimed stage (seed-stage startups don't have $50M ARR)
- **Enough detail** to pitch convincingly (problem, solution, market, traction, team, ask)
- **A clear "hook"** — something interesting about the business that rewards good pitchers
- **At least one weakness** — something a VC would push back on (forces realistic thinking)

### Secondary: Community-Submitted Pitches (Tier 2)

Users can opt-in to submit their own pitch as a challenge scenario:

- User checks "Share my pitch as a community challenge" after completing a regular analysis
- Pitch is anonymized (user identity removed)
- Reviewed before inclusion in the challenge pool
- Original pitcher earns XP + "Content Creator" badge
- Creates a flywheel: more users → more content → more challenges → more users

### Future: Accelerator Partnerships (Tier 3)

Potential partnerships to explore (not for launch):

- **Y Combinator** — Feature YC application scenarios (with permission)
- **Techstars / 500 Global** — Co-branded challenges using their portfolio examples
- **University accelerators** — Pitch competitions using Pitchr as the platform
- **Demo Day events** — Live Pitchr scoring at real demo days

---

## 10. Monetization & Billing Integration

### How Competitions Integrate with Existing Plans

| Feature | Free | Day Pass | Pro | Team |
|---------|------|----------|-----|------|
| **Weekly Challenge** | View only (can't submit) | 1 submission | Unlimited | Unlimited |
| **Game Mode** | 2 per week | 5 per day | 10 per day | Unlimited |
| **Leaderboard** | View top 10 | Full view | Full view + league | Full view + league |
| **League participation** | No | No | Yes | Yes |
| **Streak tracking** | Basic (no freeze) | Basic (no freeze) | Full (2 freezes/wk) | Full (3 freezes/wk) |
| **Badges** | Earn basic badges | Earn basic badges | Earn all badges | Earn all + team badges |

### Why This Drives Upgrades

1. **Free users see the challenge** and want to participate → upgrade prompt
2. **Free users see the leaderboard** but can't join leagues → status motivation
3. **Game mode is addictive** but rate-limited on Free → "Want more? Go Pro"
4. **Streaks create sunk cost** — missing a day hurts, freezes require Pro

### Revenue Impact Modeling

Assume 1,000 free users, 5% conversion to Pro ($29/mo):

| Scenario | Without Competitions | With Competitions |
|----------|---------------------|-------------------|
| Monthly active users | ~200 (20% MAU) | ~400 (40% MAU) |
| Free → Pro conversion | 3-5% | 7-12% |
| Pro monthly churn | 8-12% | 4-6% |
| Average Pro lifetime | 3-5 months | 6-10 months |
| Monthly Pro revenue | 50 x $29 = $1,450 | 90 x $29 = $2,610 |

Conservative estimate: **80% revenue increase** from improved conversion + retention.

### Future Monetization (Post-Launch)

| Opportunity | Model | Timeline |
|-------------|-------|----------|
| **Premium challenges** | Special event entry ($2-5) | 6 months post-launch |
| **Team competitions** | Enterprise pricing for company teams | 6-12 months |
| **Prize pools** | Entry fees ($5-10), winner takes prize | 12+ months, requires legal review |
| **Sponsored challenges** | VC firms sponsor a challenge with their thesis | 12+ months |
| **Certification** | "Pitchr Certified" badge after passing assessment | 12+ months |

---

## 11. Database Schema

### New Tables

```sql
-- ============================================================
-- SCENARIOS: Pre-generated pitch scenarios for challenges & game mode
-- ============================================================
CREATE TABLE IF NOT EXISTS scenarios (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,                    -- "ClimateLock"
  one_liner       TEXT NOT NULL,                    -- Short description
  industry        TEXT NOT NULL,                    -- 'fintech', 'healthtech', etc.
  stage           TEXT NOT NULL,                    -- 'pre_seed', 'seed', 'series_a'
  difficulty      TEXT NOT NULL DEFAULT 'pro',      -- 'starter', 'pro', 'expert'
  brief           JSONB NOT NULL,                   -- Full scenario brief (structured)
  pitch_type      TEXT NOT NULL DEFAULT 'elevator', -- 'elevator', 'vc_pitch', 'speed_round'
  time_limit_sec  INT NOT NULL DEFAULT 120,         -- Pitch time limit
  read_time_sec   INT NOT NULL DEFAULT 60,          -- Brief reading time
  challenge_eligible BOOLEAN DEFAULT true,          -- Can be used for weekly challenges
  source          TEXT NOT NULL DEFAULT 'synthetic', -- 'synthetic', 'community', 'licensed'
  status          TEXT NOT NULL DEFAULT 'draft',    -- 'draft', 'approved', 'retired'
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CHALLENGES: Weekly competition instances
-- ============================================================
CREATE TABLE IF NOT EXISTS challenges (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id     UUID NOT NULL REFERENCES scenarios(id),
  week_number     INT NOT NULL,                     -- ISO week number
  year            INT NOT NULL,
  title           TEXT NOT NULL,                     -- Display title
  description     TEXT,                              -- Optional flavor text
  challenge_type  TEXT NOT NULL DEFAULT 'elevator',  -- 'elevator', 'vc_pitch', 'speed_round', 'pivot', 'objection'
  bonus_criteria  JSONB,                             -- Challenge-specific bonus scoring rules
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'upcoming',  -- 'upcoming', 'active', 'completed'
  participant_count INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_number, year)
);

-- ============================================================
-- CHALLENGE_SUBMISSIONS: User entries for weekly challenges
-- ============================================================
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id    UUID NOT NULL REFERENCES challenges(id),
  user_id         UUID NOT NULL,
  run_id          UUID REFERENCES runs(id),          -- Links to existing pitch run
  base_score      NUMERIC(5,2),                      -- Standard pitchr score (0-100)
  bonus_score     NUMERIC(5,2) DEFAULT 0,            -- Challenge bonus (0-20)
  total_score     NUMERIC(5,2),                      -- base + bonus
  rank            INT,                                -- Populated after challenge ends
  xp_earned       INT DEFAULT 0,
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)                      -- One submission per user per challenge
);

-- ============================================================
-- GAME_MODE_SESSIONS: Individual game mode attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS game_mode_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL,
  scenario_id     UUID NOT NULL REFERENCES scenarios(id),
  run_id          UUID REFERENCES runs(id),
  difficulty      TEXT NOT NULL DEFAULT 'pro',
  score           NUMERIC(5,2),
  xp_earned       INT DEFAULT 0,
  completed_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LEAGUES: Weekly league instances
-- ============================================================
CREATE TABLE IF NOT EXISTS leagues (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier            TEXT NOT NULL,                      -- 'bronze', 'silver', 'gold', 'diamond', 'champion'
  week_number     INT NOT NULL,
  year            INT NOT NULL,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- LEAGUE_MEMBERSHIPS: Users assigned to leagues each week
-- ============================================================
CREATE TABLE IF NOT EXISTS league_memberships (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id       UUID NOT NULL REFERENCES leagues(id),
  user_id         UUID NOT NULL,
  weekly_xp       INT DEFAULT 0,
  rank            INT,                                -- Calculated at week end
  promoted        BOOLEAN DEFAULT false,
  demoted         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_id, user_id)
);

-- ============================================================
-- USER_STATS: Persistent user progression data
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stats (
  user_id             UUID PRIMARY KEY,
  total_xp            INT DEFAULT 0,
  current_league_tier TEXT DEFAULT 'bronze',
  current_streak      INT DEFAULT 0,
  longest_streak      INT DEFAULT 0,
  last_activity_date  DATE,
  streak_freezes_remaining INT DEFAULT 1,
  streak_freeze_last_reset DATE,
  challenges_completed INT DEFAULT 0,
  challenge_wins      INT DEFAULT 0,
  game_mode_completed INT DEFAULT 0,
  highest_score       NUMERIC(5,2) DEFAULT 0,
  badges              JSONB DEFAULT '[]'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- XP_EVENTS: Granular XP earning log
-- ============================================================
CREATE TABLE IF NOT EXISTS xp_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL,
  event_type      TEXT NOT NULL,                      -- 'challenge_submit', 'game_mode', 'pitch_analysis', 'streak_bonus', 'score_bonus'
  xp_amount       INT NOT NULL,
  source_id       UUID,                               -- Reference to the triggering entity
  metadata        JSONB,                              -- Additional context
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_challenges_active ON challenges(status, starts_at);
CREATE INDEX idx_challenge_submissions_leaderboard ON challenge_submissions(challenge_id, total_score DESC);
CREATE INDEX idx_league_memberships_ranking ON league_memberships(league_id, weekly_xp DESC);
CREATE INDEX idx_xp_events_user_weekly ON xp_events(user_id, created_at);
CREATE INDEX idx_game_mode_user ON game_mode_sessions(user_id, completed_at);
CREATE INDEX idx_scenarios_approved ON scenarios(status, industry, difficulty);
```

### RLS Policies

```sql
-- Users can only see their own submissions
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own submissions" ON challenge_submissions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own submissions" ON challenge_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can see all league memberships (leaderboard is public)
ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public league view" ON league_memberships
  FOR SELECT USING (true);

-- Users can only see/update their own stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Scenarios and challenges are publicly readable
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public scenario read" ON scenarios
  FOR SELECT USING (status = 'approved');

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public challenge read" ON challenges
  FOR SELECT USING (true);
```

---

## 12. Architecture & Integration

### How It Fits the Existing MVC Pattern

```
EXISTING                          NEW (ADDITIONS)
─────────────────────────────────────────────────────────

Views (Pages/Components)
  app/(app)/dashboard/            app/(app)/arena/
  app/(app)/session/                ├── page.tsx (Arena hub)
  app/(app)/results/                ├── challenge/[id]/page.tsx
  views/components/                 ├── game-mode/page.tsx
                                    └── leaderboard/page.tsx
                                  views/components/arena/
                                    ├── ChallengeCard.tsx
                                    ├── LeaderboardTable.tsx
                                    ├── GameModePanel.tsx
                                    ├── StreakTracker.tsx
                                    ├── XpBar.tsx
                                    └── BadgeDisplay.tsx

Hooks
  hooks/usePitchRun.ts            hooks/useChallenge.ts
  hooks/useSessionState.ts        hooks/useGameMode.ts
  hooks/useRecorder.ts            hooks/useLeaderboard.ts
                                  hooks/useUserStats.ts
                                  hooks/useXp.ts

Controllers (API Routes)
  app/api/pitch/run/              app/api/arena/
                                    ├── challenges/route.ts
                                    ├── challenges/[id]/submit/route.ts
                                    ├── game-mode/route.ts
                                    ├── leaderboard/route.ts
                                    └── stats/route.ts

Services
  services/analysisService.ts     services/challengeService.ts
  services/scoringService.ts      services/gameModeService.ts
  services/runService.ts          services/leagueService.ts
                                  services/xpService.ts
                                  services/scenarioService.ts

Models
  models/run.ts                   models/challenge.ts
                                  models/scenario.ts
                                  models/league.ts
                                  models/userStats.ts

Config
  config/rubric.ts                config/arena.ts (XP values, league tiers, etc.)
  config/modes.ts                 config/scenarios.ts (generation prompts)
```

### Data Flow: Challenge Submission

```
1. User visits /arena → loads active challenge via useChallenge()
2. useChallenge() fetches GET /api/arena/challenges (active challenge + scenario)
3. User clicks "Start Challenge" → navigates to /session with challenge context
4. Existing session flow runs (recording, transcription, submission)
5. On session complete → POST /api/arena/challenges/[id]/submit
6. challengeService:
   a. Creates a regular run via runService (reuses existing pipeline)
   b. Waits for analysis to complete
   c. Calculates challenge bonus score
   d. Creates challenge_submission record
   e. Awards XP via xpService
   f. Updates user_stats
7. User redirected to /arena/challenge/[id] with their score + current ranking
```

### Data Flow: Game Mode

```
1. User visits /arena/game-mode → selects difficulty
2. useGameMode() fetches GET /api/arena/game-mode?difficulty=pro
3. scenarioService returns a random unseen scenario
4. User reads brief (countdown timer), then records pitch
5. On complete → POST /api/arena/game-mode (with run data)
6. gameModeService:
   a. Creates run via runService
   b. Waits for analysis
   c. Creates game_mode_session record
   d. Awards XP via xpService
7. User sees score + XP earned, can try again or get new scenario
```

### Data Flow: League Processing (Weekly Cron)

```
Every Monday 00:00 UTC (Supabase Edge Function or Vercel Cron):
1. leagueService.processWeekEnd():
   a. For each active league:
      - Calculate final rankings from league_memberships.weekly_xp
      - Mark top 5 as promoted, bottom 5 as demoted
      - Update challenge_submissions with final ranks
   b. leagueService.createNewWeek():
      - Create new league instances for the new week
      - Assign users to leagues based on new tier + matchmaking
      - Reset weekly XP to 0
   c. challengeService.activateNewChallenge():
      - Set current challenge status to 'completed'
      - Activate next week's challenge
   d. Send notifications (email/push) for promotions/demotions
```

### Integration with Existing Session Flow

The key insight is that **challenges and game mode reuse the existing pitch analysis pipeline**. A challenge submission is just a regular pitch run with additional metadata:

```typescript
// In usePitchRun.ts — add optional challenge/game mode context
interface CreatePitchRunRequest {
  // ...existing fields...
  challenge_id?: string;        // If submitting for a challenge
  game_mode_session_id?: string; // If in game mode
  scenario_id?: string;         // The scenario being pitched
}
```

The `analysisService` doesn't need to change at all. The `challengeService` and `gameModeService` wrap around it, adding scoring bonuses and XP after the core analysis completes.

---

## 13. Implementation Phases

### Phase 1: Foundation (2-3 weeks)

**Goal:** Database schema + scenario generation + basic game mode

| Task | Effort | Dependencies |
|------|--------|--------------|
| Create database migrations (all new tables) | 2 days | None |
| Build `scenarioService` for scenario CRUD | 2 days | DB tables |
| Build scenario generation pipeline (Claude batch) | 3 days | scenarioService |
| Generate initial scenario pool (100+ scenarios) | 2 days | Generation pipeline |
| Build `xpService` for XP tracking | 2 days | DB tables |
| Build `userStats` model | 1 day | DB tables |
| Build basic Game Mode API routes | 2 days | scenarioService, xpService |
| Build Game Mode UI (scenario display, timer, recording integration) | 3 days | API routes |

**Deliverable:** Users can play game mode — get random scenario, pitch, get scored, earn XP.

### Phase 2: Challenges (2-3 weeks)

**Goal:** Weekly challenge system with submissions and rankings

| Task | Effort | Dependencies |
|------|--------|--------------|
| Build `challengeService` (CRUD, submission, scoring) | 3 days | Phase 1 |
| Build challenge bonus scoring logic | 2 days | challengeService |
| Build challenge API routes | 2 days | challengeService |
| Build Challenge UI (challenge page, submission flow, results) | 3 days | API routes |
| Build challenge leaderboard (per-challenge rankings) | 2 days | Submissions |
| Build weekly challenge cron job (activate/complete) | 1 day | challengeService |
| Curate first 8 weeks of challenge scenarios | 2 days | Scenario pool |

**Deliverable:** Weekly challenges go live. Users can submit and see rankings.

### Phase 3: Leagues & Leaderboards (2-3 weeks)

**Goal:** Duolingo-style tiered league system

| Task | Effort | Dependencies |
|------|--------|--------------|
| Build `leagueService` (creation, matchmaking, processing) | 3 days | Phase 1, 2 |
| Build league processing cron job (weekly promotion/demotion) | 2 days | leagueService |
| Build league matchmaking algorithm | 2 days | leagueService |
| Build Leaderboard UI (league view, rankings, promotion zones) | 3 days | leagueService |
| Build Arena hub page (/arena) | 2 days | All components |
| Build XP bar + streak tracker components | 2 days | userStats |
| Add league/streak to dashboard | 1 day | Components |

**Deliverable:** Full league system with weekly resets, promotion/demotion, and leaderboard UI.

### Phase 4: Polish & Engagement (1-2 weeks)

**Goal:** Streaks, badges, notifications, billing integration

| Task | Effort | Dependencies |
|------|--------|--------------|
| Build streak system (daily tracking, freezes, milestones) | 2 days | userStats |
| Build badge system (earn conditions, display) | 2 days | userStats |
| Add competition features to billing plan limits | 1 day | Existing billing |
| Add "upgrade to compete" prompts for free users | 1 day | Billing |
| Add arena activity to dashboard feed | 1 day | Phase 3 |
| Email notifications for challenge drops + league results | 2 days | Challenge + League services |
| End-to-end testing | 2 days | All |

**Deliverable:** Complete feature with engagement loops, billing gates, and notifications.

### Total Estimated Effort: 7-11 weeks

---

## 14. Retention Metrics & Targets

### Key Metrics to Track

| Metric | Current (Estimated) | Target (3 months post-launch) | Target (6 months) |
|--------|-------------------|-------------------------------|-------------------|
| **WAU/MAU ratio** | ~25% | 40% | 50% |
| **D7 retention** | ~10% | 20% | 25% |
| **D30 retention** | ~5% | 12% | 18% |
| **Weekly challenge participation rate** | N/A | 30% of Pro users | 50% of Pro users |
| **Game mode sessions/user/week** | N/A | 2.5 | 4.0 |
| **Free → Pro conversion** | ~3-5% | 7-10% | 10-15% |
| **Pro monthly churn** | ~8-12% | 5-7% | 3-5% |
| **Average streak length** | N/A | 5 days | 12 days |

### Leading Indicators (Track Weekly)

- % of users who view the arena page
- % of arena viewers who submit a challenge
- % of challenge submitters who return next week
- Average XP earned per active user per week
- League promotion rate (should be ~17% = 5/30)
- Streak freeze usage rate (high = users care about streaks)

### North Star Metric

**Weekly Active Pitchers (WAP):** Users who complete at least one pitch activity (analysis, challenge, or game mode) per week.

Current estimate: ~200 WAP per 1,000 registered users (20%)
Target: 400+ WAP per 1,000 registered users (40%)

---

## 15. Open Questions & Risks

### Open Questions

| # | Question | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | **Should free users be able to submit challenges?** | A) No (Pro-only, strong upgrade driver) / B) 1 per month (taste, then gate) | **B** — Let them taste it once, then upsell |
| 2 | **Should we show anonymized peer pitch audio in challenges?** | A) No (privacy-first) / B) Opt-in after challenge ends | **B later** — Community voting is a powerful engagement loop but adds complexity. Ship without it first. |
| 3 | **How do we handle users in different time zones?** | A) Single global UTC reset / B) User-local reset | **A** — Simpler. Duolingo uses a single reset time. |
| 4 | **Should Game Mode use lightweight scoring (faster, cheaper)?** | A) Full analysis ($0.09) / B) Quick score only ($0.03) | **B** — Game mode is meant to be fast and frequent. Use Haiku for a quick score + 2-sentence feedback. Full analysis available on demand. |
| 5 | **How many scenarios do we need at launch?** | 50 / 100 / 200+ | **100+** — Enough that users won't see repeats for months in game mode |
| 6 | **Should we allow re-submissions in game mode?** | A) Same scenario, unlimited retries / B) New scenario each time | **Both** — Let users retry OR get a new one. Retrying the same scenario is great for deliberate practice. |
| 7 | **When should we add team/group competitions?** | Phase 4 / Post-launch / Never | **Post-launch** — Requires group management UX. Focus on individual competition first. |

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Low participation** — Users don't engage with challenges | High | Medium | Make first challenge mandatory in onboarding. Show leaderboard prominently on dashboard. |
| **Gaming/cheating** — Users read AI-generated scripts | Medium | Medium | Delivery metrics (natural speech patterns) + flagging system. Don't over-invest in anti-cheat at launch. |
| **Content staleness** — Scenarios feel repetitive | Medium | Low (if we generate enough) | Batch-generate 200+ scenarios. Add community submissions. Rotate themes. |
| **Toxic competition** — Users feel discouraged by rankings | Medium | Low | Matchmaking by skill level. Show personal improvement alongside rank. Emphasize "you improved 15 points!" not "you're #27." |
| **Cost scaling** — More pitches = more LLM cost | Low | Medium | Game mode uses Haiku (cheap). Challenges use existing pipeline. Monitor cost per WAP. |
| **Over-engineering leagues** — Building complex systems before validating demand | High | Medium | Phase 1 is just game mode + XP. Validate engagement before investing in leagues. |

---

## 16. Sources & References

### Legal & Copyright
- [FasterCapital — Copyright Protection For Pitch Deck Content](https://fastercapital.com/topics/copyright-protection-for-your-pitch-deck-content.html)
- [Romano Law — Copyright in Pitch Materials](https://www.romanolaw.com/copyright-in-pitch-materials-what-working-creatives-in-the-entertainment-industry-need-to-know/)
- [U.S. Copyright Office — Fair Use Index](https://www.copyright.gov/fair-use/)
- [University of Chicago — Fair Use and Educational Uses](https://www.lib.uchicago.edu/copyrightinfo/fairuse.html)
- [Nolo — Fair Use Rule](https://www.nolo.com/legal-encyclopedia/fair-use-rule-copyright-material-30100.html)

### Pitch Deck Databases
- [Pitch Deck Hunt (1,000+ decks)](https://www.pitchdeckhunt.com/)
- [AngelMatch (2,000+ decks)](https://angelmatch.io/pitch_decks)
- [BestPitchDeck.com](https://bestpitchdeck.com/)
- [Failory Pitch Deck Collection](https://www.failory.com/pitch-deck/series-a)
- [FoundEvo — 490 AI Pitch Decks](https://www.foundevo.com/490-ai-pitch-decks-vcs-said-yes-to/)
- [Shizune — YC Application Examples](https://shizune.co/yc-application-examples)

### Competitor Analysis
- [TechCrunch — Yoodli triples valuation to $300M+](https://techcrunch.com/2025/12/05/ex-googlers-yoodli-triples-valuation-to-300m-with-ai-built-to-assist-not-replace-people/)
- [Yoodli AI](https://yoodli.ai/)
- [Capterra — Orai Software](https://www.capterra.com/p/190231/Orai/)
- [UsefulAI — 5 Best AI Communication Coaches](https://usefulai.com/tools/ai-communication-coaches)
- [Hyperbound — Best Speech Coaching Apps](https://www.hyperbound.ai/blog/best-speech-coaching-apps)

### Gamification & Retention
- [Duolingo Blog — How Leaderboards Work](https://blog.duolingo.com/duolingo-leagues-leaderboards/)
- [Deconstructor of Fun — Duolingo's Gaming Principles](https://www.deconstructoroffun.com/blog/2025/4/14/duolingo-how-the-15b-app-uses-gaming-principles-to-supercharge-dau-growth)
- [Orizon — Duolingo's Gamification Secrets](https://www.orizon.co/blog/duolingos-gamification-secrets)
- [StriveCloud — Gamification Examples: Duolingo](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)
- [Trophy — Duolingo Gamification Case Study](https://trophy.so/blog/duolingo-gamification-case-study)
- [James Bickerton — Duolingo, Leaderboards, and Why Your Retention Sucks](https://jamesbickerton.substack.com/p/duolingo-leaderboards-and-why-your)
- [Growth-onomics — Mobile App Retention Benchmarks 2025](https://growth-onomics.com/mobile-app-retention-benchmarks-by-industry-2025/)
- [BuildWithToki — Mobile App Retention Strategies](https://www.buildwithtoki.com/blog-post/mobile-app-retention-strategies)

### Monetization
- [Adapty — Freemium App Monetization Strategies](https://adapty.io/blog/freemium-app-monetization-strategies/)
- [GrowthMentor — 25 Best Startup Pitch Competitions](https://www.growthmentor.com/blog/startup-pitch-competitions/)
- [Togwe — Fantasy Sports App Monetization Models](https://www.togwe.com/blog/fantasy-sports-app-monetization-models-which-one-works-best-in-2025/)

---

*Planning document authored 2026-03-03. Ready for founder review.*
