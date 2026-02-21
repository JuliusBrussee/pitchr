# Pitchr Database Plan

## Context

Everything currently uses **mock data hardcoded in page files** — no localStorage CRUD, no API routes. The `models/`, `services/`, `store/`, and `config/` directories are empty `.gitkeep` stubs. This plan defines every table needed to replace all mock data and support the full UI.

---

## Tables

### 1. `users`

Settings page shows a profile (name, email, avatar). Needed as anchor for runs and settings.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / PK | |
| `name` | text | "Julius Brussee" |
| `email` | text | "julius@pitchr.ai" |
| `avatar_initials` | text | "JB" (derived or stored) |
| `created_at` | timestamp | |

---

### 2. `user_settings`

Settings page preferences. One row per user (1:1).

| Column | Type | Notes |
|---|---|---|
| `user_id` | FK -> users | PK |
| `feedback_intensity` | enum | `'gentle' \| 'balanced' \| 'aggressive'` |
| `realtime_coaching` | boolean | default `true` |
| `post_session_report` | boolean | default `true` |
| `focus_areas` | text[] | `['clarity', 'pacing', 'filler', ...]` |
| `auto_record` | boolean | default `false` |
| `timer_duration_seconds` | int | default `300` (5:00) |
| `theme` | enum | `'system' \| 'light' \| 'dark'` |
| `compact_mode` | boolean | default `false` |
| `default_camera` | text | device label (nullable) |
| `default_mic` | text | device label (nullable) |

---

### 3. `decks`

Deck manager page. Users upload/create pitch decks.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / PK | |
| `user_id` | FK -> users | |
| `title` | text | "Series A Pitch" |
| `slides` | int | slide count |
| `file_url` | text | storage path to uploaded PDF/PPTX (nullable) |
| `accent_icon` | text | `'presentation' \| 'fileText' \| 'barChart' \| 'image' \| 'folderOpen'` |
| `gradient` | text | CSS gradient string for thumbnail |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

Computed at query time (from `runs`): `practices` (count), `avg_score` (avg), `last_used` (max created_at).

---

### 4. `runs`

Core entity. Every pitch session produces a run. Used by dashboard, history, results, and analytics.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / PK | |
| `user_id` | FK -> users | |
| `deck_id` | FK -> decks | nullable |
| `number` | int | sequential per-user run number ("Pitch #28") |
| `mode` | enum | `'elevator' \| 'vc_pitch'` |
| `input_type` | enum | `'audio' \| 'text'` |
| `transcript` | text | original spoken/pasted text |
| `audio_url` | text | storage path (nullable, audio input only) |
| `overall_score` | int | 0-100 |
| `one_line_verdict` | text | LLM-generated summary |
| `created_at` | timestamp | |
| `duration_seconds` | int | session duration |

---

### 5. `rubric_scores`

Per-run breakdown. 5 rows per run (one per rubric category).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / PK | |
| `run_id` | FK -> runs | |
| `category` | enum | `'structure' \| 'clarity' \| 'evidence' \| 'market' \| 'delivery'` |
| `score` | int | 0-20 |
| `max_score` | int | always 20 |
| `rationale` | text | LLM-generated explanation |

---

### 6. `fixes`

Ranked improvement suggestions per run. Typically 5 per run.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / PK | |
| `run_id` | FK -> runs | |
| `rank` | int | 1-5 |
| `category` | enum | same as rubric_scores |
| `issue` | text | what's wrong |
| `fix` | text | specific recommendation |
| `impact` | enum | `'high' \| 'medium' \| 'low'` |

---

### 7. `delivery_metrics`

One row per run. Delivery stats from the analysis.

| Column | Type | Notes |
|---|---|---|
| `run_id` | FK -> runs | PK (1:1) |
| `wpm` | int | words per minute |
| `duration_seconds` | int | denormalized from runs |
| `within_time_limit` | boolean | |

---

### 8. `filler_words`

Per-run filler word breakdown.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / PK | |
| `run_id` | FK -> runs | |
| `word` | text | "um", "basically", "like", etc. |
| `count` | int | occurrences |

---

### 9. `repeated_phrases`

Per-run repeated phrase detection.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid / PK | |
| `run_id` | FK -> runs | |
| `phrase` | text | |
| `count` | int | |

---

### 10. `rewrite_scripts`

One per run — the LLM-generated improved version.

| Column | Type | Notes |
|---|---|---|
| `run_id` | FK -> runs | PK (1:1) |
| `script` | text | full rewritten pitch text |

---

## Relationships

```
users 1──* runs
users 1──1 user_settings
users 1──* decks
decks 1──* runs
runs  1──* rubric_scores     (exactly 5)
runs  1──* fixes             (typically 5)
runs  1──1 delivery_metrics
runs  1──* filler_words
runs  1──* repeated_phrases
runs  1──1 rewrite_scripts
```

---

## Computed / Aggregated Data (no tables needed)

Derived via queries, not stored:

| UI Feature | Query Source |
|---|---|
| **Dashboard stats** (totalRuns, avgScore, bestScore) | `SELECT COUNT(*), AVG(overall_score), MAX(overall_score) FROM runs WHERE user_id = ?` |
| **Score trend sparkline** | `SELECT overall_score, created_at FROM runs ORDER BY created_at` |
| **Analytics rubric averages** | `SELECT category, AVG(score) FROM rubric_scores JOIN runs ... GROUP BY category` |
| **Analytics insights** | LLM-generated from aggregate data (could cache in `user_insights` table later) |
| **Deck stats** (practices, avgScore, lastUsed) | Aggregated from `runs WHERE deck_id = ?` |
| **History date groups** | Derived from `runs.created_at` at query time |
| **Pitch tips** | Static content, lives in code |

---

## What Each Table Replaces

| Current Mock Data | Database Replacement |
|---|---|
| `MOCK_RUN` + `MOCK_ANALYSIS` in results page | `runs` + `rubric_scores` + `fixes` + `delivery_metrics` + `filler_words` + `repeated_phrases` + `rewrite_scripts` |
| `RECENT_RUNS` + `STATS` in dashboard | Query against `runs` |
| `MOCK_RUNS` in history page | Query against `runs` with pagination/filtering |
| `SCORE_TREND` + `RUBRIC_CATEGORIES` + `INSIGHTS` in analytics | Aggregation queries on `runs` + `rubric_scores` |
| `MOCK_DECKS` in deck page | `decks` table + aggregated run stats |
| Settings page local state | `user_settings` table |
| Profile info in settings | `users` table |

---

## Simplification Option: JSON Column

For MVP, store the entire `AnalysisResult` as a JSON column on `runs`:

```
runs.analysis  jsonb  — contains rubric_breakdown, top_fixes, delivery_metrics, rewrite_script
```

This trades query flexibility for simplicity. You lose `AVG(score) GROUP BY category` across runs without JSON extraction. Reasonable for MVP — normalize later when analytics queries become important.

---

## Source Files Referenced

- `app/(app)/results/[runId]/page.tsx` — `AnalysisResult`, `RubricScore`, `Fix`, `DeliveryMetrics`, `FillerWord`, `RepeatedPhrase` types
- `app/(app)/dashboard/page.tsx` — `MockRun` interface, `STATS` shape
- `app/(app)/history/page.tsx` — `MockRun` with `number`, `inputType`, `dateGroup`, `deck`
- `app/(app)/analytics/page.tsx` — `SCORE_TREND`, `RUBRIC_CATEGORIES`, `INSIGHTS`, `RECOMMENDATIONS`
- `app/(app)/settings/page.tsx` — all user preference state
- `app/(app)/deck/page.tsx` — `MockDeck` interface
- `hooks/useSessionState.ts` — `MetricValues`, `ChecklistItem`, `InsightEntry`, `SpeechBubble` (ephemeral, not stored)
- `views/components/ui/colors.ts` — `PitchMode`, `ScoreBand`, `RubricCategory` enums
