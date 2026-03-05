# Project Research Summary

**Project:** Pitchr Hackathon Mode
**Domain:** Hackathon-specific pitch coaching and scoring extension for an existing multi-mode pitch platform
**Researched:** 2026-03-05
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a brownfield product extension, not a net-new app. The recommended path is to add a `hackathon_pitch` mode to the existing Pitchr orchestration (`prep -> judge -> scoring -> qa_1min`) while introducing a separate asynchronous corpus pipeline that verifies winner sources, transcribes them, and publishes versioned theme packs. Experts in this domain keep online scoring read-only and low-latency, and move corpus ingestion and extraction to queue-driven workers with strict status transitions.

The strongest implementation choice is to stay inside the current stack: Supabase Postgres + RLS, `pg_jsonschema` for rubric contract enforcement, `pgvector` for retrieval, and `pgmq` queues for reliability. On the model side, use Anthropic structured outputs for deterministic scoring payloads and prompt caching to control cost; use Voyage embeddings as the default retrieval path. This minimizes integration risk and preserves existing operational knowledge.

The biggest risks are data quality and trust failures, not UI polish. If winner provenance, rights compliance, transcript quality, and score stability are weak, the product will produce plausible but unreliable coaching. Mitigation is clear: enforce provenance and rights metadata at ingest, gate low-confidence transcripts, calibrate rubric outputs against a locked human-reviewed set, require evidence-linked recommendations, and block launch unless stability and security gates pass.

## Key Findings

### Recommended Stack

Research supports a single-database, queue-backed architecture in Supabase for both operational data and retrieval. This preserves transaction boundaries and avoids cross-system consistency bugs while adding enough structure for reproducible scoring behavior.

**Core technologies:**
- Supabase Postgres + RLS: source of truth for projects, corpus state, transcripts, and run metadata with tenant-safe boundaries.
- `pg_jsonschema`: database-level validation for rubric and scoring payload contracts, preventing silent schema drift.
- `pgvector` (`v0.8.2` baseline): semantic retrieval for long-form hackathon guidance with project-scoped filtering.
- Supabase Queues (`pgmq`): staged async jobs for verify -> transcribe -> extract with retry and visibility semantics.
- Next.js 15 Route Handlers and Server Actions: native mutation and orchestration surfaces in the existing app.
- Anthropic Messages API (structured outputs + prompt caching): schema-valid scoring output and lower repeated-context cost.
- Voyage embeddings (`voyage-4` default; `voyage-4-lite` cost path): recommended embedding provider alignment.

**Critical versions and constraints:**
- `pgmq` requires Postgres `15.6.1.143+`.
- Next.js `15` requires React `19`.
- Voyage default embedding dimension is `1024` (align `vector(1024)` schema).

### Expected Features

The feature set splits clearly between launch-critical judging alignment and post-launch leverage features.

**Must have (table stakes):**
- Hackathon rubric scoring with per-criterion gap diagnosis.
- Submission readiness and compliance checks (assets, links, constraints).
- Demo narrative coach for 2-4 minute format.
- Finalist pitch plus timed Q&A simulator.
- Iterative rehearsal loop with delta tracking across attempts.

**Should have (competitive):**
- Track/prize alignment helper.
- Event-rule ingestion from URL/PDF with human review.
- Submission packet auto-prep.

**Defer (v2+):**
- Full winner-corpus evidence engine UX.
- Multi-judge persona simulation.
- Build integrity and AI attribution auditor.

### Architecture Approach

The architecture should be staged and mode-driven: new corpus intake and worker functions feed immutable, versioned theme packs; existing `pitch-run` and `qna-session` consume only published packs. This keeps run latency predictable and allows replay/rollback when scoring behavior changes.

**Major components:**
1. `hackathon-corpus-submit` plus corpus services: ingest links, dedupe, enqueue verification.
2. Verification/transcription/theme workers: enforce source legitimacy, transcript quality, and publish theme pack versions.
3. `analysis-service` and `analysis-profiles` extension: inject active hackathon guidance into existing scoring flow.
4. `pitch-run` and `qna-session` extensions: preserve lifecycle parity while carrying mode-aware context and references.
5. Data layer additions (`hackathon_corpus_*`, `hackathon_theme_packs`): status-driven contracts and run-level provenance.

### Critical Pitfalls

1. **Winner corpus contamination** - Require proof URL, prize tier, verifier, and status for every source; reject unverifiable rows.
2. **Rights and policy violations in ingestion** - Fail closed on uncertain rights, log authorization scope, avoid unofficial scraping paths.
3. **Transcript fidelity bias** - Track confidence and quality signals, and human-review low-confidence segments before extraction.
4. **Pipeline divergence from existing Pitchr flow** - Implement hackathon as a mode extension, not a parallel service branch.
5. **Ungrounded coaching and score instability** - Enforce evidence-linked structured output and launch gates for rerun variance/human agreement.

## Implications for Roadmap

Based on dependencies and risk concentration, use this phase structure:

### Phase 1: Data Contracts and Governance Foundation
**Rationale:** Everything else depends on strong schema, status model, and security boundaries.
**Delivers:** New `hackathon_pitch` project type, corpus/transcript/theme-pack tables, provenance and rights fields, RLS and JSON schema constraints.
**Addresses:** Verified winner corpus requirement and project-type integration baseline.
**Avoids:** Corpus contamination, rights violations, early schema drift.

### Phase 2: Corpus Intake and Verification Pipeline
**Rationale:** Verified data must exist before transcription and extraction.
**Delivers:** `hackathon-corpus-submit`, dedupe, verification worker, compliance logging, queue retry behavior.
**Addresses:** Winner-link intake, legitimacy verification, provenance tracking.
**Avoids:** Untrusted data ingestion, unreliable sourcing, injection at intake.

### Phase 3: Transcription Quality and Theme Pack Publishing
**Rationale:** Scoring quality depends on transcript quality and versioned guidance artifacts.
**Delivers:** Transcription worker with quality gates, normalized transcripts, theme extraction worker, immutable theme pack vN plus active pointer.
**Addresses:** Transcript storage and pattern extraction requirements.
**Avoids:** Transcript bias, non-reproducible guidance, hidden drift.

### Phase 4: Runtime Hackathon Scoring Integration
**Rationale:** Only after published theme packs exist should scoring consume winner-derived context.
**Delivers:** `analysis-profiles` hackathon mode, active theme-pack resolver, `pitch-run` integration, run metadata with `theme_pack_ref`, evidence-linked recommendation schema.
**Addresses:** Hackathon-specific feedback grounded in winner patterns.
**Avoids:** Ungrounded coaching, unstable prompt behavior, latency regressions from online ingestion.

### Phase 5: Q&A Parity and Submission Readiness UX
**Rationale:** User-visible value requires end-to-end flow parity with current modes.
**Delivers:** Hackathon-aware Q&A context in `qna-session`, submission compliance checks, rehearsal delta tracking, initial finalist simulation workflows.
**Addresses:** `qa_1min` parity and practical pre-submission coaching outcomes.
**Avoids:** Feature mismatch with existing modes and weak user trust in actionability.

### Phase 6: Calibration, Security Hardening, and Launch Gates
**Rationale:** Release quality is determined by reliability and trust metrics, not feature count.
**Delivers:** Locked eval sets (dev/holdout/canary), human-agreement and rerun-variance thresholds, adversarial prompt-injection/poisoning tests, monitoring and rollback playbooks.
**Addresses:** Production readiness and go/no-go criteria.
**Avoids:** Evaluation leakage, score jitter, security-driven regressions post-launch.

### Phase Ordering Rationale

- Build order mirrors hard dependencies: schema -> verified corpus -> transcripts/themes -> runtime scoring -> UX parity -> launch gates.
- Grouping separates offline pipeline risk from online scoring risk, reducing blast radius and enabling staged rollout.
- This order directly neutralizes highest-severity pitfalls early (data contamination, rights issues, architecture divergence).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Source-policy and rights enforcement details per platform/API (compliance-critical).
- **Phase 3:** Transcription provider benchmarking and quality-gate threshold selection.
- **Phase 6:** LLM-as-judge calibration protocol and statistical stability acceptance criteria.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Supabase schema, RLS, and JSON schema enforcement are well-documented.
- **Phase 4:** Existing Pitchr mode-extension pattern is already established in current architecture.
- **Phase 5:** Q&A parity is an extension of current `qa_1min` flow, not a new system design.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based largely on official Supabase, Next.js, Anthropic, and provider docs with explicit compatibility constraints. |
| Features | MEDIUM | Strong event-source grounding, but some differentiators are inferred from market gaps and need user validation. |
| Architecture | HIGH | Directly grounded in existing Pitchr code boundaries and integration points. |
| Pitfalls | MEDIUM | Risks are credible and well-supported, but mitigation thresholds still require project-specific validation. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Winner-source rights policy matrix:** Define exactly which platforms and ingestion methods are allowed in v1.
- **Transcript quality thresholds:** Set concrete confidence/WER proxy cutoffs and review sampling rates.
- **Calibration benchmark:** Build a human-labeled, non-overlapping holdout set for launch gating.
- **Evidence contract strictness:** Decide whether uncited recommendations are blocked, downgraded, or retried.
- **Model/provider fallback policy:** Define behavior for embedding or LLM provider degradation without changing score semantics.

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` - stack recommendations and version constraints.
- `.planning/research/ARCHITECTURE.md` - component boundaries, data flow, build order.
- `.planning/PROJECT.md` - scope, constraints, parity requirements.
- Supabase docs (RLS, `pg_jsonschema`, `pgvector`, queues, cron): https://supabase.com/docs
- Next.js App Router and v15 upgrade docs: https://nextjs.org/docs
- Anthropic structured outputs, prompt caching, token counting: https://platform.claude.com/docs

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` - table stakes/differentiators from hackathon ecosystem analysis.
- `.planning/research/PITFALLS.md` - operational and model risk synthesis.
- Voyage embedding docs: https://docs.voyageai.com/docs/embeddings
- Devpost, ETHGlobal, MLH judging and submission guidance:
  - https://help.devpost.com
  - https://ethglobal.com
  - https://guide.mlh.io

### Tertiary (LOW-MEDIUM confidence)
- Research papers and security references used in pitfalls calibration and threat framing:
  - https://arxiv.org/abs/2406.12624
  - https://arxiv.org/abs/2406.07791
  - https://arxiv.org/abs/2410.14479
  - https://owasp.org/www-project-top-10-for-large-language-model-applications/

---
*Research completed: 2026-03-05*
*Ready for roadmap: yes*
