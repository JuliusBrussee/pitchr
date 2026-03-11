# Pitch Prompts And Workflows Reference

This file captures the current analysis prompt setup and workflow behavior for:
- `two_min_pitch` (2-minute VC pitch)
- `elevator_pitch` (30-second elevator pitch)

All paths and line references below reflect the current code in this repository.

## 1) Active System Prompts (Edge `pitch-run` Path)

Source:
- [analysis-profiles.ts#L20](C:/dev/pitchr/supabase/functions/_shared/analysis-profiles.ts#L20)
- [analysis-profiles.ts#L80](C:/dev/pitchr/supabase/functions/_shared/analysis-profiles.ts#L80)
- [analysis-profiles.ts#L101](C:/dev/pitchr/supabase/functions/_shared/analysis-profiles.ts#L101)

### 2-Minute Pitch (`two_min_pitch`)

```text
You are a startup pitch coach and investor evaluator.

Your job is to help founders improve quickly with direct, practical feedback.
Focus on what they should change next, not abstract commentary.

Feedback quality rules:
- Be specific and actionable.
- Prefer short, plain language.
- One clear action per fix.
- Avoid generic advice (for example: "be more confident").
- Tie each fix to where it appears in the pitch (opening hook, problem statement, solution, traction, market, ask/close, delivery language).
- Prioritize by impact on investor decision-making.

Output rules:
- Return valid JSON only.
- Do not use markdown.
- Do not include explanation text outside JSON.
- Follow the requested schema exactly (field names and value types must match).
```

### Elevator Pitch (`elevator_pitch`)

```text
You are a startup pitch coach and investor evaluator.

Your job is to help founders improve quickly with direct, practical feedback.
Focus on what they should change next, not abstract commentary.

Feedback quality rules:
- Be specific and actionable.
- Prefer short, plain language.
- One clear action per fix.
- Avoid generic advice (for example: "be more confident").
- Tie each fix to where it appears in the pitch (opening hook, problem statement, solution, traction, market, ask/close, delivery language).
- Prioritize by impact on investor decision-making.

Output rules:
- Return valid JSON only.
- Do not use markdown.
- Do not include explanation text outside JSON.
- Follow the requested schema exactly (field names and value types must match).

You are judging a 30-second elevator pitch where investors expect immediate clarity.
Use a skeptical investor lens: unclear business definition, vague traction, weak differentiation, and incomplete ask details must be penalized heavily.
```

## 2) Runtime Override (Applies To Both)

Even with the defaults above, both prompt profiles can be overridden per project by:
- `project.prompt_overrides.analysis_system_prompt`

References:
- [pitch-run/index.ts#L169](C:/dev/pitchr/supabase/functions/pitch-run/index.ts#L169)
- [types/project.ts#L5](C:/dev/pitchr/types/project.ts#L5)
- [analysis-service.ts#L559](C:/dev/pitchr/supabase/functions/_shared/analysis-service.ts#L559)

Resolution logic in analysis:
- `systemPromptOverride?.trim() || profile.systemPrompt`

## 3) Workflow Comparison (2-Minute vs Elevator)

The pipeline is structurally the same. The behavior differences come from selected profile content (system prompt, rubric, mode config, scoring guidance, transcript rules).

### Shared flow

1. Session submits run request:
- [session/page.tsx#L311](C:/dev/pitchr/app/(app)/session/page.tsx#L311)
- [usePitchRun.ts#L44](C:/dev/pitchr/hooks/usePitchRun.ts#L44)

2. Edge function validates payload, resolves project, enforces project mode:
- [pitch-run/index.ts#L149](C:/dev/pitchr/supabase/functions/pitch-run/index.ts#L149)
- [pitch-run/index.ts#L168](C:/dev/pitchr/supabase/functions/pitch-run/index.ts#L168)

3. Profile selected by project type/mode:
- [analysis-service.ts#L556](C:/dev/pitchr/supabase/functions/_shared/analysis-service.ts#L556)
- [analysis-profiles.ts#L130](C:/dev/pitchr/supabase/functions/_shared/analysis-profiles.ts#L130)

4. Model execution:
- Primary Claude (`claude-sonnet-4-20250514`): [analysis-service.ts#L271](C:/dev/pitchr/supabase/functions/_shared/analysis-service.ts#L271)
- Fallback Gemini (`gemini-3-flash`): [analysis-service.ts#L346](C:/dev/pitchr/supabase/functions/_shared/analysis-service.ts#L346)

5. Output normalization and persistence:
- [analysis-service.ts#L432](C:/dev/pitchr/supabase/functions/_shared/analysis-service.ts#L432)
- [analysis-service.ts#L576](C:/dev/pitchr/supabase/functions/_shared/analysis-service.ts#L576)
- [pitch-run/index.ts#L237](C:/dev/pitchr/supabase/functions/pitch-run/index.ts#L237)

6. Results fetch and render:
- [results/[runId]/page.tsx#L375](C:/dev/pitchr/app/(app)/results/[runId]/page.tsx#L375)
- [pitch-run-detail/index.ts#L14](C:/dev/pitchr/supabase/functions/pitch-run-detail/index.ts#L14)
- [run-service.ts#L230](C:/dev/pitchr/supabase/functions/_shared/run-service.ts#L230)

### Key mode mapping differences

- 2-minute pitch uses `two_min_pitch -> vc_pitch`:
  - [project-config.ts#L12](C:/dev/pitchr/supabase/functions/_shared/project-config.ts#L12)
- Elevator pitch uses `elevator_pitch -> elevator`:
  - [session/page.tsx#L66](C:/dev/pitchr/app/(app)/session/page.tsx#L66)

## 4) Exact Profile Differences (`two_min_pitch` vs `elevator_pitch`)

Source:
- [analysis-profiles.ts#L80](C:/dev/pitchr/supabase/functions/_shared/analysis-profiles.ts#L80)
- [analysis-profiles.ts#L101](C:/dev/pitchr/supabase/functions/_shared/analysis-profiles.ts#L101)

### `projectType`
- 2-minute: `two_min_pitch`
- elevator: `elevator_pitch`

### `workflowMode`
- 2-minute: `vc_pitch`
- elevator: `elevator`

### `systemPrompt`
- 2-minute: `COMMON_SYSTEM_PROMPT` only
- elevator: `COMMON_SYSTEM_PROMPT` plus extra 30-second strictness lines

### `rubricText`
- 2-minute (`VC_RUBRIC_TEXT`):
  - Structure criteria uses `Problem -> Solution -> Why Now -> Traction -> Ask`
  - Clarity focuses on concise language and reduced jargon
  - Evidence rewards concrete metrics broadly (users/revenue/growth/pilots/customers)
  - Market expects TAM/SAM, competitors, and moat
  - Delivery evaluates pace/fillers/repetition/time-limit adherence
- elevator (`ELEVATOR_RUBRIC_TEXT`):
  - Structure criteria uses `One-liner -> Problem -> Solution -> Proof -> Ask`
  - Clarity expects investor understanding within first 8 seconds
  - Evidence requires metric + timeframe + denominator
  - Market requires clear buyer, alternative, and edge
  - Delivery penalizes overrun/rush/filler/repetition for 30-second window

### `modeConfig`
- 2-minute:
  - `label: VC Pitch`
  - `targetDurationSeconds: 120`
  - `targetWpm: 140`
  - `structureBeats: ['Problem', 'Solution', 'Why Now', 'Traction', 'Market', 'Ask']`
- elevator:
  - `label: Elevator Pitch`
  - `targetDurationSeconds: 30`
  - `targetWpm: 165`
  - `structureBeats: ['One-liner', 'Problem', 'Solution', 'Proof', 'Ask']`

### `scoringGuidance`
- 2-minute (3 items):
  - Harsh 80+ threshold (rare; needs clear proof/ask/differentiation)
  - Aggressive penalties for vague language
  - Benchmark against YC top-decile fundraising quality
- elevator (5 items):
  - Missing proof/unclear company definition/incomplete ask caps scores
  - Vague traction penalized unless metric + timeframe + denominator
  - Penalize unclear differentiation vs alternatives
  - Reward crisp asks with amount + instrument/equity + fund use
  - Penalize verbosity in 30-second mode

### `transcriptRules`
- 2-minute (2 items):
  - Score founder content, not audience chatter
  - Extract founder signal when transcript includes unrelated discussion
- elevator (3 items):
  - Ignore panel commentary after founder pitch
  - Prioritize founder opening + ask when mixed segments appear
  - Do not let positive panel sentiment offset missing founder evidence

## 5) Related/Legacy Prompt Path (Context)

There is also a non-edge/local path using `JUDGE_SYSTEM_PROMPT`:
- [lib/prompts/judge.ts#L27](C:/dev/pitchr/lib/prompts/judge.ts#L27)
- [services/judgeAgentService.ts#L257](C:/dev/pitchr/services/judgeAgentService.ts#L257)

Current session/results UI flow uses the edge `pitch-run` route described above.
