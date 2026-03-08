# Pitchr: Project-Specific Rubric Context

## What This Is

Pitchr is a pitch coaching app that analyzes user submissions and returns scoring plus actionable feedback. This milestone pivots growth to public, no-login surfaces that explain value clearly and convert visitors into free users. The primary audience for this milestone is first-time visitors evaluating whether Pitchr can solve their scoring and feedback needs.

## Core Value

Users get feedback that reflects their actual project-specific rubric and constraints, not generic pitch advice.

## Current Milestone: v1.1 Brand Experience Growth Surfaces

**Goal:** Expand public, no-login surfaces into high-conviction growth pages that convert visitors into free-trial users and improve SEO/GEO discoverability.

**Target features:**
- Dedicated public deep-dive pages for Delivery Rubric, Growth Pricing, Journal, and Scoring Logic
- Shared visual language and interaction system across all public pages (layout, motion, graphics, and components)
- Problem-intent content architecture and metadata to improve search discovery and LLM retrieval
- Consistent free-tier signup calls-to-action across all public pages
- Inspiring interactive demos and scroll narratives tied directly to Pitchr scoring use cases

## Requirements

### Validated

- [x] Users can submit a pitch and receive rubric-based analysis feedback - existing
- [x] Users can review analysis results with score breakdown and recommendations - existing
- [x] Users can work across multiple projects and navigate project-specific workflows - existing
- [x] Users can open project rubric/context settings and save valid context text - phase 01

### Active

- [ ] Public visitors can navigate from the landing page hub to dedicated no-login detail pages for Delivery Rubric, Growth Pricing, Journal, and Scoring Logic
- [ ] Each public detail page explains a concrete user problem and maps it to Pitchr's solution with a clear free-tier signup CTA
- [ ] Public pages share a consistent visual and motion system aligned with existing brand themes, animations, and UI patterns
- [ ] Public pages include high-quality, context-relevant demos or visualizations that clarify scoring logic and product value
- [ ] SEO and GEO foundations are implemented across public pages (semantic structure, metadata, structured data, and LLM-readable explanations)

### Out of Scope

- Finishing prior rubric roadmap phases 2-4 during this milestone - deliberately deferred to prioritize public growth surfaces
- Full platform rebrand outside public surfaces - deferred; this milestone aligns with current brand system rather than replacing it
- File upload and document parsing for rubric ingestion - deferred to a later version
- Per-run include/exclude toggles for project rubric context - deferred; v1 always applies saved context

## Context

The existing architecture already has a scoring pipeline (`prepAgentService` -> `judgeAgentService` -> `scoringService`) and project-oriented UI surfaces where users manage work. New work targets publicly available pages that sit before login and should communicate trust, quality, and product differentiation. You asked for visually ambitious pages with strong graphics and scroll-driven interactions that remain grounded in Pitchr's scoring problem.

## Constraints

- **Conversion**: Primary CTA across public pages should drive free signup with limited free use
- **Design Consistency**: New pages must preserve existing design themes, motion language, and brand elements already present across the platform
- **SEO/GEO**: Content must be structured for both traditional search indexing and LLM retrieval/recommendation
- **Scope**: Focus on public no-login surfaces only for this milestone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Start milestone v1.1 before completing rubric phases 2-4 | Prioritize top-of-funnel growth and discoverability to support adoption | - Pending |
| Use hub + dedicated deep-dive page IA for public surfaces | Supports both conversion clarity and problem-intent SEO/GEO coverage | - Pending |
| Make free signup the default CTA on new public pages | Aligns content directly to product usage and measurable funnel outcomes | - Pending |
| Favor bold motion-rich storytelling tied to product logic | Differentiates brand while educating users on scoring approach | - Pending |

---
*Last updated: 2026-03-08 after starting milestone v1.1*
