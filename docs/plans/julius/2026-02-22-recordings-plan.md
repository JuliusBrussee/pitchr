# Recordings (Audio/Video) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Record webcam video + audio during pitch sessions, store in Supabase, and enable playback on results and history pages.

**Architecture:** Parallel MediaRecorder captures the camera+mic stream as WebM while the existing STT WebSocket handles transcription. After recording stops, the blob uploads to a new `recordings` Supabase Storage bucket, and the public URL is saved on the `runs.audio_url` column (already exists, currently NULL). Playback uses a `RecordingPlayer` component on both the results and history pages.

**Tech Stack:** MediaRecorder API, Supabase Storage, React (video element), existing Next.js API routes

---

### Task 1: Create Supabase Storage Migrations

**Files:**
- Create: `migrations/09-create-recordings-bucket.sql`
- Create: `migrations/10-recordings-storage-policies.sql`

**Step 1: Create the recordings bucket migration**

```sql
-- migrations/09-create-recordings-bucket.sql
-- Create a public storage bucket for pitch session recordings (audio/video).
-- 100 MB file size limit (covers 5-minute video recordings).

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('recordings', 'recordings', true, 104857600);
```

**Step 2: Create the storage policies migration**

```sql
-- migrations/10-recordings-storage-policies.sql
-- Public access policies for the recordings bucket (no auth in MVP).

-- Allow public reads (video player needs direct URL access)
CREATE POLICY "Public read recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings');

-- Allow anonymous uploads
CREATE POLICY "Allow recording uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recordings');

-- Allow anonymous deletes
CREATE POLICY "Allow recording deletes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recordings');
```

**Step 3: Commit**

```bash
git add migrations/09-create-recordings-bucket.sql migrations/10-recordings-storage-policies.sql
git commit -m "feat: add Supabase storage migrations for recordings bucket"
```

---

### Task 2: Create `useRecorder` Hook

**Files:**
- Create: `hooks/useRecorder.ts`

**Step 1: Write the hook**

```typescript
'use client';

import { useCallback, useRef, useState } from 'react';

const MAX_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function getMediaRecorderMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
  ];
  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) return mimeType;
  }
  return '';
}

export interface UseRecorderReturn {
  startRecording: (stream: MediaStream) => void;
  stopRecording: () => Promise<Blob | null>;
  isRecording: boolean;
}

export function useRecorder(): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveStopRef = useRef<((blob: Blob | null) => void) | null>(null);

  const startRecording = useCallback((stream: MediaStream) => {
    if (recorderRef.current) return;

    const mimeType = getMediaRecorderMimeType();
    if (!mimeType) {
      console.warn('[useRecorder] No supported MediaRecorder MIME type found');
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      setIsRecording(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      resolveStopRef.current?.(blob);
      resolveStopRef.current = null;
      recorderRef.current = null;
    };

    recorder.onerror = () => {
      console.warn('[useRecorder] MediaRecorder error');
      setIsRecording(false);
      resolveStopRef.current?.(null);
      resolveStopRef.current = null;
      recorderRef.current = null;
    };

    recorderRef.current = recorder;
    recorder.start(1000); // collect data every second
    setIsRecording(true);

    // Auto-stop at max duration
    timerRef.current = setTimeout(() => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    }, MAX_DURATION_MS);
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state !== 'recording') {
        resolve(null);
        return;
      }
      resolveStopRef.current = resolve;
      recorder.stop();
    });
  }, []);

  return { startRecording, stopRecording, isRecording };
}
```

**Step 2: Commit**

```bash
git add hooks/useRecorder.ts
git commit -m "feat: add useRecorder hook for MediaRecorder capture"
```

---

### Task 3: Create `recordingService.ts` (Client-Side Upload)

**Files:**
- Create: `services/recordingService.ts`

**Step 1: Write the service**

This is a client-side service (uses browser Supabase client). It follows the same pattern as `deckService.ts` `uploadToStorage`.

```typescript
import { supabase } from '@/lib/supabase';

const BUCKET = 'recordings';
const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export async function uploadRecording(runId: string, blob: Blob): Promise<string> {
  if (blob.size > MAX_SIZE_BYTES) {
    throw new Error(`Recording too large (${Math.round(blob.size / 1024 / 1024)} MB). Max is 100 MB.`);
  }

  const filePath = `${runId}/recording.webm`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || 'video/webm',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload recording: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteRecording(runId: string): Promise<void> {
  const filePath = `${runId}/recording.webm`;
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) {
    throw new Error(`Failed to delete recording: ${error.message}`);
  }
}
```

**Step 2: Commit**

```bash
git add services/recordingService.ts
git commit -m "feat: add recordingService for Supabase Storage upload/delete"
```

---

### Task 4: Wire Recording into Session Flow

**Files:**
- Modify: `app/(app)/session/page.tsx`

**Step 1: Add imports and hook**

At the top of the file, add the import for `useRecorder` alongside existing hook imports:

```typescript
import { useRecorder } from '@/hooks/useRecorder';
```

Inside `SessionPageContent`, add the hook alongside existing hooks (after `const stt = useSTT();`):

```typescript
const recorder = useRecorder();
```

**Step 2: Modify `handleStartSession`**

Update the callback to also start the recorder. The recorder needs the media stream:

```typescript
const handleStartSession = useCallback(() => {
  setAnalysisError(null);
  autoSubmitLockRef.current = false;
  session.startSession();
  stt.start();
  if (media.stream) {
    recorder.startRecording(media.stream);
  }
}, [session, stt, media.stream, recorder]);
```

**Step 3: Modify `handleStopSession`**

Update to also stop the recorder:

```typescript
const handleStopSession = useCallback(() => {
  session.stopSession();
  stt.stop();
  recorder.stopRecording(); // fire-and-forget stop; blob captured in auto-submit
}, [session, stt, recorder]);
```

**Step 4: Modify the auto-submit `useEffect`**

Import `uploadRecording` at the top:

```typescript
import { uploadRecording } from '@/services/recordingService';
```

In the auto-submit useEffect (the one that runs when `stt.saved` is true), add recording upload before calling `runPitchAnalysis`. Replace the `void (async () => { ... })()` block:

```typescript
void (async () => {
  try {
    // Stop recording and upload blob
    let audioUrl: string | undefined;
    try {
      const blob = await recorder.stopRecording();
      if (blob && blob.size > 0) {
        // Generate a temporary ID for the upload path
        const tempId = crypto.randomUUID();
        audioUrl = await uploadRecording(tempId, blob);
      }
    } catch (uploadErr) {
      console.warn('[session] Recording upload failed, proceeding without:', uploadErr);
    }

    let deckText: string | undefined;
    if (selectedDeckId !== null) {
      try {
        deckText = await loadDeckText(selectedDeckId);
      } catch {
        deckText = undefined;
      }
    }
    const result = await runPitchAnalysis({
      mode: pitchMode,
      inputType: 'audio',
      transcript,
      audioUrl,
      deckText,
    });
    router.push(`/results/${result.runId}`);
  } catch (error) {
    autoSubmitLockRef.current = false;
    setAnalysisError(
      error instanceof Error ? error.message : 'Failed to run pitch analysis.',
    );
    session.setOrbState('idle');
  }
})();
```

Add `recorder` to the dependency array of the useEffect.

**Step 5: Commit**

```bash
git add app/(app)/session/page.tsx
git commit -m "feat: wire recording capture + upload into session flow"
```

---

### Task 5: Create `RecordingPlayer` Component

**Files:**
- Create: `views/components/RecordingPlayer.tsx`

**Step 1: Write the component**

```typescript
'use client';

import { useState } from 'react';
import { Play, Video } from 'lucide-react';

interface RecordingPlayerProps {
  recordingUrl?: string;
  compact?: boolean;
}

export function RecordingPlayer({ recordingUrl, compact = false }: RecordingPlayerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!recordingUrl) return null;

  if (compact) {
    return (
      <div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors"
          style={{
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-color)',
            backgroundColor: expanded ? 'var(--bg-surface-hover)' : 'transparent',
          }}
        >
          <Play size={10} fill="currentColor" />
          Recording
        </button>
        {expanded && (
          <div className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
            <video
              src={recordingUrl}
              controls
              className="w-full max-h-48"
              style={{ backgroundColor: '#000' }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border p-4"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Video size={14} style={{ color: 'var(--text-muted)' }} />
        <h3 className="text-sm uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Recording
        </h3>
      </div>
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
        <video
          src={recordingUrl}
          controls
          className="w-full"
          style={{ backgroundColor: '#000', maxHeight: '400px' }}
        />
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add views/components/RecordingPlayer.tsx
git commit -m "feat: add RecordingPlayer component for video/audio playback"
```

---

### Task 6: Add RecordingPlayer to Results Page

**Files:**
- Modify: `app/(app)/results/[runId]/page.tsx`

**Step 1: Add import**

At the top of the file, add:

```typescript
import { RecordingPlayer } from '@/views/components/RecordingPlayer';
```

**Step 2: Add player to the results layout**

In the `ResultsPage` component's return statement, insert the `RecordingPlayer` right after the `<header>` section (before the score overview `<section>`). Find this line:

```typescript
      <section
        className="rounded-2xl border p-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
```

Insert before it:

```typescript
      <RecordingPlayer recordingUrl={run.audioUrl} />
```

**Step 3: Commit**

```bash
git add app/(app)/results/[runId]/page.tsx
git commit -m "feat: add recording playback to results page"
```

---

### Task 7: Add Recording Playback to History Page

**Files:**
- Modify: `app/(app)/history/page.tsx`

**Step 1: Add `audioUrl` to `HistoryRun` interface and mapping**

In the `HistoryRun` interface (around line 30), add:

```typescript
audioUrl?: string;
```

In the `RunRecord` interface (around line 43), add:

```typescript
audioUrl?: string;
```

In the `useEffect` that fetches runs (around line 114), update the mapping to include `audioUrl`:

```typescript
const mapped = (data as RunRecord[]).map((r, i) => ({
  id: r.id,
  number: data.length - i,
  mode: r.mode as PitchMode,
  inputType: r.inputType as 'audio' | 'text',
  overallScore: r.overallScore,
  one_line_verdict: r.analysis.one_line_verdict,
  createdAt: r.createdAt,
  duration_seconds: r.analysis.delivery_metrics.duration_seconds,
  audioUrl: r.audioUrl,
  deck: undefined,
  dateGroup: getDateGroup(r.createdAt),
}));
```

**Step 2: Add imports**

Add the `RecordingPlayer` import at the top:

```typescript
import { RecordingPlayer } from '@/views/components/RecordingPlayer';
```

**Step 3: Add compact player to list view rows**

In the list view, inside the run row `<div>` (around line 305-401), add the compact player after the "Meta: date + duration" section and before the score badge. Find the `{/* Score badge */}` comment and insert before it:

```typescript
{/* Recording playback */}
{run.audioUrl && (
  <div className="flex-shrink-0">
    <RecordingPlayer recordingUrl={run.audioUrl} compact />
  </div>
)}
```

**Step 4: Add compact player to grid view cards**

In the grid view, inside the card `<div>` (around line 425-535), add the compact player after the verdict paragraph and before the meta row. Find the `{/* Meta row */}` comment and insert before it:

```typescript
{/* Recording playback */}
{run.audioUrl && (
  <RecordingPlayer recordingUrl={run.audioUrl} compact />
)}
```

**Step 5: Commit**

```bash
git add app/(app)/history/page.tsx
git commit -m "feat: add compact recording playback to history page"
```

---

### Task 8: Add `audio_url` to `updateRun` Allowed Fields

**Files:**
- Modify: `services/runService.ts`

**Step 1: Update `updateRun` type signature**

In `runService.ts`, the `updateRun` function (line 137-168) restricts which fields can be updated. Add `audio_url` to the `Pick`:

Change:
```typescript
export async function updateRun(
  runId: string,
  updates: Partial<
    Pick<
      RunRecord,
      | 'status'
      | 'error_message'
      | 'started_at'
      | 'completed_at'
      | 'overall_score'
      | 'analysis'
      | 'meta'
      | 'is_fallback'
    >
  >,
```

To:
```typescript
export async function updateRun(
  runId: string,
  updates: Partial<
    Pick<
      RunRecord,
      | 'status'
      | 'error_message'
      | 'started_at'
      | 'completed_at'
      | 'overall_score'
      | 'analysis'
      | 'meta'
      | 'is_fallback'
      | 'audio_url'
    >
  >,
```

**Step 2: Commit**

```bash
git add services/runService.ts
git commit -m "feat: allow audio_url updates in runService.updateRun"
```

---

### Task 9: Clean Up Recording on Run Delete

**Files:**
- Modify: `app/api/pitch/run/[runId]/route.ts`

**Step 1: Add recording cleanup to DELETE handler**

Import the recording service at the top:

```typescript
import { deleteRecording } from '@/services/recordingService';
```

In the DELETE handler, before calling `deleteRun`, attempt to delete the recording file:

```typescript
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
): Promise<NextResponse> {
  try {
    const { runId } = await params;
    // Clean up recording file (best-effort, don't fail the delete if this errors)
    try {
      await deleteRecording(runId);
    } catch {
      // Recording may not exist — that's fine
    }
    await deleteRun(runId);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    if (error instanceof RunNotFoundError) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete run' },
      { status: 500 },
    );
  }
}
```

**Note:** The `recordingService` uses the browser Supabase client which works on the server side too since it uses the same public anon key. However, if this causes issues in the server context, we can use the Supabase client from `lib/supabase.ts` directly in the route handler instead. The import path is the same.

**Step 2: Commit**

```bash
git add app/api/pitch/run/[runId]/route.ts
git commit -m "feat: clean up recording storage on run delete"
```

---

### Task 10: Manual Testing & Final Commit

**Step 1: Apply Supabase migrations**

Run migrations `09` and `10` in the Supabase dashboard SQL editor (or via CLI if set up).

**Step 2: Test the full flow**

1. Start dev server: `yarn dev`
2. Go to `/session`, start a recording with camera on
3. Deliver a pitch, stop the session
4. Verify the WebM blob uploads (check Supabase Storage dashboard > `recordings` bucket)
5. Verify the results page shows the video player with playback
6. Go to `/history`, verify compact play button appears on the run card
7. Delete the run, verify the recording file is removed from storage

**Step 3: Test edge cases**

1. Camera off (audio-only): Verify recording still captures audio in WebM container
2. Camera denied: Verify session works without recording, no errors
3. 5-minute timeout: Start a long recording, verify it auto-stops at 5 minutes

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address recording integration issues from manual testing"
```
