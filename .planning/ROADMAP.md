# Roadmap: Pitchr Brand Experience Growth Surfaces

## Milestones

- 🚧 **v1.1 Brand Experience Growth Surfaces** - Phases 5-8 (in progress)

## Overview

This roadmap shifts Pitchr's next milestone toward public, no-login growth surfaces. The sequence starts by fixing route ownership and crawlable rendering, then builds the three deep-dive pages, layers in premium motion and a flagship interactive scoring demo, and finally hardens conversion and discoverability so the new public surfaces can convert and compound authority.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 5: Public IA and SEO Foundation** - Landing and public routes become server-first, crawlable, and ready for deep-dive pages.
- [ ] **Phase 6: Deep-Dive Pages and Content System** - Delivery Rubric, Scoring Logic, and Growth Pricing pages ship with shared content and section architecture.
- [ ] **Phase 7: Motion, Demos, and Brand System** - A shared motion layer and one flagship interactive scoring demo bring the new public pages to life.
- [ ] **Phase 8: Conversion and Discoverability Hardening** - Page-specific signup routing, attribution, and crawl/discoverability validation turn the new surfaces into a working growth system.

## Phase Details

### Phase 5: Public IA and SEO Foundation
**Goal**: Public marketing routes become server-first, indexable, and structurally ready for dedicated deep-dive pages.
**Depends on**: Phase 4
**Requirements**: SURF-01, SURF-02, SURF-03, SURF-04, DISC-01
**Success Criteria** (what must be TRUE):
  1. Visitor can navigate from the landing hub to dedicated Delivery Rubric, Scoring Logic, and Growth Pricing routes.
  2. Each new route has unique metadata, canonical URL, and sitemap coverage.
  3. Source HTML for the new public routes contains meaningful explanatory content before client JS runs.
**Plans**: 2 plans

Plans:
- [x] 05-01: Decompose marketing route ownership and move SEO-critical content to server-rendered surfaces
- [x] 05-02: Implement metadata, schema, sitemap, breadcrumb, and internal-link foundations for new public pages

### Phase 6: Deep-Dive Pages and Content System
**Goal**: Pitchr ships three dedicated public deep-dive pages backed by reusable content and facts.
**Depends on**: Phase 5
**Requirements**: DRUB-01, DRUB-02, LOGC-01, LOGC-02, PRIC-01, PRIC-02, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. Delivery Rubric page explains delivery evaluation in plain language and includes an annotated example.
  2. Scoring Logic page explains how Pitchr scores a pitch and clearly states what is and is not scored.
  3. Growth Pricing page explains free-tier access and upgrade thresholds in concrete terms.
  4. Deep-dive pages are linked to one another and to the existing `/blog` Journal surface in a coherent public content cluster.
**Plans**: 2 plans

Plans:
- [ ] 06-01: Build Delivery Rubric and Scoring Logic content surfaces with reusable section components
- [ ] 06-02: Build Growth Pricing surface and align Journal or blog linking with the new public information architecture

### Phase 7: Motion, Demos, and Brand System
**Goal**: Public deep-dive pages gain a shared interaction system and one flagship interactive scoring demo without sacrificing legibility.
**Depends on**: Phase 6
**Requirements**: LOGC-03, MOTN-01, MOTN-02
**Success Criteria** (what must be TRUE):
  1. Scoring Logic page includes one flagship interactive scored example or simulator.
  2. New public pages share a recognizable motion system and brand interaction language.
  3. Reduced-motion and mobile users can access all page meaning without depending on animation.
**Plans**: 2 plans

Plans:
- [ ] 07-01: Implement shared motion utilities, fallbacks, and reusable visual interaction patterns
- [ ] 07-02: Build the flagship scoring demo and page-specific storytelling visuals

### Phase 8: Conversion and Discoverability Hardening
**Goal**: The new public surfaces convert intent into free signup and validate their discoverability quality.
**Depends on**: Phase 7
**Requirements**: CONV-01, CONV-02
**Success Criteria** (what must be TRUE):
  1. Every deep-dive page includes strong page-specific free-signup CTA placements above the fold and near the end of the page.
  2. Signup or trial routing preserves page intent or attribution for measurement.
  3. Public growth pages pass crawlability, indexing, and discoverability verification after launch hardening.
**Plans**: 2 plans

Plans:
- [ ] 08-01: Implement conversion CTA routing, page-intent attribution, and signup handoff
- [ ] 08-02: Harden performance, crawlability, and discoverability verification for the new public cluster

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Public IA and SEO Foundation | 2/2 | Complete | 05-01, 05-02 |
| 6. Deep-Dive Pages and Content System | 0/2 | Not started | - |
| 7. Motion, Demos, and Brand System | 0/2 | Not started | - |
| 8. Conversion and Discoverability Hardening | 0/2 | Not started | - |
