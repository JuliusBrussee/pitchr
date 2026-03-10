# Pitchr Launch Social Workflow (Tue–Fri, Launch Friday 2026-03-13)

## Scope
- Date window: **2026-03-10 (Tuesday) to 2026-03-13 (Friday)**, Europe/Amsterdam.
- Launch day: **Friday, 2026-03-13**.
- This file is the single operational source of truth for daily social workflow from today to Friday.

## 1) Current social media workflow summary (as of today)
- The current plan is already strong in cadence and theme structure:
  - Tue: decision-signal gap
  - Wed: testable claims
  - Thu: launch-readiness proof
  - Fri: launch execution
- It already contains three channels: business LinkedIn, founder LinkedIn, business Instagram.
- Existing good parts:
  - Clear daily cadence windows
  - Initial SLA for reply windows
  - End-of-day note-taking
- Main gaps:
  - Owner/approver ambiguity across some posts
  - Missing hard go-live lock for Friday launch posts
  - No universal fallback flow per founder/day
  - Unbalanced content depth (some posts are fully specified while others are placeholder-like)

## 2) Audit summary: keep, add, change, remove

### Keep
- Tue–Fri 4-day cadence to Friday launch.
- Channel split (business LinkedIn + founders + Instagram).
- Comment-first engagement posture (close each post with a practical question).
- End-of-day objections/response summary loop.

### Add
- Explicit role matrix on every post:
  - Draft Owner
  - Approver
  - Backup
  - Emergency Owner
- Hard Friday go-live gate based on release blockers.
- Dedicated fallback posts for any missing founder draft.
- Anti-overload rule: max one founder reply stream per question type and one response owner.
- Duplicate-prevention checklist (no over-repeating the same claim across channels).

### Change
- Move from implicit assumptions to explicit time windows and hard deadlines.
- Normalize naming (`business page`, `founder accounts`, `Instagram business`) everywhere.
- Tighten claim policy: use only internal/product-verified, testable claims.
- Standardize escalation and response routing.

### Remove
- Generic owner placeholders (“someone” or “pending”) and copy without assigned owner.
- “Launch now” language without evidence/verification.
- Any unverifiable claim language in templates.

## 3) Core operating model (all channels)

- Timezone for execution: **CEST**.
- Hard content deadline: **08:30 previous day for Monday-style blocking posts** (for Tue–Fri window use previous evening 18:30 prep), publish hard stop:
  - **10:00 CEST (Fri exception: all launch content preflight by 07:45)**
- Publish rhythm:
  - Business LinkedIn first (primary message)
  - Founders in staggered windows (to avoid overlap)
  - Instagram feed/stories republished within ~45 minutes
- Response priority:
  - 0–20 min: first 5 meaningful comments
  - 20–60 min: all direct questions
  - up to 120 min: high-intent DMs
- Go/no-go rule:
  - If launch-readiness is not confirmed on Friday, publish “quality update + revised timing” fallback for all launch-day claims.

## 4) Business LinkedIn workflow (Tue–Fri)

### Launch-go-live gate
- Baseline Friday gate (hard):
  - `yarn typecheck` green
  - `yarn test` green
  - e2e smoke check green
  - No unresolved **P0/P1** blockers
  - On-call owner + triage owner assigned
  - Waitlist/rewrite flow link verified
- If gate fails:
  - Do not publish launch announcement copy.
  - Replace with transparency post: what is complete, what is delayed, new estimated window.

#### Friday go-live check list (copy-ready)
- [ ] Readiness evidence packet posted in launch thread.
- [ ] P0/P1 triage board current.
- [ ] Support owner + response owner confirmed.
- [ ] Final business post and one fallback post approved.
- [ ] Access link (or alternate onboarding path) verified.

#### Hard-fail fallback for business post
- If any gate item is unresolved:
  - Remove “launch now” claims.
  - Publish “quality update + transparency + revised timeline” copy.
  - Keep the tone constructive and move all hype CTA to waitlist readiness CTA.

### Daily schedule and flow

| Date | Business-post window (CEST) | Publish owner | Approver | Backup | Precondition |
|---|---|---|---|---|---|
| 2026-03-10 (Tue) | 08:45–09:15 | Social lead | Product/ops lead | Founder support | Draft + one real scoring example + CTA mapped |
| 2026-03-11 (Wed) | 09:00–09:20 | Social lead | Content lead | Operations | Rewrite example ready |
| 2026-03-12 (Thu) | 08:30–09:00 | Social lead | Founder lead | Backup founder | Launch-readiness list validated |
| 2026-03-13 (Fri) | 07:45 pre-flight / 08:00 post / optional 11:00 pin | Founder lead | CEO / ops lead | Backup founder + social lead | Gate fully green + launch evidence packet posted |

### Tue 2026-03-10 — Decision-signal gap
- Hook: “Most founders get attention. Most don’t make a clear decision decision.”
- Focus: identify missing decision signal in opening line.
- Structure:
  1) Problem/decision framing
  2) 3 common missing signals
  3) Product tie-in (score + top fixes + rewrite route)
  4) Ask readers for one sentence
- CTA: “Drop the sentence that feels undecidable. I’ll give one precision rewrite.”
- Response playbook: reply to top 5 comments in first 20 minutes.

### Wed 2026-03-11 — Testable claims
- Hook: “A confident claim without a number is often just a wish.”
- Focus: one number, one unit, one timeframe.
- Structure:
  1) Weak claim example
  2) Rewrite formula
  3) Invite live rewrite challenge
- CTA: “Post one line. I’ll rewrite it in comments.”
- Response: one model rewrite in first comment within 30 minutes.

### Thu 2026-03-12 — One day to launch
- Hook: “One day to launch: less hype, more proof.”
- Focus: transparency updates (reliability improvements, readiness status).
- Structure:
  1) What changed in the last 24h
  2) What still has risk
  3) Invite top 3 fix list from audience
- CTA: “Comment your top 1 fix to get a quick prioritization."
- Response: creator-topic routing only (no generic comment spam).

### Fri 2026-03-13 — Launch day
- Hook: “Prepared 13 is launch-ready.”
- Focus: proof-first launch post + clear invite.
- Structure:
  1) Gate status line
  2) 5 bucket score snapshot
  3) Top 3 fixes, rewrite option
  4) clear first action
- CTA: “Comment your first optimization priority (structure, clarity, evidence, market, delivery).”
- Response: live response window 08:00–10:00, pin 11:00 follow-up.

## 5) Founder LinkedIn workflow (Julius, Lucas, Martino, Arav)

### Daily posting schedule (all days CEST)

| Date | Julius | Lucas | Martino | Arav |
|---|---|---|---|---|
| 2026-03-10 (Tue) | 09:20 | 09:40 | 10:00 | 10:20 |
| 2026-03-11 (Wed) | 09:20 | 09:40 | 10:00 | 10:20 |
| 2026-03-12 (Thu) | 09:20 | 09:40 | 10:00 | 10:20 |
| 2026-03-13 (Fri) | 09:20 | 09:40 | 10:00 | 10:20 |

- Hard fallback rule: if draft not published by 10:00, use approved bridge post within 15 minutes.
- Backup assignment:
  - Julius → Lucas
  - Lucas → Martino
  - Martino → Arav
  - Arav → Julius

### Role-to-tone guidance
- Julius (Builder): metrics-first, technical clarity, concise and precise.
- Lucas (Pitch Coach): structured framework style, methodical and coaching tone.
- Martino (Narrative): personal founder lessons and reflective language.
- Arav (Community): question-led, high engagement, sentiment reading.

### Comment ownership matrix
- Product/technical reliability questions → Julius
- Rubric/structure questions → Lucas
- Story + emotional tone questions → Martino
- Community sentiment + GTM questions → Arav
- Sensitive/factual/legal questions → Ops + founder approver
- SLA: 30–45 minutes for first reply by owner.

### Founder post opening prompts (ready-to-start lines)
- Tue: “Most pitches have a great idea and a weak decision line.”
- Wed: “A strong claim is one you can prove in one sentence.”
- Thu: “One day to launch means fewer changes, sharper tradeoffs.”
- Fri: “Prepared launch is about execution, not hype.”

## 6) Business Instagram workflow (feed + stories)

- Strategy: every LinkedIn post becomes one Instagram asset within 45 minutes.
- Caption formula (all days):
  1) hook
  2) problem signal
  3) simple rule
  4) one rewritten example
  5) one question CTA

### Tue 2026-03-10 — Claim proofing
- Feed: 4-slide carousel (weak claim vs rewritten claim).
- Stories: 3-card proof check.
- Feed time 08:45, stories 09:30.
- CTA: “Drop first two lines and one metric you can defend.”

### Wed 2026-03-11 — Teardown challenge
- Feed: quote card + 3-slide correction carousel.
- Stories: 4-card anonymous teardown.
- Feed time 12:00, stories 12:30 and 20:00.
- CTA: “Drop one sentence and I’ll rewrite it.”

### Thu 2026-03-12 — Readiness proof
- Feed: 5-slide checklist and reliability updates.
- Stories: readiness ladder + blocker collector.
- Feed time 09:00, stories 09:20 and 18:00.
- CTA: “Comment your top 1 deadline blocker.”

### Fri 2026-03-13 — Launch day
- Feed: 4-slide value stack (score + fixes + rewrite + next step).
- Optional reel: 15–25s quick launch loop.
- Stories: launch loop, proof stack, priority poll.
- Feed time 08:00, stories 08:15 and 17:30.
- CTA: “Comment your first 3 edits and get a rewrite path.”

## 7) Pre-produced posts by day and channel

Tone guideline: founder-authentic, practical, concise, and non-hype.  
Compliance caveat: no competitor attacks, no unverifiable outcomes, no funding/revenue guarantees.

### Tue 2026-03-10

#### Business LinkedIn
`A strong opener gets attention. A clear decision signal gets replies.`  
Most pitch feedback stalls after attention because the ask is unclear.  
Pitchr scores in five areas and gives ranked fixes so founders can revise fast.  
Reply with your opening line + one metric you can defend. I’ll help you tighten one line.

Hashtags: `#Pitchr #FounderAdvice #PitchDeck #InvestorReadiness #PitchCoaching #Startup`

#### Founder LinkedIn
- **Julius:** “Most founders lose momentum in the first 30 seconds. The gap is usually the decision signal.”
- **Lucas:** “If a founder says ‘we’re better,’ the first question should be: better by what measurable signal?”
- **Martino:** “I used to think we needed pitch polish first. The bigger gap is usually proof + ask clarity.”
- **Arav:** “Most pitches don’t fail because they’re vague. They fail because the ask isn’t easy to act on.”

All four founder posts end with: “Comment one opening line and I’ll give one practical rewrite.”

#### Business Instagram
- Feed caption: “Your pitch doesn’t need perfection. It needs one clear decision line.”  
CTA: “Drop your first line + one number in comments.”
- Story set: weak/strong line poll, rewrite prompt, rewrite card, CTA sticker.
Hashtags: `#Pitchr #StartupFounder #PitchDeck #FounderTips #BuildInPublic`

### Wed 2026-03-11

#### Business LinkedIn
“Confident claim is easy. Testable claim is what builds trust.”  
Use this rule on your next sentence: one number + one unit + one timeframe.  
Comment one sentence from your current pitch and I’ll rewrite it in the comments.

Hashtags: `#Pitchr #PitchDeck #TestableClaims #FounderGrowth #Pitching`

#### Founder LinkedIn
- **Julius:** “Treat your pitch like a draft: one claim, one measurable signal, one rewrite.”
- **Lucas:** “Good feedback is specific. If a claim can’t be disproved, it isn’t useful yet.”
- **Martino:** “Storytelling is strong when each sentence earns a decision.”
- **Arav:** “What helps communities is clarity with an action line, not hype.”

All founder posts end with one line challenge + offer rewrite.

#### Business Instagram
- Feed caption: “A claim without proof is just a wish.” + one-number rule.
- Story set: “Paste a line,” “what hurts,” “fix pattern,” “comment one line.”
Hashtags: `#Pitchr #PitchCoach #Pitching #TestableClaims #StartupCommunication`

### Thu 2026-03-12

#### Business LinkedIn
“One day to launch. Less perfection, more proof.”  
Here’s what changed since Tue: clearer evidence checks, better rewrite priority, and cleaner opening structure.  
Comment your top 1 fix you still need before your own launch.

Hashtags: `#Pitchr #ProductLaunch #FounderExecution #PitchReadiness #StartupGrowth`

#### Founder LinkedIn
- **Julius:** “Tomorrow is launch. Today is reducing uncertainty.”
- **Lucas:** “Launch should be about clear execution, not hype.”
- **Martino:** “If your pitch is strong on vision but weak on proof, trim the claims and keep the structure.”
- **Arav:** “What part of your pitch is still a bottleneck right now?”

All founder posts include: “Comment your top 3 fixes and get prioritized help.”

#### Business Instagram
- Feed caption: “Launch week wins come from trustworthy updates, not over-polished slides.”
- Story set: readiness ladder, red/amber/green blocker tracker, top blocker comment request.
Hashtags: `#Pitchr #LaunchWeek #StartupLaunch #PitchPrep #Founders`

### Fri 2026-03-13 (Launch Day)

#### Business LinkedIn
“Prepared 13 is launch-ready.”  
Today’s launch post is simple: score snapshot (5 buckets), top 3 fixes, immediate rewrite route.  
Comment your current focus area and we’ll share a practical first-step rewrite sequence.

Hashtags: `#Pitchr #LaunchDay #PitchDeck #FounderTools #InvestorReadiness #Pitching`

#### Founder LinkedIn
- **Julius:** “Launch is live with a focus on actionable improvements. No fluff—just repeatable loops.”
- **Lucas:** “If you want practical progress, start with one run, one fix, one rewrite.”
- **Martino:** “A launch is execution, not a marketing event. Comment your highest-pressure ask.”
- **Arav:** “If your pitch matters this quarter, we can help you improve the next sentence today.”

#### Business Instagram
- Feed caption: “Launch day: we move from announcement to execution. Run, score, rewrite, improve.”
- Story set: launch proof, 1-minute rewrite challenge, poll (structure / evidence / ask), top comment roundup.
Hashtags: `#Pitchr #LaunchDay #FounderTools #PitchFeedback #PitchDeck #StartupMomentum`

## 8) End-of-day wrap and quality checks
- Capture:
  - top 3 objections
  - top 3 founder replies
  - 2–3 content variants to repurpose
  - any blocked posts and reason
- Success checks:
  - comments-to-responses ratio
  - response SLA compliance
  - fallback usage
  - first 30-minute launch sentiment trend
