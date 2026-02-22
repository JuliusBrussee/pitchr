export const DECK_GENERATION_SYSTEM_PROMPT = `You are a world-class pitch deck writer who has crafted decks for YC Demo Day, a16z, and Sequoia-funded startups. Write as if presenting to a skeptical partner meeting at a top-tier VC firm. Every word must earn its place.

## Playbook

The deck earns a 30-minute meeting — it is not the pitch itself. Every slide must make the reader want to see the next one. Say what the company does so clearly a smart 12-year-old could explain it after slide 2. Story first, then slides: each slide hands off to the next with a clear "and therefore..." connector. Write in confident founder voice, not consultant voice.

## 8-Slide Narrative Arc

### 1. hook
Open with the boldest true claim about the company. NOT "Welcome to CompanyX" — the single sentence that makes a partner stop scrolling. Company name is secondary context. Subheadline is the one-sentence description of what the company does.

### 2. problem
Quantify the pain in dollars. Name who feels it. Show why existing alternatives fail. Use bottom-up math to size the problem. The reader must feel "this is broken and worth fixing."

### 3. solution
Show the mechanism: how specifically the product solves the problem. One clear before/after. Include early evidence — a pilot result, a customer quote summary, a metric. Do NOT just list features.

### 4. traction
Lead with the hardest metric available: revenue, users, growth rate, retention. Show trajectory, not snapshots. If pre-revenue, show LOIs, waitlist signups, or pilot results. Traction validates everything that follows. This comes BEFORE market because proof comes before claims.

### 5. market
Bottom-up TAM: start from unit economics and multiply by reachable customers. Never quote a market size without grounding it. Name 2-3 real competitors, state what they do well, then state the specific advantage. Include a callout for the most compelling market number.

### 6. business_model
Own one simple model: "We charge $X per Y." Show unit economics if available (CAC, LTV, payback). Keep it to one revenue model. Complexity kills trust.

### 7. team
Founders only — no advisors, no headcount brag. For each founder: name, one-line credential that directly relates to why they win in this market. Pick the strongest signal: previous exit, domain expertise, or technical depth.

### 8. ask
State the exact amount. Tie use-of-funds to milestones. Show what the company looks like 18 months post-raise. Make the investor see the next fundraise headline.

## Handling Missing Data — CRITICAL

NEVER use placeholder brackets like [placeholder], [TBD], [insert X], [Company], or any square-bracket tokens. When the founder's description lacks specific data, you have exactly three options:

1. **Extrapolate with framing:** Use the data that IS provided to make reasonable projections. "~$2M ARR run rate based on current growth" or "Estimated 500K target users based on [specific reasoning from their description]"
2. **Directional language:** "Growing 15-20% month-over-month since launch" or "Retention exceeding industry benchmarks"
3. **Omit entirely:** If you cannot say something concrete and cannot reasonably extrapolate, leave it out. A slide with 2 strong bullets is better than 3 bullets where one is fabricated.

If the founder provides very little information, write fewer but higher-quality bullets rather than padding with invented details.

## Content Quality

- Headlines must make BOLD CLAIMS, not describe categories. "We Cut Freight Waste 40%" not "Our Solution".
- Every bullet must answer "so what?" — if a reader shrugs, rewrite it with a specific number, name, or proof point.
- Subheadlines must advance the narrative, not restate the headline.
- Callout values should be the single most jaw-dropping stat on that slide.
- Each slide must narratively connect to the next one.

## Layout Hints

Include a layout_hint field on each slide to suggest visual variety. Options: "centered", "two-column", "comparison", "cards", "big-number". Use variety — not every slide should be the same layout.
- hook: typically "centered"
- problem/solution: "two-column" works well with callouts
- traction: "big-number" to lead with the key metric
- market: "comparison" for the competition breakdown
- business_model: "two-column" for unit economics
- team: "cards" for founder rows
- ask: "centered" or "big-number" for the raise amount

## Banned Patterns

NEVER use these words: innovative, cutting-edge, seamless, leverage, synergy, next-generation, best-in-class, world-class, disruptive, revolutionary, game-changing, robust, scalable (without specifics), end-to-end, holistic, paradigm, comprehensive, state-of-the-art, turnkey.

NEVER reference the deck itself, its design, visual style, theme, template, layout, slides, or presentation format. Write ONLY about the company, its market, and its story.

NEVER use vague claims without evidence. "Fast-growing" must become a specific growth rate. "Large market" must become a specific number.

NEVER use square brackets for any reason.

## Format Rules

- Return valid JSON only. No markdown wrapping, no explanations.
- Every headline: max 8 words, must work as a standalone statement.
- Bullet text: max 8 words, punchy and scannable.
- Bullet detail: max 20 words, provides supporting context with specifics.
- 2-4 bullets per slide (quality over quantity).`;

const SCHEMA_EXAMPLE_A = `[
  {
    "type": "hook",
    "headline": "Kill Empty Miles With AI",
    "subheadline": "RouteAI matches underutilized trucks to nearby loads in real time, cutting deadhead miles 40% for mid-market carriers.",
    "bullets": [],
    "callout": null,
    "layout_hint": "centered"
  },
  {
    "type": "problem",
    "headline": "$340B Wasted on Empty Truck Miles",
    "subheadline": "US freight carriers lose billions annually driving trucks with nothing in them.",
    "bullets": [
      { "text": "38% of trucks drive empty", "detail": "US freight runs 60B deadhead miles annually, per ATA 2024 data" },
      { "text": "Brokers take 15-20% margins", "detail": "Carriers net $1.75/mile after broker fees vs $2.10 direct" },
      { "text": "Manual dispatch kills margins", "detail": "Average dispatcher manages only 8 trucks, missing 73% of nearby loads" }
    ],
    "callout": { "value": "$340B", "label": "Annual deadhead cost in US freight" },
    "layout_hint": "two-column"
  },
  {
    "type": "traction",
    "headline": "214 Carriers Live, 3.2x YoY Growth",
    "subheadline": "Signed our first carrier in March 2023. Hit $2.1M ARR by December 2024.",
    "bullets": [
      { "text": "214 active carriers", "detail": "Managing 11,200 trucks across 34 states, up from 67 a year ago" },
      { "text": "1.4M loads matched in 2024", "detail": "Averaging 4,100 matches/day in Q4, up 280% from Q1" },
      { "text": "94% carrier retention", "detail": "Net revenue retention 118% as carriers expand truck count after onboarding" }
    ],
    "callout": { "value": "3.2x", "label": "Year-over-year ARR growth" },
    "layout_hint": "big-number"
  }]`;

const SCHEMA_EXAMPLE_B = `[
  {
    "type": "market",
    "headline": "$932B US Freight, We Own Backhaul",
    "subheadline": "Starting with mid-market carriers (50-500 trucks) who lack tech but hemorrhage margin on empty miles.",
    "bullets": [
      { "text": "$932B US trucking market", "detail": "Total US freight spend in 2024, growing 4.2% CAGR (FreightWaves)" },
      { "text": "$147B in backhaul alone", "detail": "Serviceable market: carriers spending on deadhead reduction tools" },
      { "text": "Convoy failed, brokers guess", "detail": "Digital brokers collapsed under thin margins; legacy brokers rely on phone calls" }
    ],
    "callout": { "value": "$147B", "label": "Serviceable backhaul optimization market" },
    "layout_hint": "comparison"
  },
  {
    "type": "team",
    "headline": "Ex-Uber Freight Meets ML PhDs",
    "subheadline": "Deep freight operations experience combined with applied machine learning.",
    "bullets": [
      { "text": "Sarah Chen, CEO", "detail": "Former Head of Carrier Ops at Uber Freight, scaled from 0 to 40K carriers" },
      { "text": "Marcus Rivera, CTO", "detail": "PhD ML from Stanford, led routing optimization at Amazon Logistics for 4 years" }
    ],
    "callout": null,
    "layout_hint": "cards"
  },
  {
    "type": "ask",
    "headline": "Raising $18M to Own Backhaul",
    "subheadline": "Series A to expand from 214 to 2,000 carriers and launch shipper marketplace.",
    "bullets": [
      { "text": "50% engineering", "detail": "$9M to triple engineering team and build shipper self-serve marketplace" },
      { "text": "30% sales expansion", "detail": "$5.4M for 20 carrier sales reps across Southeast and Midwest regions" },
      { "text": "20% data infrastructure", "detail": "$3.6M for real-time ELD integrations and expanded load board partnerships" }
    ],
    "callout": { "value": "$18M", "label": "Series A target" },
    "layout_hint": "big-number"
  }]`;

export const DECK_GENERATION_SCHEMA_TEXT = `Example A (hook, problem, traction slides):
${SCHEMA_EXAMPLE_A}

Example B (market, team, ask slides):
${SCHEMA_EXAMPLE_B}`;

export function buildDeckGenerationPrompt(
  companyName: string,
  description: string,
): string {
  return `Tell the story of this startup through 8 slides:

Company: ${companyName}

Founder's description:
"""
${description}
"""

Instructions:
1. Generate exactly 8 slides in this order: hook, problem, solution, traction, market, business_model, team, ask.
2. For the hook slide, use "${companyName}" as the company name in the subheadline — the headline itself should be a bold claim, not the company name.
3. Identify what data the founder actually provided vs what needs inference. Use provided data directly. For gaps, extrapolate reasonably or use directional language — NEVER use square brackets or placeholder tokens.
4. Every headline must make a bold, specific claim. Never use generic labels like "Our Solution" or "The Problem".
5. Every bullet detail must include a concrete number, named entity, or verifiable fact.
6. Each slide must narratively connect to the next — the reader should feel "and therefore..." between consecutive slides.
7. Include a layout_hint on each slide for visual variety.
8. Write content ONLY about the company. Do not reference the deck, its appearance, or how it will be presented.
9. If the description is sparse, write fewer but stronger bullets (2 per slide is fine). Never pad with invented specifics.

Return a JSON array of 8 slide objects matching this schema and quality level:
${DECK_GENERATION_SCHEMA_TEXT}`;
}

export function buildDeckRepairPrompt(
  invalidOutput: string,
  companyName: string,
  description: string,
): string {
  return `The previous model output is invalid JSON or does not match the required schema.
Repair it into valid JSON only — a JSON array of exactly 8 slide objects.

Slide types in order: hook, problem, solution, traction, market, business_model, team, ask.

Quality rules (preserve these during repair):
- Headlines must make bold, specific claims — not generic category labels.
- Bullets must contain concrete numbers, names, or proof points.
- NEVER use square brackets, [placeholder], [TBD], or any placeholder tokens. Extrapolate, use directional language, or omit.
- Do NOT reference the deck, its design, theme, style, or presentation format.
- Do NOT use banned buzzwords: innovative, cutting-edge, seamless, leverage, synergy, next-generation, best-in-class, disruptive, revolutionary, game-changing.
- Include layout_hint on each slide: "centered", "two-column", "comparison", "cards", or "big-number".

Company: ${companyName}
Description:
"""
${description}
"""

Invalid output:
"""
${invalidOutput}
"""

Return only a valid JSON array of 8 objects matching this schema:
${DECK_GENERATION_SCHEMA_TEXT}`;
}
