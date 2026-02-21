# Recordings (Audio/Video) — Design

**Date:** 2026-02-22
**Approach:** Option A — Parallel MediaRecorder alongside existing STT WebSocket

## Overview

Add webcam video + audio recording to pitch sessions, stored in Supabase Storage, with playback on results and history pages. Recording is non-blocking — if it fails, the core transcription + analysis flow continues unaffected.

## Requirements

- Record webcam video + audio as a single WebM file during pitch sessions
- Upload recordings to Supabase Storage (new `recordings` bucket)
- Store the public URL on the `runs` row (`recording_url` column)
- 5-minute max duration, 100 MB file size limit
- Playback on results page (video player at top) and history page (inline play button)
- Graceful degradation: if recording/upload fails, pitch analysis still works

## Storage & Schema

### New Supabase Storage Bucket: `recordings`

- 100 MB file size limit
- Public read, anonymous upload/delete (matches `decks` bucket policy)
- File path pattern: `{runId}/recording.webm`

### Migration: `09-create-recordings-bucket.sql`

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recordings', 'recordings', true, 104857600);
```

### Migration: `10-recordings-storage-policies.sql`

Public read + anonymous upload/delete policies (same pattern as `04-storage-policies.sql`).

### Column: Keep `audio_url` as-is

The `runs.audio_url` column already exists and is always NULL. Rather than renaming it (which would require updating every reference), we'll repurpose it to store the recording URL. The field name in TypeScript types (`audioUrl` / `recordingUrl`) can be aliased as needed, but the DB column stays `audio_url` to avoid a migration that renames.

## New Hook: `useRecorder.ts`

```typescript
interface UseRecorderReturn {
  startRecording: (stream: MediaStream) => void;
  stopRecording: () => Promise<Blob | null>;
  isRecording: boolean;
}
```

- Creates `MediaRecorder` with `video/webm;codecs=vp8,opus` (fallback to `video/webm`)
- Accumulates chunks via `ondataavailable`
- `stopRecording()` resolves with the assembled Blob
- Auto-stops at 5-minute mark
- Cleans up on unmount

## New Service: `recordingService.ts` (client-side)

```typescript
export async function uploadRecording(runId: string, blob: Blob): Promise<string>
export async function deleteRecording(runId: string): Promise<void>
```

- Uses `supabase.storage.from('recordings')` directly from the client
- Uploads to `{runId}/recording.webm`
- Returns the public URL
- Called from session page after recording stops

## Session Flow Changes

### Start:
1. `useMediaStream.start()` — gets camera + mic stream (existing)
2. `useSTT.start()` — opens WebSocket for real-time transcription (existing)
3. `recorder.startRecording(stream)` — starts MediaRecorder on the same stream (NEW)

### Stop:
1. `useSTT.stop()` — closes WebSocket, gets final transcript (existing)
2. `blob = await recorder.stopRecording()` — assembles WebM blob (NEW)
3. `recordingUrl = await uploadRecording(runId, blob)` — uploads to Supabase (NEW)
4. `runPitchAnalysis({..., audioUrl: recordingUrl})` — passes URL to API (existing field, now populated)

### Audio-only fallback:
If camera is unavailable but mic is available, record audio-only WebM. The `useMediaStream` hook already handles camera toggle — if camera is off, the stream has audio tracks only.

## API Changes

Minimal — the `audioUrl` field already flows through:

- `CreatePitchRunRequest.audioUrl` — already defined, already validated
- `pitchController.ts` line 99 — already passes `audio_url: payload.audioUrl`
- `runService.insertRun` line 82 — already saves `audio_url`

The only change: the session page now actually sends a real URL instead of undefined.

## Playback Components

### `RecordingPlayer.tsx`

```typescript
interface RecordingPlayerProps {
  recordingUrl?: string;
  compact?: boolean; // For history list inline player
}
```

- Full mode: `<video>` element with controls, poster frame
- Compact mode: Small play button that expands to inline player
- Handles missing URL: shows nothing (not an error state)

### Integration:
- **Results page** (`results/[runId]/page.tsx`): RecordingPlayer at top of results, full mode
- **History page** (`history/page.tsx`): RecordingPlayer on each run card, compact mode

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No camera permission | Record audio-only via mic stream |
| No mic permission | Skip recording entirely, STT also won't work |
| MediaRecorder not supported | Skip recording, log warning |
| Recording blob too large (>100MB) | Show toast warning, skip upload, proceed with analysis |
| Upload to Supabase fails | Show toast error, proceed with analysis (no recording URL) |
| Playback URL is 404/expired | Show "Recording unavailable" in player |

Recording is always non-blocking. The core flow (transcription + LLM analysis) never depends on it.

## Files to Create/Modify

### New files:
- `hooks/useRecorder.ts` — MediaRecorder hook
- `services/recordingService.ts` — Supabase Storage upload/delete (client-side)
- `views/components/RecordingPlayer.tsx` — Video/audio playback component
- `migrations/09-create-recordings-bucket.sql` — Storage bucket
- `migrations/10-recordings-storage-policies.sql` — Public access policies

### Modified files:
- `app/(app)/session/page.tsx` — Wire useRecorder into session start/stop flow
- `app/(app)/results/[runId]/page.tsx` — Add RecordingPlayer
- `app/(app)/history/page.tsx` — Add compact RecordingPlayer to run cards
- `services/runService.ts` — Add `audio_url` to `updateRun` allowed fields (for post-upload update)

## Out of Scope

- Recording quality settings (bitrate, resolution) — use browser defaults
- Recording download button — can add later
- Server-side transcoding — WebM is widely supported
- Auth/permissions on recordings — MVP uses anonymous public access
