# Codebase Concerns

**Analysis Date:** 2026-03-04

## Tech Debt

**Dual Backend Implementations (Next + Edge):**
- Issue: Core run/deck/billing logic exists in both the Node app layer and the Supabase Edge shared layer.
- Files: `services/runService.ts`, `services/billingService.ts`, `services/deckService.ts`, `supabase/functions/_shared/run-service.ts`, `supabase/functions/_shared/billing-service.ts`, `supabase/functions/_shared/deck-service.ts`, `controllers/pitchController.ts`
- Why: Migration to Edge Functions is partial, with legacy controller/service paths still present.
- Impact: Behavior drift risk, duplicated fixes, and conflicting validation/error text.
- Fix approach: Pick one source of truth for business logic (prefer Edge path for API-backed flows), then delete or thin the legacy path.

**Route Protection Registry Drift:**
- Issue: Protected route lists are hand-maintained in multiple files and no longer match the real app route tree.
- Files: `middleware.ts`, `lib/supabase/middleware.ts`, `app/(app)/upload/page.tsx`, `app/(app)/arena/page.tsx`, `app/(app)/progress/page.tsx`, `app/(app)/setup/page.tsx`, `app/(app)/orb-preview/page.tsx`
- Why: New app routes were added without updating middleware lists.
- Impact: Inconsistent auth gating and user-visible 401/error states.
- Fix approach: Generate protection rules from a single route manifest and add a parity test.

**Oversized Client Modules:**
- Issue: Large pages/hooks mix UI, data mapping, and business rules in single files.
- Files: `app/(app)/analytics/page.tsx`, `app/(app)/history/page.tsx`, `app/(app)/settings/page.tsx`, `hooks/useSTT.ts`, `lib/headTracking/useHeadTracking.ts`
- Why: Iterative MVP growth without decomposition.
- Impact: Higher regression risk, slower code review, and harder targeted testing.
- Fix approach: Split by concern (data normalization, chart transforms, transport/state machines, presentational components).

## Known Bugs

**Unauthenticated access to some `(app)` pages results in broken flows:**
- Symptoms: Logged-out users can load pages like `/upload` or `/arena`, then immediately hit failing API calls and empty/error states.
- Trigger: Open an unprotected `(app)` route while not authenticated.
- Files: `middleware.ts`, `lib/supabase/middleware.ts`, `app/(app)/upload/page.tsx`, `app/(app)/arena/page.tsx`, `app/(app)/progress/page.tsx`
- Workaround: Navigate to a middleware-protected route (e.g. `/dashboard`) or log in first.
- Root cause: Middleware protected-route lists are out of sync with existing routes.

**Misleading `inputType` validation error text:**
- Symptoms: Error message says only `audio` or `text` are valid, but `upload` is accepted in type definitions.
- Trigger: Send invalid `inputType` to pitch-run handlers.
- Files: `supabase/functions/pitch-run/index.ts`, `controllers/pitchController.ts`, `types/pitch.ts`
- Workaround: None; this is a messaging bug.
- Root cause: Error string was not updated when `upload` input type was introduced.

**Deck loading failures are silently swallowed in session/upload views:**
- Symptoms: Deck picker appears empty with no user-facing error when deck edge calls fail.
- Trigger: `deck-list` or `deck-detail` failure (network/auth/backend).
- Files: `app/(app)/session/page.tsx`, `app/(app)/upload/page.tsx`
- Workaround: Reload or inspect network logs manually.
- Root cause: Empty `catch` handlers intentionally suppress errors.

## Security Considerations

**Edge auth helper trusts decoded JWT claims without signature verification in-function:**
- Risk: If `verify_jwt` is misconfigured during deployment, forged bearer tokens can pass local claim parsing.
- Files: `supabase/functions/_shared/supabase.ts`, `supabase/config.toml`, `CLAUDE.md`
- Current mitigation: Many functions are configured with `verify_jwt = true` in `supabase/config.toml`.
- Recommendations: Fail closed at deploy-time for auth-required functions, and optionally call `auth.getUser()` for explicit token verification in-function.

**Cron/admin edge functions are weakly guarded when secrets are absent:**
- Risk: Sensitive background actions can be triggered without strict auth if environment protection is missing.
- Files: `supabase/functions/newsletter-send/index.ts`, `supabase/functions/qna-session-expire/index.ts`
- Current mitigation: Optional bearer check exists for newsletter sender.
- Recommendations: Make secret checks mandatory and return 500 on missing secret configuration.

**Public data-capture endpoints have no abuse throttling:**
- Risk: Spam, storage growth, and operational email abuse on public endpoints.
- Files: `app/api/waitlist/route.ts`, `app/api/newsletter/unsubscribe/route.ts`
- Current mitigation: Basic input validation and DB uniqueness constraints.
- Recommendations: Add rate limiting, bot challenge, and explicit retention limits for stored request metadata.

**Stripe return URLs are built from request `Origin` header:**
- Risk: Invalid or manipulated origins can create unsafe redirect targets.
- Files: `app/api/billing/checkout/route.ts`, `app/api/billing/day-pass/route.ts`, `app/api/billing/credits/route.ts`, `app/api/billing/portal/route.ts`
- Current mitigation: Endpoints require authenticated users.
- Recommendations: Build URLs from a server-side allowlisted app base URL, not request origin.

## Performance Bottlenecks

**History view fetches non-summary run payloads:**
- Problem: The history page requests full run objects (including heavy analysis payloads) for list rendering.
- Files: `app/(app)/history/page.tsx`, `supabase/functions/pitch-run/index.ts`, `supabase/functions/_shared/run-service.ts`
- Measurement: No pagination + no summary flag in history request path.
- Cause: Endpoint defaults to full run record shape.
- Improvement path: Use `summary=true` + cursor pagination for history.

**Client-side analytics does full normalization/aggregation each load:**
- Problem: Analytics computes multiple full-array transforms in the browser.
- Files: `app/(app)/analytics/page.tsx`
- Measurement: Entire run dataset is normalized and re-bucketed for each range/view load.
- Cause: Aggregation logic lives only in client page code.
- Improvement path: Move heavy aggregates to edge endpoint and return precomputed series.

**Head tracking remains main-thread intensive:**
- Problem: FaceLandmarker loop plus UI updates run on the main thread.
- Files: `lib/headTracking/useHeadTracking.ts`
- Measurement: Inference cadence is adaptive (`14-33ms`) but still continuous in active sessions.
- Cause: No worker-based inference pipeline.
- Improvement path: Offload inference to worker/isolated context and reduce UI update frequency.

## Fragile Areas

**Realtime STT lifecycle/state machine:**
- Why fragile: Multiple websocket refs, timers, and mixed responsibilities (STT + feedback audio + checklist) in one hook.
- Files: `hooks/useSTT.ts`, `app/(app)/session/page.tsx`
- Common failures: Hidden transport errors, stale sockets, silent audio/playback failures.
- Safe modification: Introduce an explicit state machine + typed events + centralized error channel before feature changes.
- Test coverage: `hooks/__tests__/useSTT.test.ts` exists, but does not cover full session-page integration behavior.

**Async analysis background scheduling in edge runtime:**
- Why fragile: Run processing depends on `waitUntil`/fallback async continuation after HTTP `202` return.
- Files: `supabase/functions/pitch-run/index.ts`
- Common failures: Queued runs can remain queued if background execution is interrupted.
- Safe modification: Move processing to durable queue + worker loop with retry/dead-letter handling.
- Test coverage: No edge-function integration tests covering queue continuation.

**Billing side effects span multiple writes/services:**
- Why fragile: Subscription, credits, usage events, and webhook idempotency are split across handlers/services.
- Files: `app/api/billing/webhook/route.ts`, `services/billingService.ts`, `services/creditService.ts`
- Common failures: Partial updates during retries/errors and difficult replay debugging.
- Safe modification: Consolidate critical mutations into transactional DB RPCs with explicit idempotency keys.
- Test coverage: Service unit tests exist; webhook flow lacks end-to-end coverage.

## Scaling Limits

**Newsletter send executes large recipient loops in one invocation:**
- Current capacity: Up to configured recipient limit per call (defaults allow very large sends).
- Files: `supabase/functions/newsletter-send/index.ts`
- Limit: Single edge invocation duration and provider throughput constraints.
- Symptoms at limit: Partial sends, timeouts, and operational retries.
- Scaling path: Queue deliveries in batches and process asynchronously with checkpointing.

**Usage checks rely on growing event-count queries:**
- Current capacity: Works for MVP volumes but query cost rises with `usage_events` growth.
- Files: `services/billingService.ts`, `supabase/functions/_shared/billing-service.ts`
- Limit: Count/sum scans become more expensive as history grows.
- Symptoms at limit: Slower checkout/usage-gate endpoints.
- Scaling path: Pre-aggregated counters/materialized usage summaries + index tuning.

**Client pages still depend on full list retrieval for analytics/progress/history:**
- Current capacity: Acceptable for low hundreds of runs.
- Files: `app/(app)/analytics/page.tsx`, `app/(app)/progress/page.tsx`, `app/(app)/history/page.tsx`, `supabase/functions/pitch-run/index.ts`
- Limit: Payload/memory/compute spikes at larger run counts.
- Symptoms at limit: Slow initial render and laggy chart/list interactions.
- Scaling path: Cursor pagination and server-side aggregate endpoints.

## Dependencies at Risk

**Runtime dependency on system LibreOffice for PPTX conversion (Node path):**
- Risk: `soffice` may not exist in production/runtime containers.
- Files: `services/deckService.ts`
- Impact: PPTX conversion path fails outside configured environments.
- Migration plan: Remove or isolate Node conversion path; keep edge flow PDF-only by contract.

**Billing limits duplicated across app and edge code:**
- Risk: Config drift between two hardcoded sources of truth.
- Files: `config/billing.ts`, `supabase/functions/_shared/billing-service.ts`
- Impact: Inconsistent enforcement of limits/credits across runtimes.
- Migration plan: Generate shared config artifact or store limits in DB config table.

**External AI providers are hard requirements for key workflows:**
- Risk: Provider outages/latency directly affect core user flows.
- Files: `services/analysisService.ts`, `supabase/functions/deck-generate/index.ts`, `supabase/functions/transcribe-audio/index.ts`
- Impact: Failed or delayed analysis/deck/stt operations.
- Migration plan: Add explicit degraded-mode responses, retries with jitter, and queue-backed retry paths.

## Missing Critical Features

**Centralized abuse/rate limiting layer:**
- Problem: Public and high-cost endpoints do not share a consistent throttling policy.
- Files: `app/api/waitlist/route.ts`, `supabase/functions/transcribe-audio/index.ts`, `supabase/functions/deck-generate/index.ts`
- Current workaround: Input validation + provider limits.
- Blocks: Predictable abuse resilience and cost protection.
- Implementation complexity: Medium.

**Durable background job infrastructure:**
- Problem: Long-running work is still tied to request/runtime lifecycle in several paths.
- Files: `supabase/functions/pitch-run/index.ts`, `supabase/functions/newsletter-send/index.ts`
- Current workaround: Best-effort async continuation and manual retries.
- Blocks: High-confidence completion guarantees under load/failure.
- Implementation complexity: Medium-High.

**Automated middleware-route parity checks:**
- Problem: No guardrail ensures new `(app)` routes are protected consistently.
- Files: `middleware.ts`, `lib/supabase/middleware.ts`, `lib/supabase/__tests__/middleware.test.ts`
- Current workaround: Manual "keep in sync" comments.
- Blocks: Safe expansion of protected app surface.
- Implementation complexity: Low.

## Test Coverage Gaps

**No automated tests for Supabase Edge function handlers:**
- What's not tested: Request validation, auth behavior, and failure paths in `supabase/functions/*/index.ts`.
- Risk: Runtime regressions in production-only code paths.
- Priority: High.
- Difficulty to test: Medium (requires Deno/edge harness and fixtures).

**Billing webhook flow lacks integration tests:**
- What's not tested: End-to-end idempotency and multi-table side effects under retries.
- Files: `app/api/billing/webhook/route.ts`, `services/billingService.ts`, `services/creditService.ts`
- Risk: Duplicate charges/credits or partial state updates.
- Priority: High.
- Difficulty to test: Medium-High.

**Auth protection matrix is only partially covered:**
- What's not tested: Full `(app)` route coverage against middleware protected-route config.
- Files: `middleware.ts`, `lib/supabase/middleware.ts`, `lib/supabase/__tests__/middleware.test.ts`
- Risk: New private routes accidentally exposed or degraded.
- Priority: High.
- Difficulty to test: Low.

**Silent-error UX branches are untested:**
- What's not tested: Fallback behavior when deck loading/transcription/audio playback fails.
- Files: `app/(app)/session/page.tsx`, `app/(app)/upload/page.tsx`, `hooks/useSTT.ts`
- Risk: Hidden failures and poor debuggability in user-facing flows.
- Priority: Medium.
- Difficulty to test: Low-Medium.

---

*Concerns audit: 2026-03-04*
*Update as issues are fixed or new ones discovered*
