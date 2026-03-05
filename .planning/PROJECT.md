# Pitchr Hackathon Mode

## What This Is

This project extends Pitchr with a new hackathon-specific pitch feedback mode. It builds a verified corpus of winning hackathon pitches (all user-provided links plus 20 additional global winning examples), transcribes them, extracts common winning themes, and applies those patterns to scoring and coaching. The output should diagnose what is weak in a user's hackathon pitch and prescribe concrete fixes aligned with proven winning patterns.

## Core Value

Given a hackathon pitch, the system identifies what is weak against winner-derived standards and tells the user exactly how to improve it.

## Requirements

### Validated

- [x] Users can submit pitches and receive structured LLM feedback with rubric breakdowns and prioritized fixes - existing
- [x] Multiple pitch modes are supported through shared mode configuration and mode-specific prompts (`elevator`, `vc_pitch`) - existing
- [x] A Q&A output (`qa_1min`) is generated and supported in regeneration flows - existing
- [x] Live session capture, transcription, delivery metrics, and results pages are already implemented - existing

### Active

- [ ] Build a verified winning-pitch corpus containing all uploaded links and 20 additional globally sourced hackathon-winning pitch links
- [ ] Verify each link as a legitimate winning-pitch source and track provenance
- [ ] Transcribe every verified corpus item and store transcripts for downstream analysis
- [ ] Analyze all transcripts to extract common winning patterns and anti-patterns for hackathon judging contexts
- [ ] Define and integrate a new `hackathon` project type that follows existing elevator/VC judge-agent structure
- [ ] Deliver hackathon-specific feedback that pinpoints weak rubric dimensions and recommends fixes grounded in winning-pattern evidence
- [ ] Include hackathon Q&A bot support in parity with the current `qa_1min` flow
- [ ] Map and document step-by-step how the hackathon flow follows and extends existing pitch feedback flows

### Out of Scope

- Building feedback logic from unverified or non-winning pitch examples - lowers signal quality
- Creating a separate product outside the existing Pitchr architecture - this work is an in-product mode extension
- Expanding to non-hackathon pitch categories in this milestone - focus is hackathon-only

## Context

Pitchr already supports elevator and VC pitch feedback with shared analysis orchestration (`prepAgentService` -> `judgeAgentService` -> scoring), mode configuration (`config/modes.ts`), and Q&A generation (`qa_1min`). The new mode should reuse this architecture rather than creating parallel systems. Existing codebase artifacts in `.planning/codebase/` provide architecture and stack baselines for implementation choices.

## Constraints

- **Execution Model**: Implement on a new git branch - requested workflow for this initiative
- **Data Quality**: Corpus must include only verified hackathon-winning pitch sources - v1 definition requires verification before transcription
- **Parity Constraint**: Hackathon flow must follow existing elevator/VC feedback structure - consistency with proven system behavior
- **Q&A Requirement**: Hackathon mode must include Q&A bot behavior similar to existing `qa_1min` output
- **Completion Bar**: v1 is complete only when all uploaded links and all newly found links are verified and transcribed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use winner-only corpus as rubric foundation | Reduce noise and anchor feedback to proven judging outcomes | - Pending |
| Reuse existing elevator/VC judge-agent architecture for hackathon mode | Faster delivery, lower regression risk, keeps behavior consistent across modes | - Pending |
| Require Q&A support in hackathon mode from v1 | User explicitly wants parity with current pitch feedback flows | - Pending |
| Define v1 "done" as full verification + transcription coverage | Prevent partial dataset launch and ensure reliable analysis quality | - Pending |

---
*Last updated: 2026-03-05 after initialization*
