# External Integrations

**Analysis Date:** 2026-02-21

## APIs & External Services

**Currently Not Integrated:**
- No third-party APIs integrated at this stage
- Application is client-side focused with no backend service dependencies detected
- Planned API endpoints exist as directory structure but are not yet implemented:
  - `app/api/feedback/` - Feedback submission (not implemented)
  - `app/api/sessions/` - Session management (not implemented)
  - `app/api/qna/` - Q&A functionality (not implemented)
  - `app/api/deck/` - Deck/slide management (not implemented)
  - `app/api/ws/video/` - WebSocket video streaming (not implemented)
  - `app/api/ws/audio/` - WebSocket audio streaming (not implemented)

## Data Storage

**Databases:**
- Not detected - No database client libraries (Prisma, Supabase, Firebase, etc.) in dependencies
- State management is entirely client-side via React hooks
- Persisting data: Not implemented

**File Storage:**
- Not detected - Application currently placeholder for slide uploads
  - `SessionCanvas.tsx` shows "Upload or generate your deck" button but no upload handler
  - No cloud storage integration (S3, Google Cloud Storage, etc.)

**Caching:**
- Not detected - No Redis, Memcached, or other caching services
- In-memory state via React hooks only

**Session State:**
- Client-side only via `useSessionState()` hook (`hooks/useSessionState.ts`)
  - Metrics: wpm, fillerWords, conciseness, clarity
  - Checklist items tracking pitch content coverage
  - Insights/feedback entries
  - Speech bubbles from coach
  - Expires on page refresh

## Authentication & Identity

**Auth Provider:**
- Not detected - No authentication system currently implemented
- Application accessible without login
- Layout structure suggests future auth requirements:
  - `app/(app)/` routes intended for authenticated pages
  - `app/(marketing)/` routes for public pages
  - No auth guards currently enforced

**Authorization:**
- Not implemented

## Media Capture & Processing

**Video/Audio Capture:**
- Browser native APIs via `useMediaStream()` hook (`hooks/useMediaStream.ts`)
  - `navigator.mediaDevices.getUserMedia()` for camera and microphone access
  - `MediaStream` API for stream management
  - Video playback via native `<video>` element with `srcObject` binding
  - No cloud encoding/processing

**Audio Processing:**
- Directory structure: `lib/audio/` (placeholder - not implemented)
- Current implementation: No audio processing
- Future: Speech recognition, audio analysis, filler word detection likely planned

**Video Processing:**
- Directory structure: `lib/video/` (placeholder - not implemented)
- Current implementation: Webcam display only, no processing
- Future: Gesture recognition, posture analysis, eye contact detection likely planned

## Scoring & Analysis

**Scoring Engine:**
- Directory structure: `lib/scoring/` (placeholder - not implemented)
- Current implementation: Mock metrics in `useSessionState.ts`
  - Metrics simulated with `setInterval` randomization
  - No real analysis pipeline

**AI/ML Integration:**
- Not detected - No ML service client libraries (OpenAI, Anthropic, Google Vertex AI, etc.)
- Coach feedback is hardcoded messages: `COACH_MESSAGES` in `hooks/useSessionState.ts`
- Future integration likely for:
  - Speech-to-text transcription
  - Real-time feedback generation
  - Pitch deck understanding
  - Delivery quality scoring

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Rollbar, or similar service

**Logging:**
- Not detected - Only browser console errors caught in `useMediaStream()` hook
  - Error states captured: MediaStream access failures
  - No centralized logging service

**Analytics:**
- Not detected - No Google Analytics, Mixpanel, Amplitude, etc.

## CI/CD & Deployment

**Hosting:**
- Not specified - Supports any Node.js-compatible platform
- Vercel optimized (Next.js native support)
- Potential targets: Vercel, Netlify, Heroku, AWS, Google Cloud, etc.

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other CI service files

## Environment Configuration

**Required env vars:**
- None currently configured
- `.env` and `.env*.local` listed in `.gitignore` but not utilized
- Application runs with defaults

**Secrets location:**
- Not applicable - No external service integrations with secrets

## Webhooks & Callbacks

**Incoming:**
- Not implemented
- Planned endpoints: `app/api/feedback/`, `app/api/qna/`, `app/api/deck/`

**Outgoing:**
- Not implemented
- Planned WebSocket endpoints: `app/api/ws/video/`, `app/api/ws/audio/`

## Browser APIs Used

**Core:**
- `navigator.mediaDevices.getUserMedia()` - Camera/microphone access (`useMediaStream.ts`)
- `MediaStream` API - Stream track management
- `HTMLVideoElement` - Video playback
- WebGL (via Three.js) - 3D graphics rendering
- Web Audio API - Planned for audio analysis

**Storage:**
- localStorage/sessionStorage - Not currently used but available for future state persistence

## Configuration Patterns

**API Placeholder Structure:**
- Empty directories with `.gitkeep` files indicate planned but unimplemented features:
  - Feedback API endpoint
  - Sessions CRUD endpoints
  - Q&A system
  - Deck management
  - Real-time video/audio WebSocket streams

**Service Integration Pattern:**
- No established pattern yet (no services integrated)
- Future pattern likely to follow Next.js API route conventions in `app/api/`

---

*Integration audit: 2026-02-21*
