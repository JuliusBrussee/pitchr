# Live Q&A — Debug Log & Architecture

## How It Works

### Flow

```
┌─────────┐     POST /api/qna/session      ┌──────────┐     getSignedUrl()     ┌─────────────┐
│  Client  │ ──────────────────────────────► │  Next.js │ ───────────────────► │  ElevenLabs │
│  (React) │ ◄────── { signedUrl, context } │  API     │ ◄─── signed WS URL  │  ConvAI API │
└────┬─────┘                                └──────────┘                      └──────┬──────┘
     │                                                                               │
     │  WebSocket(signedUrl, ["convai"])                                              │
     ├──────────────────────────────────────────────────────────────────────────────►  │
     │                                                                               │
     │  ── { type: "conversation_initiation_client_data", dynamic_variables }  ──►   │
     │  ◄── { type: "conversation_initiation_metadata", formats, conv_id }  ────     │
     │                                                                               │
     │  [Mic capture starts ONLY after metadata received]                            │
     │                                                                               │
     │  ── { user_audio_chunk: "<base64 PCM16 @ 16kHz>" }  ──►                      │
     │  ◄── { type: "audio", audio_base_64: "<base64 PCM16>" }  ────                │
     │  ◄── { type: "agent_response", agent_response: "text" }  ────                │
     │  ◄── { type: "user_transcript", user_transcript: "text" }  ────              │
     │  ◄── { type: "ping", ping_event: { event_id: 2 } }  ────                    │
     │  ── { type: "pong", event_id: 2 }  ──►                                       │
     │                                                                               │
     │  [60s timer expires or user clicks Stop]                                      │
     │  ── { type: "conversation_end" }  ──►                                         │
     └───────────────────────────────────────────────────────────────────────────────►│
```

### Key Files

| File | Role |
|------|------|
| `hooks/useLiveQaAgent.ts` | Client-side WebSocket hook — mic capture, audio playback, transcript |
| `app/api/qna/session/route.ts` | Creates session, gets signed URL from ElevenLabs, builds context |
| `lib/elevenlabs/convai.ts` | ElevenLabs ConvAI API client (signed URL + conversation fetch) |
| `services/qna/contextBuilderService.ts` | Builds investor agent context from pitch analysis |
| `lib/prompts/qaAgent.ts` | System prompt template for the investor persona |
| `app/(app)/qa/[runId]/page.tsx` | UI page — controls, transcript timeline, metrics |
| `types/qna.ts` | TypeScript types for QA sessions, turns, evaluation |

### ElevenLabs Agent Setup

The agent is configured on the ElevenLabs dashboard with:
- **Agent ID** set in `ELEVENLABS_CONVAI_AGENT_ID` env var
- **System prompt** must contain `{{context}}` placeholder — this is a dynamic variable
- **Dynamic variable `context`** has a default placeholder value (e.g. "No context provided") which gets overridden at runtime by the pitch analysis context

---

## Bugs Fixed

### Bug 1: Wrong `conversation_initiation_client_data` format

**Symptom:** WS close code 1008, "Invalid message received" — immediate disconnect on open.

**Root cause:** The init message used a made-up payload structure:
```json
{
  "type": "conversation_initiation_client_data",
  "conversation_initiation_client_data": { "context": "..." }
}
```

ElevenLabs does not recognize `conversation_initiation_client_data` as a payload key.

**Fix:** Use the documented format with `dynamic_variables`:
```json
{
  "type": "conversation_initiation_client_data",
  "dynamic_variables": { "context": "..." }
}
```

**Note:** We first tried `conversation_config_override.agent.prompt.prompt` but the agent's config had prompt overrides disabled, so that also returned 1008 with "Override for field 'prompt' is not allowed by config."

---

### Bug 2: Missing WebSocket subprotocol `"convai"`

**Symptom:** WS close code 1008, "Invalid message received" — even with correct init payload.

**Root cause:** The WebSocket was opened without a subprotocol:
```js
new WebSocket(signedUrl)
```

The ElevenLabs ConvAI server requires the `"convai"` subprotocol. Without it, the server cannot interpret any messages. The official SDK always connects with:
```js
new WebSocket(url, ["convai"])
```

**Fix:**
```js
new WebSocket(wsUrl, ['convai'])
```

Also added `source=js_sdk&version=0.14.0` query params to match the SDK's connection string.

---

### Bug 3: Audio sent before server handshake complete

**Symptom:** WS close code 1008 ~2 seconds after connecting. Init message accepted, but subsequent audio rejected.

**Root cause:** `startMicCapture()` was called immediately in `ws.onopen`, before the server sent back `conversation_initiation_metadata`. The server was not ready to accept audio data yet.

The official SDK waits for the metadata response before setting up audio:
1. `onopen` → send init data
2. Wait for `conversation_initiation_metadata` message
3. Only then start audio streaming

Our code skipped step 2.

**Fix:** Moved `startMicCapture()` into the `onmessage` handler, triggered only after receiving `conversation_initiation_metadata`.

---

### Bug 4: Ping/pong `event_id` dropped (type mismatch)

**Symptom:** WS close code 1008, "Invalid message received" at exactly ~2 seconds (first ping arrival).

**Root cause:** The server sends pings with a numeric `event_id`:
```json
{ "type": "ping", "ping_event": { "event_id": 2 } }
```

The `parsePingEventId()` function used `asNonEmptyString()` to extract `event_id`, which only accepts strings. Since `event_id` is a **number** (2), it returned `null`. The pong was sent without `event_id`:
```json
{ "type": "pong" }
```

The server requires `event_id` in the pong response and rejected the message.

**Fix:** Pass `event_id` through as-is without type checking:
```js
const eventId = pingEvent?.event_id;
const pongPayload = eventId != null
  ? { type: 'pong', event_id: eventId }
  : { type: 'pong' };
```

---

### Bug 5: No audio playback

**Symptom:** Transcript showed agent responses but no sound was heard.

**Root cause:** The `onmessage` handler had no code to handle `audio` events from the server. Agent audio (base64-encoded PCM16 at 16kHz) was received but silently ignored.

**Fix:** Added `playAudioChunk()` function that:
1. Decodes base64 → Int16 PCM → Float32 samples
2. Creates an `AudioContext` at the server's output sample rate (parsed from `conversation_initiation_metadata`)
3. Queues audio buffers for gapless playback using scheduled `BufferSource.start(time)`

---

### Bug 6: Duplicate transcript entries

**Symptom:** Every agent/founder turn appeared twice in the transcript timeline.

**Root cause:** The generic `parseLiveTextEvent()` function matched events through multiple code paths — it checked for `agent_response_event.agent_response`, then also matched on `type.includes('agent')`, causing the same text to be appended twice via different branches.

**Fix:** Replaced the generic parser with explicit per-type handlers:
- `type === 'agent_response'` → investor turn
- `type === 'user_transcript'` → founder turn
- `type === 'audio'` → playback only (no transcript)

---

## ElevenLabs ConvAI WebSocket Protocol Summary

Learned from reverse-engineering the official `@elevenlabs/client` SDK (v0.14.0):

| Direction | Message | Format |
|-----------|---------|--------|
| Client → Server | Init | `{ type: "conversation_initiation_client_data", dynamic_variables: {...} }` |
| Server → Client | Metadata | `{ type: "conversation_initiation_metadata", conversation_initiation_metadata_event: { conversation_id, agent_output_audio_format, user_input_audio_format } }` |
| Client → Server | Audio | `{ user_audio_chunk: "<base64>" }` |
| Server → Client | Audio | `{ type: "audio", audio_base_64: "<base64>", event_id: N }` |
| Server → Client | Agent text | `{ type: "agent_response", agent_response: "text" }` |
| Server → Client | User text | `{ type: "user_transcript", user_transcript: "text" }` |
| Server → Client | Ping | `{ type: "ping", ping_event: { event_id: N } }` |
| Client → Server | Pong | `{ type: "pong", event_id: N }` |
| Client → Server | End | `{ type: "conversation_end" }` |
| Client → Server | Text msg | `{ type: "user_message", text: "..." }` |

**Connection requirements:**
- Subprotocol: `["convai"]`
- Query params: `source=js_sdk&version=X.Y.Z` (expected by server)
- Handshake: must wait for `conversation_initiation_metadata` before sending audio
- Pong: must include `event_id` from the ping (as number, not string)
