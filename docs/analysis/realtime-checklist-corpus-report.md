# Realtime Checklist Corpus Report

Date: 2026-02-21  
Corpus: `pitch backend/*.txt` (25 files)

## Tooling
- Installed skill: `content-analysis` from `liangdabiao/claude-data-analysis-ultra-main`.
- Skill modules used:
  - `scripts/text_analyzer.py` for tokenization, keyword extraction, clustering, similarity.
- Output was combined with checklist-specific beat extraction to produce implementation-ready checklist definitions.

## Corpus Snapshot
- Files analyzed: 25
- Word count distribution:
  - min: 269
  - max: 14520
  - median: 718
  - avg: 1815.6

## Theme Coverage (Checklist-Oriented)
- `intro_hook`: 96.0%
- `problem_statement`: 64.0%
- `solution_overview`: 64.0%
- `market_opportunity`: 88.0%
- `business_model`: 36.0%
- `traction_metrics`: 84.0%
- `team`: 84.0%
- `ask`: 88.0%

## Pattern and Trend Notes
- Dominant pitch arc observed: problem -> solution -> traction -> market -> team -> ask.
- Most robust recurring signals across files:
  - market sizing terms (`market`, `million`, `billion`)
  - traction terms (`growth`, `revenue`, `run rate`, `%`)
  - founder/team credibility terms (`founder`, `CEO`, `CTO`)
  - close/CTA language (`thank you`, `raising`, `funding`, `join us`)
- Business model language is less frequent, so this item remains important for live coverage checks.

## Similarity Highlights (Against Canonical Arc Query)
Query used: `problem solution traction market team ask`

Top similar files:
1. `[500 STARTUPS DEMO DAY 2016] BATCH 17, Visiblee.txt` (0.2195)
2. `Digital Sex Therapy  Blueheart Demo Day Pitch  Antler UK.txt` (0.1210)
3. `The 60-Second Pitch That Raised $3M After Y Combinator Demo Day.txt` (0.0898)
4. `[500 STARTUPS DEMO DAY 2016] BATCH 17, Tallyfy.txt` (0.0655)
5. `[500 STARTUPS DEMO DAY 2016] BATCH 17, SidelineSwap.txt` (0.0606)

## Checklist Seeding Decision
The static checklist used in realtime implementation is:
1. `intro_hook`
2. `problem_statement`
3. `solution_overview`
4. `market_opportunity`
5. `business_model`
6. `traction_metrics`
7. `team`
8. `ask`

Mode defaults:
- `elevator`: `intro_hook`, `problem_statement`, `solution_overview`, `market_opportunity`, `ask`
- `vc_pitch`: all 8 items

## Implementation Notes
- Realtime evaluation uses semantic checks via OpenRouter plus heuristic fallback.
- Status progression is monotonic to avoid regressions during streaming:
  - `uncovered -> partial -> completed`
- Transcript tail windowing is used for semantic calls to control latency and token usage.
