# Feature Research

**Domain:** Hackathon pitch feedback mode for an existing elevator/VC pitch coaching product
**Researched:** 2026-03-05
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hackathon rubric scoring + gap diagnosis | ETHGlobal and HackHarvard publish explicit multi-criterion judging rubrics; Devpost also expects clear criteria for judging. | MEDIUM | Map event criteria to a normalized schema, then return per-criterion scores plus top fixes. |
| Submission readiness and compliance checks | Devpost and ETHGlobal require specific submission assets (public demo video, repo, description, category selection) and strict deadlines. | MEDIUM | Validate required links, video constraints, visibility, and missing fields before final submit. |
| Demo narrative coach (2-4 minute format) | ETHGlobal requires a short demo video, and Devpost emphasizes a clear opening elevator pitch and product demo. | MEDIUM | Score for problem clarity, solution clarity, product-in-action proof, and pacing. |
| Finalist pitch + Q&A simulator | ETHGlobal finalist format includes timed demo and judge Q&A. | HIGH | Simulate timed rounds and score concise answers to common judge questions. |
| Track/prize alignment helper | Major hackathons use partner tracks and require explicit track selection and fit statements. | MEDIUM | Recommend best-fit tracks and generate track-specific evidence prompts. |
| Iterative rehearsal loop with delta tracking | Teams iterate quickly before deadlines and need to know what improved vs what regressed per attempt. | MEDIUM | Compare attempt N to N+1 by rubric dimension and prioritize the next highest-ROI fix. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Winner-corpus evidence engine | Feedback is grounded in patterns from verified winning hackathon pitches, not generic speaking advice. | HIGH | Requires verified corpus, transcription quality, and pattern extraction with citation traces. |
| Event-rule ingestion from URL/PDF | Adapts coaching to a specific hackathon's rules, rubric names, and submission constraints. | MEDIUM | Parse rules into structured config with a human-review checkpoint. |
| Multi-judge persona simulation (technical, UX, sponsor) | Better prepares teams for mixed judging contexts and async-plus-live evaluation flows. | HIGH | Use persona-specific prompts and output disagreement analysis with consensus advice. |
| Build integrity + AI attribution auditor | Reduces disqualification risk from unclear build history or undocumented AI usage. | MEDIUM | Check commit timeline consistency and AI usage disclosure completeness. |
| Submission packet autoprep | Compresses final-hour prep into one package: final script, checklist, submission text, and links. | MEDIUM | Generate event-ready copy for fields commonly required in submission portals. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| VC-first default coaching inside hackathon mode | Existing users are familiar with investor-style pitch structures. | MLH explicitly distinguishes hackathons from startup contests and advises judges to avoid business-first framing. | Keep commercialization prompts optional and off by default in hackathon mode. |
| Single opaque "overall score" only | Teams want a quick rank number. | Hackathon judging is multi-criterion; one score hides actionable weaknesses and creates poor iteration guidance. | Always show per-criterion scores, evidence, and top fixes. |
| Fully auto-generated pitch/video/deck output | Teams want speed near deadline. | ETHGlobal rules require meaningful participant contribution and transparent AI use; over-automation increases risk and hurts live Q&A readiness. | AI-assisted drafting and coaching with human-delivered final presentation. |
| Presentation polish over working proof | Teams believe slick storytelling can compensate for product gaps. | Common judging criteria heavily include technicality, functionality, and practicality. | Gate polish features behind a "working demo proven" check. |
| Always-on background meeting monitoring | Users ask for passive continuous coaching. | Creates privacy/trust friction and is unnecessary for focused hackathon prep workflows. | Use explicit opt-in rehearsal sessions with clear recording controls. |

## Feature Dependencies

```
[Event Rules Ingestion]
  -> requires -> [Rubric Mapper]
  -> requires -> [Submission Compliance Checker]

[Rubric Mapper]
  -> enables -> [Rubric Gap Diagnosis]
  -> enables -> [Prioritized Fix Plan]

[Demo Transcript + Timing Analysis]
  -> enables -> [Demo Narrative Coach]
  -> required for -> [Q&A Simulator]

[Track/Prize Metadata]
  -> required for -> [Track Selection Helper]

[Verified Winner Corpus]
  -> required for -> [Winner-Corpus Evidence Engine]

[VC-Style Investor Coaching Defaults]
  -> conflicts -> [Hackathon Mode Defaults]
```

### Dependency Notes

- **Event Rules Ingestion requires Rubric Mapper:** Raw rules text must be normalized before scoring/coaching can be consistent.
- **Rubric Mapper enables Rubric Gap Diagnosis:** Without mapped criteria, there is no reliable per-dimension weakness detection.
- **Demo Transcript + Timing Analysis enables Demo Narrative Coach:** Narrative and pacing feedback require transcript and timing signals.
- **Demo Narrative Coach is required for Q&A Simulator:** The simulator should target weak narrative areas found in demo analysis.
- **Track/Prize Metadata is required for Track Selection Helper:** Prize-fit recommendations depend on up-to-date track definitions.
- **Verified Winner Corpus is required for Winner-Corpus Evidence Engine:** Evidence-grounded coaching fails without verified high-signal examples.
- **VC-style defaults conflict with Hackathon defaults:** Conflicting objective functions produce inconsistent guidance.

## MVP Definition

### Launch With (v1)

Minimum viable product - what is needed to validate hackathon mode.

- [ ] Hackathon rubric scoring + gap diagnosis - core value anchor for judging-aligned feedback.
- [ ] Submission readiness and compliance checks - prevents avoidable disqualification and submission errors.
- [ ] Demo narrative coach (2-4 minute format) - directly improves the most visible judging artifact.
- [ ] Finalist pitch + Q&A simulator - covers live judging pressure scenario.
- [ ] Iterative rehearsal loop with delta tracking - supports fast pre-deadline improvement.

### Add After Validation (v1.x)

Features to add once core flow is proven.

- [ ] Track/prize alignment helper - add once baseline scoring quality is trusted.
- [ ] Event-rule ingestion from URL/PDF - add when demand for event-specific adaptation is confirmed.
- [ ] Submission packet autoprep - add when teams ask for final-hour workflow acceleration.

### Future Consideration (v2+)

Features to defer until mode maturity.

- [ ] Winner-corpus evidence engine - highest upside, but depends on corpus quality and provenance workflows.
- [ ] Multi-judge persona simulation - valuable but model-intensive and best after baseline mode stability.
- [ ] Build integrity + AI attribution auditor - high trust value, but broader implementation surface.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hackathon rubric scoring + gap diagnosis | HIGH | MEDIUM | P1 |
| Submission readiness and compliance checks | HIGH | MEDIUM | P1 |
| Demo narrative coach (2-4 minute format) | HIGH | MEDIUM | P1 |
| Finalist pitch + Q&A simulator | HIGH | HIGH | P1 |
| Iterative rehearsal loop with delta tracking | HIGH | MEDIUM | P1 |
| Track/prize alignment helper | MEDIUM | MEDIUM | P2 |
| Event-rule ingestion from URL/PDF | MEDIUM | MEDIUM | P2 |
| Submission packet autoprep | MEDIUM | MEDIUM | P2 |
| Winner-corpus evidence engine | HIGH | HIGH | P3 |
| Multi-judge persona simulation | MEDIUM | HIGH | P3 |
| Build integrity + AI attribution auditor | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Yoodli | Orai | Our Approach |
|---------|--------|------|--------------|
| Real-time speaking analytics | Yes (pitch practice, real-time/private feedback) | Yes (filler words, pace, confidence, transcript) | Yes, but tied to hackathon judging dimensions. |
| Hackathon rubric alignment | No explicit event-rubric mapping in core docs | No | Yes, event-specific and criteria-driven. |
| Submission compliance checks (rules, links, video constraints) | No | No | Yes, first-class readiness checks. |
| Timed finalist Q&A simulation | Partial (pitch practice with follow-up questions) | No | Yes, aligned to finalist judging formats. |
| Evidence from winning hackathon corpus | No | No | Yes, planned differentiator. |

## Sources

- `C:\dev\pitchr\.planning\PROJECT.md` (project scope and constraints)
- Devpost Help - Judging and public voting (official criteria/weighting guidance): https://help.devpost.com/article/64-judging-public-voting
- Devpost Help - Submission period setup (required fields, video, visibility): https://help.devpost.com/article/145-how-do-i-set-up-the-submission-period
- Devpost Help - Video-making best practices: https://help.devpost.com/article/84-video-making-best-practices
- Devpost Blog - Submission and judging criteria guide: https://info.devpost.com/blog/understanding-hackathon-submission-and-judging-criteria
- ETHGlobal ETHOnline 2025 Start (process, criteria overview): https://ethglobal.com/events/ethonline2025/info/start
- ETHGlobal ETHOnline 2025 Details (timings, rules, rubric, Q&A format): https://ethglobal.com/events/ethonline2025/info/details
- MLH Hackathon Organizer Guide - Judging Plan: https://guide.mlh.io/general-information/judging-and-submissions/judging-plan
- MLH Hackathon Organizer Guide - Judges Communication and Recruiting: https://guide.mlh.io/general-information/judging-and-submissions/judges-communication-and-recruiting
- MLH Hackathon Organizer Guide - Hackathon Submission Portal: https://guide.mlh.io/general-information/judging-and-submissions/hackathon-submission-portal
- HackHarvard Handbook - Judging Criteria: https://info.hhuh.io/rules/judging_criteria/
- Yoodli Support - Overview: https://support.yoodli.ai/en/articles/9550461-yoodli-overview
- Orai App Store listing (feature set): https://apps.apple.com/us/app/orai-improve-public-speaking/id1203178170

---
*Feature research for: Hackathon pitch feedback mode*
*Researched: 2026-03-05*
