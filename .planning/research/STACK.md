# Stack Research

**Domain:** AI pitch coaching (project-specific rubric context ingestion + scoring integration)
**Researched:** 2026-03-05
**Confidence:** HIGH for storage/security/ingestion patterns, MEDIUM for embedding vendor selection

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase Postgres | Managed Postgres 15+ (keep current project DB) | Persistent rubric/project configuration and version history | You already run Supabase + Postgres in production. Keep rubric metadata in the same transactional store as runs to avoid cross-system consistency bugs. |
| Supabase Row Level Security (RLS) | Current | Data access control for project/rubric rows | Supabase requires RLS for exposed schemas and this is the standard way to enforce tenant/project boundaries safely. |
| `pg_jsonschema` extension | Current Supabase extension | Database-level rubric JSON validation | Enforces rubric shape in the database (not just in UI), preventing malformed criteria/weights from entering scoring. |
| `pgvector` extension | `v0.8.2` ecosystem baseline | Semantic retrieval for long rubric guidance/examples | Standard Postgres-native vector similarity with HNSW/IVFFlat; keeps vector + relational joins in one DB. |
| Supabase Queues (`pgmq`) | Current (requires Postgres `15.6.1.143+`) | Async ingestion/re-embedding jobs | Durable, guaranteed delivery queue with exactly-once delivery semantics (visibility window) for background processing. |
| Next.js App Router Route Handlers + Server Actions | Next.js 15 + React 19 | Rubric input API and admin mutation workflows | Native server-side mutation model in your existing stack; no extra backend framework required. |
| Anthropic Messages API with Structured Outputs + Prompt Caching | Current Claude API | Deterministic rubric scoring payloads and lower per-run context cost | Structured outputs enforce schema-valid scoring JSON; prompt caching reduces repeated rubric-context latency/cost. |
| Embeddings provider: Voyage AI (`voyage-4` default; `voyage-4-lite` cost path) | Current model family | Vectorizing rubric documents and examples | Anthropic does not provide its own embedding model; Voyage is explicitly recommended in Anthropic docs and Voyage 4 models are current retrieval baseline. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@supabase/supabase-js` | `^2.97.0` (already in repo) | DB/storage/queue RPC client | Use in server-side services and route handlers for rubric CRUD + ingestion orchestration. |
| `zod` | Latest stable | Server-side validation for rubric form payloads | Use in Server Actions and `POST/PATCH` handlers before writing to DB. |
| `voyageai` (TS SDK) or direct HTTP | Current | Embedding generation integration | Use SDK for faster integration; switch to HTTP if you want fewer runtime deps. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| SQL migrations (existing project flow) | Versioned schema changes for rubric tables/extensions | Add extensions and tables via migration, not dashboard-only edits. |
| Anthropic token counting endpoint | Preflight prompt/token budgeting | Use before shipping long rubric contexts to avoid model/token surprises. |
| Supabase Queue dashboard + API | Queue ops and monitoring | Use for ingestion job visibility, retries, and archival behavior. |

## Installation

```bash
# Core additions
npm install zod voyageai

# Already present in this repo (verify/pin if needed)
npm install @supabase/supabase-js @supabase/ssr

# DB migrations (run in SQL migration files)
# create extension if not exists vector;
# create extension if not exists pg_jsonschema;
# Enable Supabase Queues (pgmq) in Dashboard/Module
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Supabase Postgres + `pgvector` | External vector DB (Pinecone/Weaviate/etc.) | Use external vector DB only if you already exceed Postgres/pgvector latency SLOs at large scale and need dedicated ANN infrastructure. |
| Voyage `voyage-4` / `voyage-4-lite` embeddings | OpenAI `text-embedding-3-small` / `text-embedding-3-large` | Use OpenAI if your team already has centralized OpenAI billing/ops or you need strict cross-product standardization on OpenAI APIs. |
| Supabase Queues (`pgmq`) | Existing in-process background worker loop | Keep in-process worker only for very low throughput/internal usage; move to queues for reliability and replayability. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Storing rubric config only as mutable free-form JSON without DB constraints | Silent schema drift breaks scoring prompts and downstream parsing | `pg_jsonschema` + check constraints + explicit rubric versioning tables |
| Synchronous ingestion/embedding inside user-facing request path | Increased tail latency and timeout risk during uploads/updates | Queue-based ingestion (`pgmq`) with async consumers |
| Introducing a second primary operational database for this milestone | Higher ops/cost/consistency burden for a scoped feature addition | Keep data in existing Supabase Postgres unless scale proves otherwise |
| Using `service_role` keys from browser clients | Security risk; bypasses RLS controls | Server-only writes through Route Handlers/Server Actions with strict RLS policies |

## Stack Patterns by Variant

**If rubric input is mostly structured criteria/weights (JSON + scalar fields):**
- Use normalized tables (`projects`, `rubric_versions`, `rubric_criteria`) plus JSONB metadata.
- Because this gives deterministic scoring inputs and easy auditing/version rollback.

**If rubric input includes long narrative docs, past winning examples, or judge guidelines:**
- Add chunk table + embeddings (`rubric_chunks`) with `vector(1024)` and `project_id` filter.
- Because semantic retrieval improves context relevance while keeping queries scoped per project.

**If this remains internal/admin-managed only:**
- Keep writes server-only with service credentials; read via restricted APIs.
- Because you avoid exposing mutation surfaces while still persisting project-level context.

**If moving to multi-tenant/customer-facing project management:**
- Add Supabase Auth and strict RLS policies keyed by tenant/project ownership.
- Because this is the standard hard boundary for safe shared-database tenancy.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@15` | `react@19`, `react-dom@19` | Next.js 15 upgrade guide sets React 19 minimum. |
| `pgmq` (Supabase Queues) | Postgres `15.6.1.143+` | Quickstart explicitly lists minimum Postgres version for `pgmq`. |
| `pgvector` (`v0.8.2` baseline) | Postgres `13+` | Upstream pgvector docs state Postgres 13+ support. |
| `voyage-4` embeddings | `vector(1024)` default | Voyage docs list default 1024-dim (plus 256/512/2048 options). |
| OpenAI `text-embedding-3-large` (alt) | `vector(3072)` default (or down-dim) | OpenAI docs list 3072 default and support dimension control. |

## Sources

- https://supabase.com/docs/guides/database/postgres/row-level-security - RLS requirements/policies in exposed schemas (HIGH)
- https://supabase.com/docs/guides/database/extensions/pg_jsonschema - JSON schema validation functions + check-constraint pattern (HIGH)
- https://supabase.com/docs/guides/database/extensions/pgvector - pgvector usage, extension setup, filtered-query caveat (HIGH)
- https://supabase.com/docs/guides/ai - Supabase AI/vector positioning ("best vector DB is the DB you already have") (HIGH)
- https://supabase.com/docs/guides/queues - queue guarantees and architecture (HIGH)
- https://supabase.com/docs/guides/queues/quickstart - `pgmq` minimum Postgres version, security/RLS notes, JS usage (HIGH)
- https://nextjs.org/docs/app/getting-started/route-handlers - Route Handlers behavior and caching defaults (HIGH)
- https://nextjs.org/docs/app/guides/forms - Server Actions/forms and Zod validation pattern (HIGH)
- https://nextjs.org/docs/app/guides/upgrading/version-15 - Next.js 15 + React 19 compatibility (HIGH)
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs - schema-constrained outputs for reliable scoring JSON (HIGH)
- https://platform.claude.com/docs/en/build-with-claude/prompt-caching - cache behavior, lifetimes, pricing mechanics (HIGH)
- https://platform.claude.com/docs/en/build-with-claude/token-counting - token preflight endpoint and usage model (HIGH)
- https://platform.claude.com/docs/en/build-with-claude/embeddings - Anthropic does not provide embeddings; vendor guidance (HIGH)
- https://docs.voyageai.com/docs/embeddings - Voyage model family (`voyage-4*`), dimensions, retrieval usage patterns (MEDIUM-HIGH)
- https://developers.openai.com/api/docs/guides/embeddings - OpenAI embedding model dimensions/perf/cost references (HIGH)
- https://github.com/pgvector/pgvector - pgvector capabilities and Postgres compatibility (`v0.8.2` installation baseline) (HIGH)

---
*Stack research for: Pitchr rubric-context ingestion + scoring integration*
*Researched: 2026-03-05*
