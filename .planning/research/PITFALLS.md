# Pitfalls Research

**Domain:** Hackathon-mode pitch scoring with corpus-derived guidance (brownfield extension)
**Researched:** 2026-03-05
**Confidence:** MEDIUM

## Phase Legend

- **Phase H1 - Corpus Sourcing and Provenance Verification:** Build the winner corpus, verify source legitimacy, and enforce rights/compliance checks.
- **Phase H2 - Transcription Quality and Normalization:** Transcribe, clean, and quality-gate transcripts before analysis.
- **Phase H3 - Rubric Extraction and Calibration:** Derive rubric dimensions from corpus patterns and calibrate against human judgments.
- **Phase H4 - Hackathon Mode Integration:** Implement `hackathon` mode in existing prep/judge/scoring flows with regression protection.
- **Phase H5 - Evidence UX and Q&A Parity:** Show evidence-backed coaching and keep Q&A behavior consistent with existing mode UX.
- **Phase H6 - Security, Monitoring, and Launch Gates:** Hardening, adversarial testing, production observability, and go/no-go gates.

## Critical Pitfalls

### Pitfall 1: "Winner Corpus" Contamination (Non-winners Mixed In)

**What goes wrong:**
The model learns from polished but non-winning demos, sponsor promos, or mislabeled submissions. Scoring then drifts away from what actually wins.

**Why it happens:**
Teams ingest by keyword ("hackathon winner") without storing objective proof of win status, event context, and judging criteria.

**How to avoid:**
Require a provenance schema per item: event name, year, prize tier, proof URL, verification status, verifier, verification timestamp. Reject items that fail proof checks.

**Warning signs:**
- Corpus rows missing prize tier or proof URL.
- Rapid corpus growth with little manual verification effort.
- Pattern extraction surfaces generic startup advice instead of judging-linked signals.

**Phase to address:**
Phase H1

---

### Pitfall 2: Rights/Policy Violations During Video and Caption Ingestion

**What goes wrong:**
Ingestion pipeline depends on scraping or unauthorized caption download paths, causing legal/policy risk and unstable data supply.

**Why it happens:**
Speed pressure in hackathon-mode rollout leads teams to use unofficial scraping tools instead of API- and consent-backed ingestion.

**How to avoid:**
Implement source-policy checks in H1: only approved ingestion methods, explicit rights metadata, and fail-closed behavior for uncertain rights. Keep a per-source compliance log.

**Warning signs:**
- Frequent `403 forbidden` caption download errors.
- Missing authorization-scope tracking in ingestion logs.
- Any "temporary scraper" added to unblock corpus growth.

**Phase to address:**
Phase H1

---

### Pitfall 3: Transcript Fidelity Bias (Accent/Audio Quality Blindness)

**What goes wrong:**
Rubric extraction and scoring are based on noisy transcripts, unfairly penalizing speakers with accents, noisy recordings, or rapid delivery.

**Why it happens:**
Teams treat transcript text as ground truth and skip quality scoring, confidence thresholds, and sampling review.

**How to avoid:**
Add transcript quality gates (WER proxy, confidence thresholds, silence/noise flags), plus human spot-audit for low-confidence segments and edge accents before feature extraction.

**Warning signs:**
- Large variance between transcript and audio in spot checks.
- Low-confidence token rate not tracked.
- Systematically lower scores for similar content in lower-quality audio.

**Phase to address:**
Phase H2

---

### Pitfall 4: Survivorship-Only Rubric (No Context Calibration)

**What goes wrong:**
Rubric overfits to presentation style patterns from winners while missing context factors (track, audience, constraints), producing brittle advice.

**Why it happens:**
Teams extract "common winner traits" but do not stratify by event type or compare against non-winning but high-quality baselines.

**How to avoid:**
Stratify corpus by event type and rubric axis, then calibrate extracted traits against a validation set scored by humans. Keep rubric dimensions explicit and bounded.

**Warning signs:**
- Advice repeatedly pushes one style regardless of pitch context.
- High correlation with surface traits (length, polish) but weak judge agreement.
- Rubric dimensions cannot be traced to validated evidence slices.

**Phase to address:**
Phase H3

---

### Pitfall 5: LLM-as-Judge Bias and Score Instability

**What goes wrong:**
Scores fluctuate across reruns and can favor longer answers or prompt ordering effects rather than true pitch quality.

**Why it happens:**
Single-pass judging with no bias controls, no calibration set, and no inter-run stability thresholds.

**How to avoid:**
Use fixed rubric prompts, order randomization for pairwise evaluations, repeated sampling, and variance thresholds. Gate launch on human-judge agreement and stability metrics.

**Warning signs:**
- Same pitch receives materially different rubric scores on reruns.
- Longer outputs consistently score higher without better factual quality.
- Model family changes cause silent score shifts.

**Phase to address:**
Phase H3 (design/calibration) and Phase H6 (release gate)

---

### Pitfall 6: Ungrounded Coaching (No Evidence Backlinks)

**What goes wrong:**
Feedback sounds plausible but is not tied to concrete winner-corpus evidence, reducing trust and making corrections hard.

**Why it happens:**
Prompting asks for "actionable advice" but does not require citation to retrieved snippets or pattern IDs.

**How to avoid:**
Enforce structured output: each recommendation must include evidence IDs, snippet references, confidence, and rubric dimension impacted. Reject uncited advice in post-processing.

**Warning signs:**
- Recommendations cannot be traced to corpus rows.
- Users ask "why this suggestion?" and product cannot answer.
- High narrative quality, low reproducibility in audit.

**Phase to address:**
Phase H4 (generation contract) and Phase H5 (UX exposure)

---

### Pitfall 7: Corpus and Prompt Injection Through Untrusted Content

**What goes wrong:**
Malicious corpus items or user prompts inject instructions into retrieval context, distorting scoring or leaking sensitive information.

**Why it happens:**
RAG content is treated as trusted data, with no sanitization, isolation, or adversarial testing.

**How to avoid:**
Sanitize/strip instruction-like payloads in corpus ingestion, isolate system prompts from retrieved text, add retrieval allowlists, and run poisoning/prompt-injection red-team tests before launch.

**Warning signs:**
- Retrieved chunks contain imperative "ignore previous" style language.
- Scoring output includes irrelevant links/instructions from corpus text.
- Security tests are missing from release checklist.

**Phase to address:**
Phase H1 (ingestion hardening) and Phase H6 (security validation)

---

### Pitfall 8: Parallel Hackathon Pipeline That Bypasses Existing Flow

**What goes wrong:**
A separate hackathon code path diverges from current `prepAgentService -> judgeAgentService -> scoring` behavior, causing regressions and maintenance overhead.

**Why it happens:**
Teams optimize for speed and fork architecture instead of adding a mode configuration that reuses current orchestration.

**How to avoid:**
Implement hackathon as a mode extension, not a new pipeline. Add parity tests for scoring shape, regeneration, and `qa_1min`-style behavior.

**Warning signs:**
- Duplicate judge orchestration files/services.
- Fixes needed in one mode but not others.
- Existing elevator/VC tests stop covering shared behavior.

**Phase to address:**
Phase H4

---

### Pitfall 9: Evaluation Leakage and False Confidence

**What goes wrong:**
Offline metrics look excellent because test items overlap with development corpus/prompt-tuning data, but live quality drops.

**Why it happens:**
No locked holdout set, no temporal split, and no explicit human-labeled ground-truth benchmark for regression checks.

**How to avoid:**
Create frozen eval sets (dev, holdout, canary), enforce no-overlap checks, and require ground-truth labels/human comparisons before shipping rubric or prompt changes.

**Warning signs:**
- Near-perfect offline scores with poor user acceptance.
- Eval set frequently edited during prompt tuning.
- No audit trail proving train/eval separation.

**Phase to address:**
Phase H3 (eval design) and Phase H6 (release enforcement)

---

## Technical Debt Patterns

Shortcuts that look fast in a milestone but become expensive in this domain.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip provenance fields for corpus rows | Faster ingestion | Cannot audit winner legitimacy; rubric trust collapses | Never |
| Hardcode rubric weights in prompt text | Quick prototyping | Hidden drift and no reproducible scoring | Only for throwaway internal spike |
| No transcript quality metadata | Simpler pipeline | Biased pattern extraction and unfair scoring | Never |
| One giant retrieval index for all modes | Easier setup | Mode cross-contamination and noisy retrieval | Only if strict metadata filters are enforced immediately |
| Launch with no scoring stability budget | Faster release | User trust erosion from score jitter | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| YouTube Data API | Assuming captions are always downloadable | Handle auth scopes, ownership constraints, and explicit 403 failure paths |
| External transcription provider | Treating transcript as authoritative text | Store confidence + segment metadata and run spot audits |
| Retrieval index/vector store | Ingesting raw text with prompt-like instructions | Sanitize, chunk safely, and store trust/provenance metadata |
| Existing Pitchr judge flow | Creating hackathon-only service branch | Add mode config and keep shared orchestration path |
| Q&A generation parity | Shipping scoring without Q&A consistency tests | Add mode-specific Q&A fixtures and parity checks with existing flow |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-corpus retrieval per request | Latency spikes, token cost blowups | Pre-filter by rubric/topic/event metadata before semantic retrieval | Usually visible once corpus exceeds ~300 long transcripts |
| Overlong transcript chunks | Hallucinations and irrelevant citations | Controlled chunking + overlap tuned for spoken language | Often at 8-15 min pitch transcripts |
| Re-scoring entire rubric on every regeneration | Slow UX and inconsistent outputs | Cache stable intermediate features and recompute only changed steps | At moderate concurrent usage (20-50 active analyses) |
| N-to-N comparison workflows for ranking | Queue growth and timeout failures | Use rubric-based absolute scoring with selective pairwise tie-breakers | At >100 submissions per judging wave |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Accepting corpus text as trusted instructions | Prompt injection can alter scoring behavior | Treat retrieval as untrusted input; isolate system prompt; sanitize retrieved content |
| Storing raw transcripts with PII in broad-access logs | Privacy breach and compliance exposure | Redact sensitive fields, enforce least privilege, set retention and delete workflows |
| Returning sensitive internal metadata in judge rationale | Information disclosure to end users | Strict response schema and output filters for internal fields |
| No poisoning tests on corpus updates | Silent model behavior drift/abuse | Add adversarial corpus tests to H6 release gate |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Opaque score without evidence | Users distrust and ignore recommendations | Show rubric score + evidence snippet + suggested fix per dimension |
| Too many low-priority suggestions | Users cannot act quickly before deadlines | Rank by impact and effort; cap top actions |
| Advice detached from hackathon constraints | Recommendations feel generic and impractical | Include event context (time, team size, judging focus) in output framing |
| Unstable scores between reruns | Perceived randomness undermines product credibility | Show confidence/stability band and rerun reason when score changes |

## "Looks Done But Isn't" Checklist

- [ ] **Corpus ingestion:** Every item has verified winner proof and rights metadata.
- [ ] **Transcription:** Low-confidence segments are flagged and spot-reviewed.
- [ ] **Rubric extraction:** Dimensions are calibrated against human-labeled validation data.
- [ ] **Scoring engine:** Stability thresholds are defined and pass on rerun tests.
- [ ] **Feedback output:** Every recommendation has evidence references.
- [ ] **Mode integration:** Hackathon mode passes parity tests with existing elevator/VC and Q&A flows.
- [ ] **Security:** Prompt-injection and poisoning tests are in CI/release checklist.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Corpus contamination | HIGH | Freeze corpus updates, quarantine unverified items, re-run pattern extraction and recalibration |
| Transcript quality failures | MEDIUM | Re-transcribe low-confidence items, patch quality gates, invalidate affected scores |
| Scoring instability | MEDIUM | Roll back scoring prompt/model version, apply stability controls, rerun benchmark suite |
| Ungrounded coaching | MEDIUM | Enforce citation schema, reprocess outputs, and expose evidence in UI before re-release |
| Injection/poisoning incident | HIGH | Isolate affected index slices, rotate secrets/prompts, run forensic diff and adversarial retest |
| Pipeline divergence regressions | MEDIUM | Re-merge to shared orchestration, delete duplicated logic, restore parity tests |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Winner corpus contamination | Phase H1 | 100% corpus rows have proof URL + verifier + status |
| Rights/policy ingestion violations | Phase H1 | Compliance checks pass; unauthorized caption attempts fail safely |
| Transcript fidelity bias | Phase H2 | Quality metrics tracked; low-confidence review rate meets target |
| Survivorship-only rubric | Phase H3 | Rubric calibrated against human-reviewed stratified validation set |
| LLM judge instability/bias | Phase H3 + H6 | Rerun variance and human-agreement thresholds pass release gate |
| Ungrounded coaching | Phase H4 + H5 | 100% recommendations contain evidence IDs and snippets |
| Corpus/prompt injection | Phase H1 + H6 | Adversarial tests pass; sanitized corpus policy enforced |
| Parallel pipeline divergence | Phase H4 | Shared-flow parity tests green for scoring/regeneration/Q&A |
| Evaluation leakage | Phase H3 + H6 | Holdout set locked; overlap checks and canary regressions pass |

## Sources

- Pitchr project context: `.planning/PROJECT.md` (HIGH confidence)
- Devpost judging setup and limitations (weighted criteria/platform constraints):  
  - https://help.devpost.team/article/230-how-to-set-up-judging (HIGH confidence)  
  - https://help.devpost.team/article/231-how-judging-works (HIGH confidence)  
  - https://help.devpost.com/article/64-judging-public-voting (HIGH confidence)
- OpenAI evals guide (ground-truth labels and test dataset discipline):  
  - https://developers.openai.com/api/docs/guides/evals (HIGH confidence)
- LLM-as-judge vulnerabilities/bias:  
  - https://arxiv.org/abs/2406.12624 (MEDIUM confidence)  
  - https://arxiv.org/abs/2406.07791 (MEDIUM confidence)
- RAG/prompt security risks:  
  - https://owasp.org/www-project-top-10-for-large-language-model-applications/ (HIGH confidence)  
  - https://arxiv.org/abs/2410.14479 (MEDIUM confidence)
- Speech recognition disparity evidence:  
  - https://pubmed.ncbi.nlm.nih.gov/32205437/ (MEDIUM confidence)
- YouTube API policy and caption authorization constraints:  
  - https://developers.google.com/youtube/terms/developer-policies (HIGH confidence)  
  - https://developers.google.com/youtube/v3/docs/captions/download (HIGH confidence)

---
*Pitfalls research for: Hackathon-mode pitch scoring and corpus-derived guidance in Pitchr*
*Researched: 2026-03-05*
