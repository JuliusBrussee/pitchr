# Pitchr Deep Dive: Claude Usage, Prompt Flow, Outputs, Scoring, ElevenLabs Q&A, and Transcription

Last updated: 2026-02-22

## 1. Scope and Intent

This document maps the current implementation (not just PRD intent) for:

- How Claude is used in this codebase.
- Which system prompts are active, where they are injected, and what each call expects.
- How outputs are generated field-by-field.
- How scoring is computed deterministically.
- How analysis output is linked into the ElevenLabs live Q&A bot.
- How transcription works end-to-end.
- Where token budgets are defined and what is actually measured vs only capped.

## 2. Current Runtime Architecture

Main runtime path for pitch analysis:

1. `app/(app)/session/page.tsx` captures audio + transcript segments via `hooks/useSTT.ts`.
2. Session stops, transcript is finalized, and `hooks/usePitchRun.ts` posts to `POST /api/pitch/run`.
3. `controllers/pitchController.ts` validates input, inserts run as `queued`, enqueues async job.
4. `services/pitchRunQueueService.ts` moves run to `running`, calls `services/analysisService.ts`.
5. `services/analysisService.ts`:
   - builds deterministic context (`services/prepAgentService.ts`)
   - calls judge LLM (`services/judgeAgentService.ts`)
   - applies deterministic delivery + penalties (`services/scoringService.ts`)
   - enriches section feedback, rewrite diff, vocab events, historical links
   - returns v2 analysis payload
6. Queue service updates run to `complete` or `failed` in Supabase.
7. Results page (`app/(app)/results/[runId]/page.tsx`) polls run API until terminal status.

Live Q&A path:

1. Results page action opens `/qa/[runId]`.
2. Page calls `POST /api/qna/session`.
3. API builds starter context from analysis output and creates ElevenLabs signed URL.
4. Browser hook `hooks/useLiveQaAgent.ts` streams mic audio to ElevenLabs ConvAI via signed websocket.
5. Session turns/transcript are persisted through `POST /api/qna/session/[qaSessionId]/complete`.

## 3. Where Claude Is Used (Actual Code Paths)

All LLM routing goes through `lib/llm/router.ts`, which chooses provider by `LLM_PROVIDER`:

- default: `anthropic`
- alternate: `openrouter`

Anthropic transport:

- `lib/llm/providers/anthropic.ts`
- endpoint: `https://api.anthropic.com/v1/messages`
- default model: `claude-sonnet-4-6`

OpenRouter transport:

- `lib/llm/providers/openrouter.ts`
- endpoint: `https://openrouter.ai/api/v1/chat/completions`
- default model: `anthropic/claude-sonnet-4.6` (still Claude via OpenRouter)

### Active Claude-dependent features

1. Pitch judge agent:
   - `services/judgeAgentService.ts`
   - prompt: `lib/prompts/judge.ts`
2. Realtime checklist semantic evaluator:
   - `services/realtimeChecklistService.ts`
   - prompt: `lib/prompts/realtimeChecklist.ts`
3. Coach question and coach feedback in STT backend:
   - `lib/llm/feedbackQA.ts`
4. Pitch coach Q&A helper (standalone helper function):
   - `lib/llm/pitchCoach.ts`
5. Deck generation and repair:
   - `services/deckGenerationService.ts`
   - prompt: `lib/prompts/deckGeneration.ts`

### Prompt files present but not wired into current pitch-analysis runtime

- `lib/prompts/system.ts`
- `lib/prompts/rubric.ts`
- `lib/prompts/rewrite.ts`
These exist but are not imported by the active `analysisService -> judgeAgentService` path.

## 4. System Prompts and Prompt Injection

## 4.1 Judge Agent (core run analysis)

Files:

- system prompt: `lib/prompts/judge.ts` (`JUDGE_SYSTEM_PROMPT`)
- user prompt builder: `lib/prompts/judge.ts` (`buildJudgeUserPrompt`)
- caller: `services/judgeAgentService.ts`

System prompt responsibilities:

- enforce strict JSON-only output
- enforce harsh YC top-decile grading
- clarify that delivery is overwritten by deterministic local scoring

User prompt responsibilities:

- embeds rubric text (spoken + deck rubrics)
- embeds compact deterministic context (beats, anti-patterns, delivery summary, stage expectations, benchmarks)
- embeds transcript + deck text
- embeds explicit rules and full response schema

Hard prompt-size control:

- `MAX_PROMPT_CHARS = 9000` with progressive clipping strategy in `buildJudgeUserPrompt`.
- clipping order:
  1. reduce transcript/deck sizes
  2. drop pattern text
  3. reduce pattern count
  4. remove benchmark block
  5. clip again aggressively

Call settings (`services/judgeAgentService.ts`):

- `responseFormat: 'json'`
- `temperature: 0.2`
- `maxTokens: 2000`
- `timeoutMs: 45000`
- `maxAttempts: 1` (router-level field; see retry notes in section 6)

## 4.2 Realtime Checklist LLM

Files:

- system prompt: `services/realtimeChecklistService.ts` (`CHECKLIST_LLM_SYSTEM_PROMPT`)
- user prompt builder: `lib/prompts/realtimeChecklist.ts`

System prompt:

- short JSON-only instruction: "expert startup pitch coach"

User prompt:

- injects mode, elapsed seconds, checklist item definitions, previous state, transcript tail, response schema

Context pruning:

- transcript tail limited to last `750` words (`TAIL_WORD_LIMIT`)

Call settings:

- `responseFormat: 'json'`
- `temperature: 0.3`
- `maxTokens: 1200`
- `timeoutMs: 20000`

Fallback behavior:

- if LLM call or parse fails, falls back to deterministic heuristic checklist evaluation.

## 4.3 Coach Question and Feedback (STT backend side feature)

File: `lib/llm/feedbackQA.ts`

- Question generation prompt:
  - system prompt requests exactly one short coaching question
  - `temperature: 0.4`
  - `maxTokens: 120`
- Coach feedback prompt:
  - system prompt requests 1-3 sentence actionable feedback
  - `temperature: 0.4`
  - `maxTokens: 200`

These are used by `server.ts`:

- on transcript save: generate question
- on `/api/coach-answer`: generate feedback text (then optional ElevenLabs TTS)

## 4.4 Pitch Coach Helper

File: `lib/llm/pitchCoach.ts`

- system prompt: concise practical coach
- call settings: `temperature: 0.3`, `maxTokens: 512`
- helper currently separate from core analysis pipeline

## 4.5 Deck Generation

Files:

- system prompt: `lib/prompts/deckGeneration.ts` (`DECK_GENERATION_SYSTEM_PROMPT`)
- caller: `services/deckGenerationService.ts`

Calls:

- generation attempt: `temperature: 0.4`, `maxTokens: 8192`, JSON mode
- repair attempt: `temperature: 0.3`, `maxTokens: 8192`, JSON mode

## 5. Exact Output Generation: Field-by-Field Lineage

Final analysis payload type:

- `types/analysis-v2.ts` (`AnalysisResultV2`)

Created in:

- `services/analysisService.ts`

Field lineage:

| Output field | Source |
|---|---|
| `analysisVersion` | constant `'v2'` |
| `coverage` | deterministic (`prepAgentService`, spoken_only vs spoken+deck) |
| `outputs.feedback.one_line_verdict` | judge LLM output |
| `outputs.feedback.rubric_breakdown` | judge rubric normalized + deterministic delivery overwrite + hard gate caps |
| `outputs.feedback.top_fixes` | judge output, sliced to 5 and re-ranked 1..5 |
| `outputs.feedback.rewrite_script` | judge output trimmed |
| `outputs.feedback.delivery_metrics` | deterministic local scoring only |
| `outputs.feedback.spoken_score` | deterministic composite computation |
| `outputs.feedback.deck_score` | deterministic composite computation |
| `outputs.feedback.pre_penalty_overall` | deterministic composite computation |
| `outputs.feedback.penalty` | deterministic anti-pattern penalty |
| `outputs.feedback.overall_score` | deterministic final score |
| `outputs.feedback.sentiment_profile` | judge output |
| `outputs.feedback.anti_pattern_hits` | deterministic anti-pattern detection |
| `outputs.feedback.citations` | judge output |
| `outputs.feedback.stage_expectations` | deterministic context (knowledge + config) |
| `outputs.feedback.do_next_checklist` | judge output sliced to max 5 |
| `outputs.feedback.summary_good` | deterministic derived summary |
| `outputs.feedback.summary_bad` | deterministic derived summary |
| `outputs.feedback.section_feedback` | deterministic section slicing + fix mapping (+ optional deck linking) |
| `outputs.feedback.rewrite_diff` | deterministic token diff between transcript and rewrite |
| `outputs.feedback.vocabulary_metrics` | deterministic lexical metrics |
| `outputs.feedback.historical_links` | deterministic comparison to previous runs |
| `outputs.feedback.advanced_reasoning` | deterministic derived explanation |
| `outputs.qa_1min` | judge output if valid, else deterministic fallback pack |
| `meta.provider_used` | router telemetry |
| `meta.fallback_used` | true when sample fallback path used |
| `meta.cache_hit` | set by cache layer |
| `meta.llm_calls_used` | router telemetry (see caveat in section 10) |
| `meta.latency_ms` | router telemetry or queue fallback timing |
| `meta.attempt_count` | router telemetry |
| `meta.error_details` | fallback/failure details |

## 6. Token Usage and Budgeting

Important distinction:

- Configured caps are explicit.
- Actual consumed prompt/completion tokens are not currently stored in telemetry.

### 6.1 Provider-level defaults

Anthropic provider (`lib/llm/providers/anthropic.ts`):

- default `max_tokens`: 4096 if caller does not specify
- default `temperature`: 0.3
- default timeout: 25000 ms

OpenRouter provider (`lib/llm/providers/openrouter.ts`):

- default `max_tokens`: 4096 if caller does not specify
- default `temperature`: 0.3
- default timeout: 25000 ms

### 6.2 Per-feature output token caps

| Feature | File | maxTokens |
|---|---|---|
| Judge analysis | `services/judgeAgentService.ts` | 2000 |
| Realtime checklist LLM | `services/realtimeChecklistService.ts` | 1200 |
| Coach question | `lib/llm/feedbackQA.ts` | 120 |
| Coach feedback | `lib/llm/feedbackQA.ts` | 200 |
| Pitch coach helper | `lib/llm/pitchCoach.ts` | 512 |
| Deck generation | `services/deckGenerationService.ts` | 8192 |
| Deck repair | `services/deckGenerationService.ts` | 8192 |

### 6.3 Prompt-side input budgeting controls

Judge prompt:

- hard limit `9000` chars for user prompt (`lib/prompts/judge.ts`)
- measured worst-case build (local test): ~8001 chars, roughly ~2001 tokens at 4 chars/token

Checklist prompt:

- transcript window limited to last `750` words
- measured long-tail prompt (750 words): ~8175 chars, roughly ~2044 tokens at 4 chars/token

Deck prompt:

- no hard char clamp in builder, but request has large output cap (`8192`)
- measured system prompt string alone is large (~5340 chars)

### 6.4 Retry behavior and effective token spend caveats

Router-level:

- `lib/llm/router.ts` does not do provider failover.
- It records a single provider and returns/fails from that provider.

Provider-level:

- Anthropic provider retries internally up to 2 attempts on retryable statuses and also on final caught errors until attempts exhausted.
- OpenRouter provider retries with configurable `maxAttempts` (default 2) for retryable status/network errors.

Implication:

- Real token usage can exceed a single request cap because retries repeat prompts.
- Telemetry field `llm_calls_used` from router is currently a coarse count and does not expose raw provider token usage.

## 7. Deterministic Scoring Engine

Core files:

- context builder: `services/prepAgentService.ts`
- delivery + composite scoring: `services/scoringService.ts`
- hard caps policy: `config/strictness.ts`
- rubric definitions: `config/rubric.ts`
- mode timing config: `config/modes.ts`

### 7.1 Delivery metrics formula (local deterministic)

From `services/scoringService.ts`:

1. Tokenize transcript and derive word count.
2. Determine duration:
   - explicit duration if provided
   - else from segment timestamps
   - else fallback estimate from words at 140 WPM
3. Compute:
   - `wpm`
   - filler counts (`um`, `uh`, `like`, `basically`, `actually`, `you know`, `sort of`, `kind of`)
   - disfluency/stutter signals
   - repeated 2-gram and 3-gram phrases
4. Build component scores:
   - `sPace = clamp01(1 - abs(wpm - targetWpm) / 40)`
   - `sFiller = clamp01(1 - fillerRate / 0.03)`
   - `sStutter = clamp01(1 - stutterRate / 0.02)`
   - `sRepeat = clamp01(1 - repeatRate / 0.015)`
   - `sTime = getTimeScore(min/max duration compliance)`
5. Weighted delivery score:

```text
delivery20 = 20 * (
  0.28 * sPace +
  0.30 * sFiller +
  0.18 * sStutter +
  0.14 * sRepeat +
  0.10 * sTime
)
```

Mode targets from `config/modes.ts`:

- `elevator`: 30-45 sec, target 38 sec, target 150 WPM
- `vc_pitch`: 110-130 sec, target 120 sec, target 140 WPM

### 7.2 Anti-pattern penalties and hard gate caps

Anti-patterns detected in `prepAgentService.ts`:

- `jargon_overload`
- `no_ask`
- `no_proof`
- `tam_only`
- `slide_overload`

Penalty:

- `calculatePenalty` sums weighted hits and caps total at `12`.

Hard gate caps (`config/strictness.ts`):

- `no_proof` caps `evidence` to `8`
- `no_ask` caps `structure` to `12`
- `no_ask` caps `deck_ask` to `8`
- `tam_only` caps `market` to `10`

### 7.3 Final composite score

From `calculateCompositeScore`:

1. `spoken100 = structure + clarity + evidence + market + delivery20`
2. optional `deck100 = sum(deck categories)` when deck coverage exists
3. `overallBeforePenalty`:
   - spoken only: `spoken100`
   - spoken+deck: `round(0.65 * spoken100 + 0.35 * deck100)`
4. `finalScore = max(0, round(overallBeforePenalty - penalty))`

## 8. Analysis Runtime Workflow (Step-by-Step)

## 8.1 API and queue lifecycle

1. `POST /api/pitch/run` (`app/api/pitch/run/route.ts`) validates JSON request.
2. `runPitchAnalysisController` (`controllers/pitchController.ts`) validates mode/input/transcript/deck/stage/transcriptSegments.
3. Run inserted in Supabase `runs` table as `queued` with placeholder analysis output.
4. `enqueuePitchRun` starts async processing.
5. Job marks run `running` and sets `started_at`.
6. `analyzePitch` executes full pipeline.
7. On success:
   - run updated to `complete`
   - `overall_score`, full `analysis`, `meta`, `is_fallback` persisted
8. On failure:
   - run updated to `failed`
   - error message + diagnostic meta persisted

## 8.2 In-analysis sub-pipeline

1. `buildScoringContext` computes:
   - normalized transcript/deck text
   - beat evidence
   - anti-pattern hits
   - delivery metrics
   - stage expectations
   - retrieved knowledge snippets
2. `runJudgeAgent` sends judge prompts to LLM and validates strict schema.
3. `applyDeterministicScoring` overwrites delivery score and recomputes final scores.
4. Enrichment:
   - vocabulary metrics and vocab events
   - summary good/bad lines
   - advanced reasoning block
   - section feedback
   - optional deck slide linking
   - rewrite diff
   - historical links
5. Q&A pack:
   - use judge-provided `qa_1min` if valid
   - else synthesize from weakest categories + top fixes
6. Build final `AnalysisResultV2`.
7. If judge fails, build fallback from `config/sampleResult.ts` and inject deterministic metrics.

## 9. Transcription Architecture (ElevenLabs STT)

Main implementation:

- frontend hook: `hooks/useSTT.ts`
- backend websocket proxy: `server.ts`
- direct CLI recorder (separate utility): `stt.ts`

### 9.1 Live session transcription path used by app

1. `useSTT.start()` opens websocket to backend (`/ws`, usually `ws://localhost:3001/ws` in dev).
2. Browser mic audio is captured, resampled to 16k mono PCM, chunked in `2048` samples.
3. Client sends chunks as:
   - `message_type: "input_audio_chunk"`
   - `audio_base_64`
   - `sample_rate: 16000`
4. `server.ts` opens server-side websocket to ElevenLabs realtime STT:
   - model `scribe_v2_realtime`
   - timestamps enabled
   - VAD commit strategy
5. ElevenLabs emits partial + committed transcript messages.
6. Client merges committed transcript segments into `transcriptSegments` with word timing when available.
7. On stop:
   - client sends `type: "stop"` to backend
   - backend forces final commit, waits for final transcript, writes files:
     - `transcript/txt/transcript_YYYYMMDD-HHmm.txt`
     - `transcript/json/transcript_YYYYMMDD-HHmm.json`
   - backend emits `type: "saved"`
8. Session page sees `saved === true` and auto-submits run analysis.

### 9.2 Realtime checklist during transcription

While STT is active, backend calls `evaluateRealtimeChecklist` periodically with adaptive scheduler:

- min interval: 6s
- forced interval: 10s if there is new content
- minimum transcript words: 6
- minimum word delta since last eval: 6

Checklist status updates stream back to UI in realtime.

### 9.3 Legacy/alternate transcription hook

`hooks/useAudioRecorder.ts` exists but is currently not wired in page flow.

- Uses MediaRecorder + browser SpeechRecognition (Web Speech API) if available.
- Returns transcript fallback text and audio blob.

## 10. Linking Analysis Output to ElevenLabs Live Q&A

This is where analysis and Q&A are bridged.

## 10.1 Context creation from run analysis

`POST /api/qna/session` does:

1. Validate `runId`.
2. Fetch run and analysis.
3. `buildQaStarterContext(runId)` in `services/qna/contextBuilderService.ts` builds context from:
   - overall score + verdict
   - weakest rubric categories
   - top fixes
   - section risks
   - rewrite diff stats
   - historical deltas
   - knowledge snippets/citations
4. Build ConvAI prompt with `buildQaAgentSystemPrompt`.
5. Get ElevenLabs signed conversation URL via `lib/elevenlabs/convai.ts`.
6. Persist `qa_sessions` row with status `active` and metadata.

## 10.2 Client websocket session to ConvAI

`hooks/useLiveQaAgent.ts`:

1. Opens signed websocket URL.
2. Sends:

```json
{
  "type": "conversation_initiation_client_data",
  "conversation_initiation_client_data": {
    "context": "<starterContext from analysis>"
  }
}
```

3. Streams user mic audio (`user_audio_chunk`) at 16k PCM.
4. Parses incoming agent/user transcript events into turns.
5. Tracks latency samples and enforces 60-second session cap.

## 10.3 Session completion persistence

When session ends, page posts to:

- `POST /api/qna/session/[qaSessionId]/complete`

Payload includes:

- status (`completed` or `expired` or `failed`)
- turns
- transcript
- duration
- diagnostics metadata

Server can enrich missing transcript/turns by fetching conversation from ElevenLabs `getConversation(conversationId)` before persisting.

Result:

- Q&A transcript and metadata are durably tied to the original run in Supabase.

## 11. Storage and Data Contracts

Supabase tables relevant to this pipeline:

- `runs` (`migrations/05-create-runs-table.sql`, `migrations/08-add-run-lifecycle-columns.sql`)
- `qa_sessions` (`migrations/11-create-qa-sessions-table.sql`)
- `qa_resource_gaps` (`migrations/12-create-qa-resource-gaps-table.sql`)

Storage buckets:

- `recordings` (audio/video run recordings)
- `decks` (deck files)

Key note:

- `models/run.ts` localStorage CRUD exists but is not used in current app flow.
- Current persistence for runs is Supabase via `services/runService.ts`.

## 12. Known Gaps and Important Caveats

1. No cross-provider failover in `lib/llm/router.ts`:
   - It picks one provider and does not automatically switch to the other on failure.
2. Token telemetry is incomplete:
   - No raw input/output token usage is persisted from provider responses.
3. Anthropic `maxAttempts` input is not honored:
   - Anthropic provider uses internal fixed `MAX_ATTEMPTS = 2`.
4. Some prompt files are legacy/unwired for analysis runtime:
   - `lib/prompts/system.ts`, `lib/prompts/rubric.ts`, `lib/prompts/rewrite.ts`.
5. Analysis cache exists but is effectively bypassed in normal queued runs:
   - queue always passes `runId`, and cache is only used when no `runId`/`deckId`.

## 13. Practical Trace: One Full Run

Example trace from button click to Q&A:

1. User records pitch in session page.
2. STT backend emits committed transcript segments.
3. Backend emits `saved`.
4. Session page sends `POST /api/pitch/run` with transcript + segments + mode.
5. Controller inserts queued run and enqueues async analysis.
6. Queue executes judge call and deterministic scoring; run becomes complete.
7. Results page poll returns analysis output object.
8. User clicks "Start Live VC Q&A (60s)".
9. `/api/qna/session` builds starter context from weakest categories and fixes.
10. Browser starts ConvAI websocket with this context and streams audio.
11. Session completes; `/api/qna/session/[id]/complete` persists turns/transcript.

That is the complete built-out data loop from transcription -> Claude scoring -> deterministic output assembly -> ElevenLabs Q&A follow-up.
