# Merge with main — Local main update (2026-03-08)

## Purpose
This doc describes what changed when bringing local `main` up to date with `origin/main` and reapplying local work. Use it to resolve similar merge conflicts when you merge main into your branch or when you hit the same files.

## Scope
- **Branch:** `main` (tracking `origin/main`)
- **Action:** Fetched `origin`, stashed local changes, merged `origin/main` (fast-forward), then reapplied stash
- **Result:** Local `main` is up to date with remote; local changes were reapplied with two conflicts resolved

## What changed from remote (origin/main)
- **31 commits** were brought in via fast-forward (e.g. planning docs, rubric context, rate limiting, live feedback, new tests, migrations).
- **133 files** updated; see `git log 3aa027c..7e5caa7 --stat` for the full list.

## Stash pop conflicts and resolutions

### 1) `public/icon.svg` — modify/delete
- **What happened:** In our stashed work the file was **deleted**; on `origin/main` it was **modified** (new icon).
- **Resolution:** Kept the **upstream (main) version** — the file remains in the repo with main’s content.
- **For teammates:** If you deleted `public/icon.svg` and main changed it, keep main’s version:  
  `git add public/icon.svg` (or discard your deletion and keep the file).

### 2) `supabase/functions/transcribe-audio/index.ts` — content conflict
- **What happened:**  
  - **Main** had: rate limiting (`checkRateLimit`, `RateLimitExceededError`, `rateLimitResponse`), plus ElevenLabs STT (fetch to `ELEVENLABS_STT_URL`).  
  - **Our stash** had: AssemblyAI-based transcription (`transcribeAudioBytes` from `_shared/assemblyai-stt.ts`), no rate limiting, and an `ASSEMBLYAI_API_KEY` error check.
- **Resolution:** Combined both:
  - **Imports:** Keep from main: `jsonResponse`, `errorResponse`, `rateLimitResponse` from `_shared/response.ts` and `checkRateLimit`, `RateLimitExceededError` from `_shared/rate-limit.ts`. Add from our side: `transcribeAudioBytes` from `_shared/assemblyai-stt.ts`. Do **not** re-add `ELEVENLABS_STT_URL` if you use AssemblyAI.
  - **Flow:** Keep the AssemblyAI flow: fetch audio from Storage → `transcribeAudioBytes(audioBytes)` → `trimmed` → validate and return. Remove the ElevenLabs `fetch` block if you are standardizing on AssemblyAI.
  - **Error handling:** Keep **both**:
    - `RateLimitExceededError` → `rateLimitResponse(...)`
    - `error.message.includes('ASSEMBLYAI_API_KEY')` → `errorResponse('Speech-to-text service is not configured.', 503)`
- **For teammates:** When merging with main, preserve `_shared/rate-limit.ts` usage in this edge function. If your branch uses AssemblyAI, keep `transcribeAudioBytes` and the AssemblyAI config error; if you use ElevenLabs, keep that block instead and the rate-limit block in either case.

## Files that were in our stashed changes (for conflict context)
- **Modified (staged after resolution):**  
  `.env.example`, `.planning/codebase/INTEGRATIONS.md`, `CLAUDE.md`, `README.md`,  
  `app/(app)/history/page.tsx`, `app/(app)/session/page.tsx`, `hooks/useSessionState.ts`,  
  `server.ts`, `stt.ts`, `supabase/functions/.env.example`, `supabase/functions/transcribe-audio/index.ts`,  
  `views/components/ProjectDeckManager.tsx`, `views/components/dashboard/RadarChart.tsx`, `views/components/dashboard/Sparkline.tsx`,  
  `views/components/settings/GeneralTab.tsx`, `views/components/ui/index.ts`
- **Untracked (not committed):**  
  `lib/stt/`, `supabase/functions/_shared/assemblyai-stt.ts`,  
  `views/components/ui/ChartTooltip.tsx`, `views/components/ui/ConfirmDialog.tsx`

If you merge main into a branch that touches these, pay extra attention to `transcribe-audio/index.ts` and any shared STT/UI code.

## Quick reference for similar merges
| File / area              | Likely conflict                         | Resolution hint                                                                 |
|--------------------------|----------------------------------------|---------------------------------------------------------------------------------|
| `public/icon.svg`        | Delete vs modify                       | Keep main’s version unless the team agreed to remove the icon.                  |
| `transcribe-audio/index.ts` | Rate limit + ElevenLabs vs AssemblyAI | Keep rate-limit + response helpers from main; choose one STT path and keep its error handling. |

## Relation to other docs
- **Canonical conflict log:** [docs/merge-conflict-log.md](merge-conflict-log.md) — add a short entry there when you do a merge that resolves conflicts.
- **Other merge report:** [docs/merge-main-into-lucasfeature-2026-03-07.md](merge-main-into-lucasfeature-2026-03-07.md) — main into `lucasfeature`; rate-limiting and rubric context patterns are consistent with this doc.
