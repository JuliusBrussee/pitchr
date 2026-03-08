# Requirements: Pitchr Brand Experience Growth Surfaces

**Defined:** 2026-03-08
**Core Value:** Users get feedback that reflects their actual project-specific rubric and constraints, not generic pitch advice.

## v1 Requirements

### Public Surfaces

- [x] **SURF-01**: Public visitor can navigate from the landing page hub to a dedicated Delivery Rubric page.
- [x] **SURF-02**: Public visitor can navigate from the landing page hub to a dedicated Scoring Logic page.
- [x] **SURF-03**: Public visitor can navigate from the landing page hub to a dedicated Growth Pricing page.
- [x] **SURF-04**: Public deep-dive pages share a consistent marketing shell, internal links, and section structure.

### Delivery Rubric

- [ ] **DRUB-01**: Delivery Rubric page explains how Pitchr evaluates delivery-specific pitch signals in plain language.
- [ ] **DRUB-02**: Delivery Rubric page shows a concrete scored example or annotated visual that makes delivery feedback legible to a first-time visitor.

### Scoring Logic

- [ ] **LOGC-01**: Scoring Logic page explains how Pitchr turns a pitch input into a score, ranked fixes, and rewritten guidance.
- [ ] **LOGC-02**: Scoring Logic page explicitly states what Pitchr scores and what it does not score.
- [ ] **LOGC-03**: Scoring Logic page includes one flagship interactive scored example or simulator for visitors.

### Growth Pricing

- [ ] **PRIC-01**: Growth Pricing page clearly explains free-tier access, usage limits, and paid upgrade boundaries.
- [ ] **PRIC-02**: Growth Pricing page ties plan value to concrete user outcomes rather than generic pricing copy.

### Conversion

- [ ] **CONV-01**: Every deep-dive page includes a primary free-signup CTA above the fold and near the end of the page.
- [ ] **CONV-02**: CTA copy reflects the page's user intent instead of using one generic message everywhere.

### Discoverability

- [ ] **DISC-01**: Every deep-dive page ships with unique title, meta description, canonical URL, OG data, and sitemap inclusion.
- [ ] **DISC-02**: Every deep-dive page keeps its core explanation in semantic HTML text with answer-first structure.
- [ ] **DISC-03**: Every deep-dive page includes internal links, breadcrumbs, and structured data that match visible page content.

### Motion and UX

- [ ] **MOTN-01**: New public pages use a shared motion system that preserves brand consistency without making animation required for comprehension.
- [ ] **MOTN-02**: Reduced-motion and mobile users get a fully legible fallback experience on all new public pages.

## Future Requirements

### Journal Expansion

- **JOUR-01**: Existing `/blog` hub is visually refreshed and positioned as Journal support content within the public growth system.
- **JOUR-02**: Journal articles include stronger related-page links and conversion modules back to public deep-dive pages.
- **JOUR-03**: `/journal` alias or full route migration is introduced only with a redirect and canonical plan.

### Demo Expansion

- **DEMO-01**: Delivery Rubric page adds its own interactive simulator after the flagship Scoring Logic demo proves useful.
- **DEMO-02**: Multiple public pages gain richer interactive demos beyond the first flagship experience.

### Expansion Surfaces

- **COMP-01**: Comparison or use-case pages are added once the first three deep-dive pages establish a clear content cluster.
- **GEO-01**: Additional structured knowledge exports or experimental GEO artifacts are added after the crawlable pages are proven.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Completing prior rubric roadmap phases 2-4 in this milestone | This milestone is intentionally focused on public growth surfaces, not private scoring-flow continuation |
| Full `/blog` to `/journal` route migration now | Adds redirect and canonical migration risk without improving first-launch page quality |
| Interactive demos on every new public page | Too much complexity for the first release; one flagship interactive demo is higher leverage |
| New CMS or content platform | The repo already has a working MDX content pipeline that is sufficient for this milestone |
| Site-wide 3D or WebGL-first presentation layer | High performance and accessibility risk for little first-release value |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SURF-01 | Phase 5 | Complete |
| SURF-02 | Phase 5 | Complete |
| SURF-03 | Phase 5 | Complete |
| SURF-04 | Phase 5 | Complete |
| DRUB-01 | Phase 6 | Pending |
| DRUB-02 | Phase 6 | Pending |
| LOGC-01 | Phase 6 | Pending |
| LOGC-02 | Phase 6 | Pending |
| LOGC-03 | Phase 7 | Pending |
| PRIC-01 | Phase 6 | Pending |
| PRIC-02 | Phase 6 | Pending |
| CONV-01 | Phase 8 | Pending |
| CONV-02 | Phase 8 | Pending |
| DISC-01 | Phase 5 | Pending |
| DISC-02 | Phase 6 | Pending |
| DISC-03 | Phase 6 | Pending |
| MOTN-01 | Phase 7 | Pending |
| MOTN-02 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after milestone v1.1 scoping*
