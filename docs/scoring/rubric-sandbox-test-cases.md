# Rubric Sandbox Test Cases

This matrix is designed for the `yarn rubric:sandbox` harness and reflects the scoring behavior implemented in:
- `services/analysisService.ts`
- `services/judgeAgentService.ts`
- `services/scoringService.ts`
- `config/strictness.ts`
- `supabase/functions/_shared/rubric-context.ts`

## Prerequisites

- `.env.local` contains valid LLM key(s)
- Run from repo root `C:\dev\pitchr`

Command template:

```bash
yarn rubric:sandbox --mode <vc_pitch|elevator> --provider openrouter --transcript-file "<transcript>" [--deck-file "<deck>"] [--rubric-file "<rubric>"] --out ".cache/rubric-sandbox/<case-id>.json"
```

## Cases

### C01 Baseline Seed Pitch

- Purpose: sanity check baseline scoring path.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/01_seed_balanced.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/01_seed_balanced.txt" --out ".cache/rubric-sandbox/C01.json"
```

- Expected:
  - `fallback=false`
  - 5 spoken rubric categories
  - score in `[0, 100]`

### C02 No Proof Hard Cap

- Purpose: verify `no_proof` cap from `HARD_GATE_CAPS`.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/02_no_proof.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/02_no_proof.txt" --out ".cache/rubric-sandbox/C02.json"
```

- Expected:
  - `evidence <= 8`
  - top fixes include concrete proof recommendation

### C03 No Ask Hard Cap

- Purpose: verify `no_ask` cap on spoken structure.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/03_no_ask.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/03_no_ask.txt" --out ".cache/rubric-sandbox/C03.json"
```

- Expected:
  - `structure <= 12`
  - fixes request explicit ask/use-of-funds

### C04 TAM-Only Hard Cap

- Purpose: verify `tam_only` cap on market score.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/04_tam_only.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/04_tam_only.txt" --out ".cache/rubric-sandbox/C04.json"
```

- Expected:
  - `market <= 10`
  - feedback asks for wedge/execution evidence

### C05 Deck Ask Hard Cap

- Purpose: verify deck coverage and `no_ask` cap on `deck_ask`.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/03_no_ask.txt`
  - deck: `tests/fixtures/rubric-sandbox/decks/10_missing_ask.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/03_no_ask.txt" --deck-file "tests/fixtures/rubric-sandbox/decks/10_missing_ask.txt" --out ".cache/rubric-sandbox/C05.json"
```

- Expected:
  - coverage `spoken+deck`
  - 5 spoken + 5 deck rubric categories
  - `deck_ask <= 8`

### C06 Delivery Deterministic Penalty

- Purpose: verify deterministic delivery scoring is applied.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/08_delivery_fillers.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/08_delivery_fillers.txt" --out ".cache/rubric-sandbox/C06.json"
```

- Expected:
  - delivery rationale indicates deterministic/local scoring
  - delivery score tends to be lower than C01

### C07 Interviewer Noise Filtering

- Purpose: verify mixed interviewer/founder transcript handling remains stable.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/06_interviewer_noise.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/06_interviewer_noise.txt" --out ".cache/rubric-sandbox/C07.json"
```

- Expected:
  - run completes normally
  - verdict/fixes still focus on founder ask/proof content

### C08 Override Layering: Strict Risk

- Purpose: confirm project rubric override is layered into system prompt and changes outcomes.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/01_seed_balanced.txt`
  - rubric: `tests/fixtures/rubric-sandbox/rubrics/strict_risk.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/01_seed_balanced.txt" --rubric-file "tests/fixtures/rubric-sandbox/rubrics/strict_risk.txt" --out ".cache/rubric-sandbox/C08.json"
```

- Expected:
  - report contains both baseline and `with_override`
  - `prompt_map.layered_system_prompt` present
  - at least one rubric category or verdict differs vs baseline

### C09 Override Layering: Clarity Priority

- Purpose: check override influence on critique focus.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/05_jargon_overload.txt`
  - rubric: `tests/fixtures/rubric-sandbox/rubrics/clarity_priority.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/05_jargon_overload.txt" --rubric-file "tests/fixtures/rubric-sandbox/rubrics/clarity_priority.txt" --out ".cache/rubric-sandbox/C09.json"
```

- Expected:
  - clarity-oriented issues/fixes are emphasized
  - verdict language shifts toward communication precision

### C10 Deck + Override Ask Priority

- Purpose: combine deck rubric path + override pressure on ask quality.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/01_seed_balanced.txt`
  - deck: `tests/fixtures/rubric-sandbox/decks/10_missing_ask.txt`
  - rubric: `tests/fixtures/rubric-sandbox/rubrics/deck_ask_priority.txt`
- Run:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/01_seed_balanced.txt" --deck-file "tests/fixtures/rubric-sandbox/decks/10_missing_ask.txt" --rubric-file "tests/fixtures/rubric-sandbox/rubrics/deck_ask_priority.txt" --out ".cache/rubric-sandbox/C10.json"
```

- Expected:
  - deck categories appear in rubric
  - `deck_ask` critique tightens vs no-override deck run

### C11 Elevator Mode

- Purpose: verify short-mode path and 3-question QA pack shape.
- Input:
  - transcript: `tests/fixtures/rubric-sandbox/transcripts/07_elevator_compact.txt`
- Run:

```bash
yarn rubric:sandbox --mode elevator --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/07_elevator_compact.txt" --out ".cache/rubric-sandbox/C11.json"
```

- Expected:
  - mode preserved as `elevator`
  - QA pack still contains exactly 3 questions and 3 answers

## Optional: include prompt snapshots

Use `--include-prompts` when you need full prompt inspection for forensic debugging:

```bash
yarn rubric:sandbox --mode vc_pitch --provider openrouter --transcript-file "tests/fixtures/rubric-sandbox/transcripts/01_seed_balanced.txt" --rubric-file "tests/fixtures/rubric-sandbox/rubrics/strict_risk.txt" --include-prompts --out ".cache/rubric-sandbox/C08-full-prompts.json"
```

## Anthropic Matrix Runner

To run all cases as baseline vs custom rubric with Anthropic only and generate reusable reports:

```bash
yarn rubric:matrix:anthropic
```

Outputs:
- `.cache/rubric-sandbox/matrix-anthropic/summary.json`
- `.cache/rubric-sandbox/matrix-anthropic/summary.md`

Both include:
- sequence
- rubric prompt used
- pitch type
- feedback criteria (rubric category deltas)
- score without custom rubric vs with custom rubric
- natural-language outcomes (`one_line_verdict`, `top_fixes`, `rewrite_script`, checklist)

To export a dashboard-friendly CSV from the latest Anthropic summary:

```bash
yarn rubric:matrix:anthropic:csv
```

CSV output:
- `.cache/rubric-sandbox/matrix-anthropic/summary.csv` (latest)
- `.cache/rubric-sandbox/matrix-anthropic/summary-<timestamp>.csv`

To export a markdown summary that includes full input text:

```bash
yarn rubric:matrix:anthropic:md-inputs
```

Markdown output:
- `.cache/rubric-sandbox/matrix-anthropic/summary-with-inputs.md` (latest)

## Auto-Generated Project-Type Runners

Project-type specific runner scripts are auto-generated from:

- `config/projectTypes.ts`

Generate/update runners manually:

```bash
yarn sync:rubric-matrix-runners
```

This also runs automatically during:
- `yarn dev` (`predev`)
- `yarn build` (`prebuild`)

Visible registry for everyone:
- `docs/rubric-matrix-runners.md`
