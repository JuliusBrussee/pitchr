# Architecture Research

**Domain:** Hackathon mode extension for Pitchr (winner-corpus-driven scoring)
**Researched:** 2026-03-05
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
+-----------------------------------------------------------------------------------+
|                                  Client Layer                                     |
|  session page -> fetchEdge('pitch-run') / project management / corpus admin UI    |
+-------------------------------------------+---------------------------------------+
                                            |
                                            v
+-----------------------------------------------------------------------------------+
|                         Edge API + Orchestration Layer                            |
|  projects, pitch-run, qna-session, hackathon-corpus-submit (new)                 |
|  - resolves project type/mode                                                     |
|  - enqueues corpus jobs                                                           |
|  - serves run scoring requests                                                    |
+-----------------------------+-----------------------------+-----------------------+
                              |                             |
                              v                             v
+---------------------------------------------+   +--------------------------------+
| Async Corpus Pipeline (new)                 |   | Runtime Scoring Pipeline       |
| verify -> transcribe -> extract themes      |   | prep context -> judge -> score |
| (queue + worker functions + cron trigger)   |   | (existing pitch-run path)      |
+--------------------------+------------------+   +----------------+---------------+
                           |                                       |
                           v                                       v
+-----------------------------------------------------------------------------------+
|                                   Data Layer                                      |
| projects / runs (existing)                                                        |
| hackathon_corpus_sources, hackathon_corpus_items, hackathon_transcripts (new)    |
| hackathon_theme_packs + active_version pointer (new)                              |
+-----------------------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `hackathon-corpus-submit` edge function (new) | Accept user-provided and discovered winner links; dedupe; create ingestion jobs | `hackathon_corpus_sources`, queue module |
| Verification worker (new) | Confirm a link is a legitimate winning-pitch source and store provenance | queue, `hackathon_corpus_sources`, optional citation fetchers |
| Transcription worker (new) | Produce transcript for each verified item and persist transcript metadata | queue, storage/video source, `hackathon_transcripts` |
| Theme extraction worker (new) | Build a versioned hackathon theme pack (patterns, anti-patterns, rubric hints) from verified transcripts | `hackathon_transcripts`, `hackathon_theme_packs` |
| Theme pack resolver (new `_shared`) | Resolve active theme pack for `hackathon_pitch` runs | `hackathon_theme_packs`, `analysis-service` |
| `pitch-run` (existing, extended) | Keep run lifecycle; call analysis with selected project context | `project-service`, `analysis-service`, `run-service` |
| `analysis-profiles` / `analysis-service` (existing, extended) | Add `hackathon_pitch` profile and inject theme-pack guidance into judge prompt | LLM providers, theme pack resolver |
| `qna-session` (existing, lightly extended) | Preserve QA parity; include hackathon-specific weak-category context from run output | `run-service`, ElevenLabs ConvAI |

## Recommended Project Structure

```text
supabase/
|-- migrations/
|   |-- 202603xx_add_hackathon_project_type.sql          # add project type + seed project
|   |-- 202603xx_create_hackathon_corpus_tables.sql      # sources/items/transcripts/theme packs
|-- functions/
|   |-- hackathon-corpus-submit/
|   |   |-- index.ts                                     # intake endpoint
|   |-- hackathon-corpus-worker/
|   |   |-- index.ts                                     # verify/transcribe/theme jobs (batched)
|   |-- pitch-run/
|   |   |-- index.ts                                     # unchanged lifecycle, pass project type through
|   |-- qna-session/
|   |   |-- index.ts                                     # QA parity, context from run output
|   |-- _shared/
|       |-- hackathon-corpus-service.ts                  # source dedupe + status transitions
|       |-- hackathon-verify-service.ts                  # winner verification + provenance
|       |-- hackathon-transcription-service.ts           # provider adapter + transcript normalization
|       |-- hackathon-theme-service.ts                   # transcript -> theme-pack version build
|       |-- hackathon-theme-resolver.ts                  # active pack lookup for analysis
|       |-- analysis-profiles.ts                         # add hackathon profile
|       |-- analysis-service.ts                          # inject hackathon guidance at runtime
|-- functions/deno.json                                  # scheduled worker config

knowledge/
|-- hackathon/
|   |-- packs/                                           # optional exported snapshots for audit/debug
```

### Structure Rationale

- **Separate async corpus workers from `pitch-run`** to keep scoring latency stable and avoid long-running request failures.
- **Versioned theme packs** make outputs reproducible and keep run provenance explainable.
- **`_shared` service modules** keep verification, transcription, and theme extraction independently testable.
- **Project-type-based routing** reuses current architecture (`project.type` -> profile) without forcing a risky mode-wide rewrite.

## Architectural Patterns

### Pattern 1: Staged Async Pipeline (Verify -> Transcribe -> Extract)

**What:** Multi-step queue-driven ingestion pipeline where each stage advances item status.
**When to use:** External-link workflows with variable latency and frequent retries.
**Trade-offs:** More moving parts than direct request/response; much better reliability and observability.

**Example:**
```typescript
type CorpusJobType = 'verify_source' | 'transcribe_source' | 'extract_themes';

interface CorpusJob {
  jobType: CorpusJobType;
  sourceId?: string;
  themePackVersion?: number;
}
```

### Pattern 2: Versioned Theme Pack Contract

**What:** Persist immutable `hackathon_theme_packs` and mark one `active` for runtime scoring.
**When to use:** Any derived guidance that influences judge prompts and rubric interpretation.
**Trade-offs:** Requires version management; enables deterministic replay and safe rollback.

**Example:**
```typescript
interface ThemePackRef {
  id: string;
  version: number;
  createdAt: string;
  sourceCount: number;
}
```

### Pattern 3: Runtime Isolation (Offline Corpus Build, Online Scoring Read-Only)

**What:** `pitch-run` reads already-published theme packs only; it never does ingestion/transcription.
**When to use:** User-facing scoring endpoints with strict latency requirements.
**Trade-offs:** New data is not instant; runtime remains fast and predictable.

## Data Flow

### Request Flow

```text
[Admin/User submits winner links]
    ->
[hackathon-corpus-submit]
    ->
[queue verify jobs]
    ->
[verify worker marks verified/rejected + provenance]
    ->
[queue transcribe jobs for verified sources]
    ->
[transcription worker stores transcript + confidence]
    ->
[queue extract_themes job]
    ->
[theme worker publishes theme pack vN and sets active]
```

### Runtime Scoring Flow

```text
[Session submit -> fetchEdge('pitch-run')]
    ->
[pitch-run resolves project (hackathon_pitch)]
    ->
[analysis-service resolves active hackathon theme pack]
    ->
[judge prompt = base profile + hackathon theme guidance]
    ->
[LLM feedback + qa_1min]
    ->
[run persisted with theme_pack_ref + score output]
```

### Q&A Flow (Parity Requirement)

```text
[User starts qna-session for hackathon run]
    ->
[qna-session reads run.outputs.feedback weakest categories]
    ->
[builds starter context with hackathon-specific weak spots]
    ->
[ElevenLabs live Q&A]
```

### State Management

```text
Corpus source status:
submitted -> verifying -> verified | rejected

Transcript status:
pending -> transcribing -> ready | failed

Theme pack status:
building -> published (active pointer switches atomically)

Run status:
queued -> running -> complete | failed
```

## Build Order and Dependencies

1. **Add data contracts and project type**
   - Add `hackathon_pitch` to project type constraints/config and seed it.
   - Create corpus/transcript/theme-pack tables with status fields and indexes.
   - Dependency: none.

2. **Corpus intake endpoint + dedupe**
   - Implement `hackathon-corpus-submit`.
   - Store links in `hackathon_corpus_sources` and enqueue `verify_source`.
   - Dependency: step 1.

3. **Verification worker**
   - Build deterministic winner-verification checks + provenance capture.
   - Queue transcription only for verified items.
   - Dependency: step 2.

4. **Transcription worker**
   - Add provider adapter and transcript normalization schema.
   - Persist transcript quality metadata for filtering.
   - Dependency: step 3.

5. **Theme extraction + pack publishing**
   - Generate `hackathon_theme_packs` version N from verified transcripts.
   - Atomically switch active pointer/version.
   - Dependency: step 4.

6. **Runtime analysis integration**
   - Extend `analysis-profiles` for `hackathon_pitch`.
   - Load active theme pack in `analysis-service`.
   - Persist `theme_pack_ref` in run metadata for traceability.
   - Dependency: step 5.

7. **Q&A parity integration**
   - Ensure `qa_1min` generation and `qna-session` context stay mode-aware for hackathon runs.
   - Dependency: step 6.

8. **Ops hardening**
   - Add cron schedule for workers, retries/dead-letter policy, dashboards, and backfill commands.
   - Dependency: steps 2-7.

### Build-Order Implications for Roadmap

- **Do not start prompt tuning before step 5.** Without published theme packs, hackathon scoring will drift and be non-reproducible.
- **Do not ship user-facing hackathon mode before step 6.** Otherwise runs cannot use winner-derived guidance.
- **Ship ingestion and runtime behind separate flags.** This enables corpus backfill first, then safe scoring rollout.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-500 corpus items | Single worker function with small batch size and status table is enough |
| 500-10k corpus items | Split workers by stage (verify/transcribe/theme) and increase queue parallelism |
| 10k+ corpus items | Partition transcript/theme tables by date/version and run extraction incrementally |

### Scaling Priorities

1. **First bottleneck:** transcription throughput. Fix via bounded parallel workers + retry budgets.
2. **Second bottleneck:** theme extraction latency. Fix via incremental extraction (delta since last version), not full rebuild.

## Anti-Patterns

### Anti-Pattern 1: Ingestion Work Inside `pitch-run`

**What people do:** Verify links or transcribe videos synchronously during run scoring.
**Why it's wrong:** Explodes latency and makes scoring availability depend on external media fetches.
**Do this instead:** Keep corpus build asynchronous and runtime read-only.

### Anti-Pattern 2: Mixing Unverified and Verified Sources

**What people do:** Build theme packs from any available transcript.
**Why it's wrong:** Corrupts rubric guidance and weakens feedback quality.
**Do this instead:** Enforce `verified_only` filter before transcription and extraction.

### Anti-Pattern 3: Overwriting Theme Guidance In-Place

**What people do:** Mutate one JSON blob for active guidance.
**Why it's wrong:** You lose replayability for historical runs.
**Do this instead:** Immutable pack versions + active pointer + run-level pack reference.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Edge Functions | API + worker execution | Keep worker batches bounded; trigger by cron |
| Supabase Postgres | System of record for corpus/transcripts/theme packs/runs | Use status indexes for queue polling |
| Supabase Queues / staged queue table | Job orchestration for verify/transcribe/extract | Use visibility timeout + retries for idempotent processing |
| LLM providers (Anthropic/Gemini) | Existing judge path | Inject hackathon theme guidance as structured context |
| Transcription provider adapter | Async transcription for verified winner media | Keep provider-specific logic behind one service interface |
| ElevenLabs ConvAI | Existing live QA runtime | No architecture change; context payload becomes hackathon-aware |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `hackathon-corpus-submit` <-> corpus service | typed function calls + DB inserts | Deduplicate by canonical URL hash |
| queue worker <-> verification/transcription/theme services | queue messages | Idempotent handlers; safe re-run |
| `pitch-run` <-> `analysis-service` | typed analysis input | Pass project type and resolved theme pack ref |
| `analysis-service` <-> `run-service` | run update payload | Persist theme pack version/hash in run meta |
| `qna-session` <-> `run-service` | read run outputs | Preserve current QA flow; no parallel data model |

## Sources

- `.planning/PROJECT.md`
- `.planning/codebase/ARCHITECTURE.md`
- `supabase/functions/pitch-run/index.ts`
- `supabase/functions/qna-session/index.ts`
- `supabase/functions/_shared/analysis-service.ts`
- `supabase/functions/_shared/analysis-profiles.ts`
- `supabase/functions/_shared/project-config.ts`
- `supabase/functions/_shared/project-service.ts`
- `supabase/functions/_shared/run-service.ts`
- `scripts/snapshot-curated-sources.ts`
- `scripts/build-knowledge-pack.ts`
- `knowledge/patterns.v1.json`
- `supabase/migrations/20260226000003_projects_and_project_scoping.sql`
- Supabase Cron docs: https://supabase.com/docs/guides/cron
- Supabase Queues docs: https://supabase.com/docs/guides/queues
- Supabase Queues quickstart: https://supabase.com/docs/guides/queues/quickstart
- Supabase Queues with Edge Functions: https://supabase.com/docs/guides/queues/consuming-messages-with-edge-functions

---
*Architecture research for: Pitchr hackathon mode integration*
*Researched: 2026-03-05*
