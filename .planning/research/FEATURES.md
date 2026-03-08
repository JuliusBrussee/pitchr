# Feature Research

**Domain:** Public problem-intent deep-dive pages for Pitchr v1.1 growth surfaces
**Researched:** 2026-03-08
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

#### Information Architecture

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Intent-specific hub-and-spoke page set | Best product-led sites give each core problem or use case its own destination instead of forcing every query into one long landing page. | MEDIUM | One canonical page each for Delivery Rubric, Scoring Logic, Growth Pricing, and Journal. Each page needs its own slug, title, H1, meta description, and internal links. GEO note: make the page topic and entity clear in the URL, title, and opening copy. |
| Visible page hierarchy and jump navigation | Strong long-form product pages make scanning easy and show users where they are in the product story. | LOW | Use breadcrumbs plus an in-page section nav for long pages. Breadcrumb structured data is worth implementing because it helps both users and crawlers interpret hierarchy. |
| Cross-link network between deep pages and supporting surfaces | Users and crawlers expect a coherent cluster, not isolated pages with no semantic relationship. | MEDIUM | Every page should link to adjacent surfaces: Journal, Pricing, Scoring Logic, Delivery Rubric, and free signup. This is table stakes for both SEO and LLM retrieval context. |

#### Content Modules

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Answer-first hero with explicit problem, audience, and outcome | Best-in-class product pages immediately answer what the product does, who it is for, and why this page exists. | LOW | The first 150-200 words should define Pitchr, the page topic, the user problem, and the promised output in plain language. Important copy must be text, not animation-only. |
| How-it-works explainer with annotated visuals or demos | Visitors expect to see the workflow before they commit to signup. | MEDIUM | Each page needs one concrete narrative: input -> scoring or feedback -> outcome. Delivery Rubric and Scoring Logic especially need step-by-step explanation supported by screenshots or visual examples. |
| Trust, proof, and objection-handling block | Product-led pages routinely include proof, guardrails, and common objections so users do not need to dig elsewhere. | MEDIUM | Include proof of product quality, methodology guardrails, limitations, and trust signals. For Growth Pricing, this also means explicit free-plan clarity and upgrade boundaries. |
| Plain-language FAQ or Q&A section | Users expect direct answers to core objections without leaving the page. | LOW | Good for skimming and extraction. Keep Q&A visible in HTML. Do not rely on FAQ rich results because Google limits those for most non-government and non-health sites. |
| Crawlable SEO and GEO baseline content structure | Search and AI features depend on helpful text, hierarchy, internal links, and structured data that matches visible content. | MEDIUM | Use a clean H1/H2 structure, canonical tags, breadcrumbs, sitemap inclusion, internal links, textual summaries, and structured data that mirrors visible copy. Journal entries should also use Article metadata. |

#### Conversion Modules

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Persistent free-signup CTA with page-specific copy | Product-led sites let visitors self-serve directly from every deep page. | LOW | Use a hero CTA, one mid-page CTA, and one bottom CTA. Match the CTA copy to intent, for example `Try free rubric scoring` or `See your scoring logic`. |
| Low-friction CTA support modules | Users need enough context to say yes without booking sales or reading more pages first. | LOW | Support CTA conversion with a concise free-plan summary, what happens after signup, and at least one sample result or preview. Keep sales or demo requests secondary. |

### Differentiators (Competitive Advantage)

#### Information Architecture

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Knowledge-cluster linking across Delivery Rubric, Scoring Logic, Journal, and Pricing | Makes Pitchr feel like a coherent authority rather than a set of unrelated marketing pages. | MEDIUM | Each page should explicitly explain how it connects to the others. This improves user comprehension and also helps LLM retrieval because entity relationships are stated, not implied. |

#### Content Modules

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Interactive scored example or rubric simulator | Lets visitors see rubric-grounded feedback instead of reading abstract claims about AI scoring. | HIGH | Strongest differentiator for Pitchr. A sample pitch with score changes is more convincing than generic motion or abstract UI. |
| Citation-backed methodology blocks | Turns `AI scoring` into auditable reasoning with sources, constraints, and evidence. | MEDIUM | Most useful on Scoring Logic and Delivery Rubric pages. Link factual claims to first-party methodology, product evidence, or authoritative external sources when relevant. GEO note: cited claims are easier to trust and quote. |
| Before-and-after or generic-vs-rubric comparison module | Makes Pitchr's core value legible fast: project-specific rubric feedback beats generic pitch advice. | MEDIUM | High-value module for visitors arriving from comparison or problem-intent queries. Can be static at launch and interactive later. |
| Journal insight snippets embedded into deep pages | Converts the Journal from a blog into proof and supporting context for product pages. | MEDIUM | Pull one or two concise insights from Journal content with links back to the full article. This adds freshness and depth without turning the product page into an article. |
| Transparent `what we score` and `what we do not score` section | Builds trust, sharpens entity clarity, and reduces overclaim risk. | LOW | Especially valuable on Scoring Logic. LLMs also benefit when page boundaries and definitions are explicit. |

#### Conversion Modules

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Intent-aware signup routing | Preserves the page story into the free signup flow instead of restarting the user journey after the click. | MEDIUM | Example: visitors from Delivery Rubric land in a rubric-scoring first run; Pricing visitors land on free-tier activation. Requires attribution plumbing and deep links. |
| Page-specific sample asset handoff | Gives visitors something tangible before signup, increasing confidence without hiding the main value behind a gate. | MEDIUM | Example assets: sample score report, rubric checklist, or scoring explainer PDF derived from first-party content. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Dozens of thin keyword pages generated from one template | Feels like fast SEO coverage for every pitch or scoring phrase. | Google warns against mass content made mainly to attract search visits. Thin pages also weaken trust and LLM retrieval quality. | Build one strong page per real intent cluster, then expand only where Pitchr has distinct first-party expertise and unique examples. |
| Motion-first pages where core facts only exist in video, canvas, or scroll effects | Feels premium and visually distinctive. | Google says important content for AI features should be available in textual form. LLMs also miss or underweight facts hidden inside animation layers. | Keep motion as support. Put definitions, claims, steps, and FAQs in rendered HTML text. |
| GEO gimmicks as a substitute for crawlable pages | Teams hear about `llms.txt`, AI-only feeds, or other supposed GEO shortcuts. | Google says there are no extra AI-feature technical requirements and no special AI text files or schema needed. Chasing gimmicks delays the work that actually matters. | Focus on crawlability, internal linking, entity clarity, citations, and structured data that matches visible content. Treat `llms.txt` as experimental only. |
| Over-claiming opaque AI authority | Sounds persuasive because it promises magic. | It undermines trust, weakens people-first content quality, and gives LLMs nothing grounded to quote accurately. | Show methodology, scored examples, explicit limits, and proof instead of vague `our AI knows best` claims. |
| High-friction conversion on product-intent pages | Demo forms and sales-first CTAs feel safer to internal stakeholders. | This conflicts with the milestone goal of free-signup conversion and breaks product-led intent for visitors arriving from search or AI answers. | Keep free signup as the default CTA. Demo or sales contact should remain secondary. |
| FAQ schema as a primary SEO strategy | Teams remember older FAQ rich-result wins. | Google limits FAQ rich results to well-known government and health sites, so SaaS pages should not plan around this tactic. | Keep strong visible Q&A for users and extraction. Use breadcrumb and article schema where it actually fits. |

## GEO-Specific Requirements

- Keep primary claims, definitions, and answers in rendered HTML text. Animations, diagrams, and videos should reinforce the copy, not contain the only copy.
- Make entity relationships explicit in the opening sections: `Pitchr`, the page topic (`Delivery Rubric`, `Scoring Logic`, `Growth Pricing`, `Journal`), the target user, and the output they get.
- Use structured data that matches visible content. `BreadcrumbList` is worth using across all deep pages. `Article` is appropriate for Journal entries. Treat `FAQPage` as low-ROI for Google rich results, but keep visible Q&A blocks.
- Support major claims with first-party proof or cited external sources. For Pitchr, `how scoring works`, `what free includes`, and any performance or statistical claim should link to evidence.
- Ensure discoverability is not accidentally blocked. Allow Googlebot, OAI-SearchBot, and Claude search crawlers where intended, validate canonical and indexing behavior, and keep deep pages in the XML sitemap and internal link graph.

## Page-Type Mapping

| Page | Primary Search Intent | Must-Have Modules |
|------|-----------------------|-------------------|
| Delivery Rubric | `how to score pitch delivery`, `pitch rubric feedback` | answer-first hero, rubric dimensions, scored example, methodology proof, FAQ, free-signup CTA |
| Scoring Logic | `how pitch scoring works`, `AI pitch scoring explained` | methodology explainer, `what we score / do not score` block, cited proof, demo, FAQ, CTA |
| Growth Pricing | `Pitchr pricing`, `free pitch scoring tool pricing` | free-plan clarity, plan comparison, upgrade triggers, FAQ, repeated CTA |
| Journal | problem-intent educational queries | article template, author and date, citations, explicit connection to product page, contextual CTA |

## Feature Dependencies

```text
[Intent-Specific Page IA]
  -> requires -> [Problem or keyword cluster map]
  -> requires -> [Unique metadata + canonical + sitemap inclusion]

[Visible Entity Framing]
  -> enables -> [LLM-readable extraction]
  -> enables -> [FAQ and direct-answer blocks]

[How-It-Works + Scored Example]
  -> requires -> [Reusable demo assets]
  -> enhances -> [Trust and CTA conversion]

[Citation-Backed Methodology]
  -> requires -> [Source library + editorial review]
  -> strengthens -> [Scoring Logic page]
  -> strengthens -> [Delivery Rubric page]

[Intent-Aware Signup Routing]
  -> requires -> [Attribution + deep-link support]
  -> enhances -> [Free CTA conversion]

[Journal-to-Product Linking]
  -> requires -> [Consistent entity vocabulary]
  -> enhances -> [Authority cluster]
  -> enhances -> [Internal linking]

[Thin Programmatic Page Expansion]
  -> conflicts -> [People-first authority pages]
```

### Dependency Notes

- **Intent-Specific Page IA requires a problem or keyword cluster map:** each page needs one dominant intent so the title, H1, CTA, and internal links do not blur together.
- **Visible Entity Framing enables LLM-readable extraction:** AI systems retrieve better when the page states exactly what Pitchr is, what the page is about, and who it serves.
- **How-It-Works + Scored Example requires reusable demo assets:** the same sample pitch, transcript, and score data should power multiple pages to keep claims consistent.
- **Citation-Backed Methodology requires a source library and editorial review:** once Pitchr cites scoring logic or statistics, it needs a repeatable way to keep those claims current and defensible.
- **Intent-Aware Signup Routing requires attribution and deep links:** conversion modules are strongest when the signup flow continues the exact story the page started.
- **Journal-to-Product Linking requires consistent entity vocabulary:** the same terms for rubric, scoring logic, and free plan should appear across product pages and Journal content.
- **Thin programmatic expansion conflicts with people-first authority pages:** scale should only happen after the first four pages prove demand and content quality.

## MVP Definition

### Launch With (v1)

- [ ] Intent-specific hub-and-spoke IA for the four new public pages with unique metadata, breadcrumbs, and internal links.
- [ ] Answer-first hero, how-it-works module, trust or FAQ block, and repeated free-signup CTA on every deep page.
- [ ] Crawlable SEO and GEO baseline: canonical and indexable pages, important copy in HTML text, sitemap inclusion, and structured data that matches visible content.
- [ ] One concrete product demo or scored example on each page, with the strongest interactive version reserved for Delivery Rubric or Scoring Logic.

### Add After Validation (v1.x)

- [ ] Interactive rubric simulator with live score deltas after static scored-example blocks prove useful.
- [ ] Citation-backed methodology and comparison modules once the editorial and source workflow is stable.
- [ ] Intent-aware signup routing once attribution data shows which pages and CTA variants convert best.

### Future Consideration (v2+)

- [ ] Carefully expanded long-tail page set, only where Pitchr has genuine first-party expertise and unique examples.
- [ ] Experimental AI-discovery add-ons such as `llms.txt` or machine-readable knowledge exports, but only after the core pages are already crawlable and cited.
- [ ] Deeper personalization by visitor segment or acquisition source, once the baseline public page system is converting.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Intent-specific hub-and-spoke IA | HIGH | MEDIUM | P1 |
| Answer-first hero + entity framing | HIGH | LOW | P1 |
| How-it-works explainer + demo | HIGH | MEDIUM | P1 |
| Trust / FAQ / objection handling | HIGH | MEDIUM | P1 |
| Free-signup CTA system | HIGH | LOW | P1 |
| Crawlable SEO and GEO baseline | HIGH | MEDIUM | P1 |
| Interactive scored example or simulator | HIGH | HIGH | P2 |
| Citation-backed methodology blocks | HIGH | MEDIUM | P2 |
| Journal-to-product knowledge cluster | MEDIUM | MEDIUM | P2 |
| Intent-aware signup routing | MEDIUM | MEDIUM | P2 |
| Long-tail page expansion | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Notion AI Meeting Notes | Figma Dev Mode | Stripe Billing | Our Approach |
|---------|-------------------------|----------------|----------------|--------------|
| Problem-led hero + free CTA | Strong hero, immediate free CTA, proof near the top | Clear persona framing, free CTA, secondary sales path | Clear hero, product summary, start now plus contact sales | Match this with page-specific free CTA copy tied to Pitchr intent |
| Scan-friendly long-page structure | Broad ecosystem nav, page relies on guided section flow | Clear section progression for developer use case | Explicit Overview, Features, Pricing, and Docs pathways | Use breadcrumbs plus in-page jump nav on every long-form page |
| Product walkthrough visuals | Multiple workflow visuals and use-case blocks | Deep capability blocks with screenshots and related links | Feature breakdown with linked docs and guides | Use annotated scoring examples and visual rubric explanations |
| Trust, proof, and Q&A | Logos, quotes, security and privacy, Q&A | Logos, customer proof, supporting help content | Docs, guides, pricing clarity, repeated CTA | Combine proof with explicit methodology and scoring boundaries |
| Connected ecosystem paths | Links to buyer guides, pricing, use cases, and help | Links to help docs and code resources | Links to docs, pricing, and guides | Build a tighter Journal + product-page cluster than competitors typically show |

## Sources

- `C:\dev\pitchr\.planning\PROJECT.md`
- Google Search Central, "Creating helpful, reliable, people-first content" (HIGH): https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Search Central, "AI features and your website" (HIGH): https://developers.google.com/search/docs/appearance/ai-features
- Google Search Central, "Breadcrumb (`BreadcrumbList`) structured data" (HIGH): https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- Google Search Central, "Article structured data" (HIGH): https://developers.google.com/search/docs/appearance/structured-data/article
- Google Search Central, "FAQ (`FAQPage`) structured data" (HIGH for feature limitation guidance): https://developers.google.com/search/docs/appearance/structured-data/faqpage
- OpenAI, "Overview of OpenAI crawlers" (HIGH): https://developers.openai.com/api/docs/bots
- Claude Help Center, "Does Anthropic crawl data from the web, and how can site owners block the crawler?" (HIGH): https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Notion, AI Meeting Notes product page (MEDIUM, observed product-page pattern): https://www.notion.com/product/ai-meeting-notes
- Figma, Dev Mode product page (MEDIUM, observed product-page pattern): https://www.figma.com/dev-mode/
- Stripe, Billing product page (MEDIUM, observed product-page pattern): https://stripe.com/billing

---
*Feature research for: Public deep-dive pages for Pitchr v1.1 growth surfaces*
*Researched: 2026-03-08*
