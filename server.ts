/**
 * Realtime STT proxy: serves static frontend and relays browser audio to ElevenLabs over WebSocket.
 * API key stays server-side; client connects to this server only.
 */
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import fs from "node:fs";
import WebSocket, { WebSocketServer } from "ws";
import {
  buildChecklistUpdateMessage,
  createRealtimeChecklistSessionState,
  evaluateRealtimeChecklist,
} from "./services/realtimeChecklistService";
import type { PitchMode } from "./types/pitch";

dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3000;
const ELEVENLABS_WS_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.type("html").send(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>STT Backend</title></head>
<body style="font-family:system-ui;max-width:32rem;margin:2rem auto;padding:0 1rem;">
  <h1>STT backend</h1>
  <p>This server provides the WebSocket for transcription. Use the main app: run <code>yarn dev</code> and open <a href="http://localhost:3000">http://localhost:3000</a>.</p>
</body></html>`);
});

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

function isPitchMode(value: unknown): value is PitchMode {
  return value === "elevator" || value === "vc_pitch";
}

wss.on("connection", (clientWs) => {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    clientWs.send(JSON.stringify({ type: "error", error: "Server configuration error." }));
    clientWs.close();
    return;
  }

  const params = new URLSearchParams({
    model_id: "scribe_v2_realtime",
    audio_format: "pcm_16000",
    include_timestamps: "true",
    commit_strategy: "vad",
    vad_threshold: "0.25",
    vad_silence_threshold_secs: "1.5",
    min_silence_duration_ms: "150",
  });
  const elevenLabsUrl = `${ELEVENLABS_WS_URL}?${params.toString()}`;
  const headers = { "xi-api-key": apiKey };

  let elevenLabsWs: WebSocket | null = null;
  let sessionStarted = false;
  const audioQueue: string[] = [];
  let transcript = "";
  const segments: { text: string; start: number; end: number }[] = [];
  let stopRequested = false;
  let saveDone = false;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
  let checklistSession = createRealtimeChecklistSessionState("elevator");
  let checklistInFlight = false;
  let checklistPending = false;
  let checklistPendingForce = false;

  function forwardToClient(obj: object) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(obj));
    }
  }

  function sendChecklistSnapshot(source: "openrouter" | "heuristic"): void {
    forwardToClient(
      buildChecklistUpdateMessage({
        mode: checklistSession.mode,
        source,
        items: checklistSession.items,
        evaluatedAtIso: new Date().toISOString(),
      })
    );
  }

  function queueChecklistEvaluation(force = false): void {
    if (checklistInFlight) {
      checklistPending = true;
      checklistPendingForce = checklistPendingForce || force;
      return;
    }

    checklistInFlight = true;
    void (async () => {
      try {
        const result = await evaluateRealtimeChecklist({
          mode: checklistSession.mode,
          transcript,
          previousItems: checklistSession.items,
          scheduler: checklistSession.scheduler,
          force,
        });

        if (result) {
          checklistSession = {
            ...checklistSession,
            items: result.items,
            scheduler: result.scheduler,
          };
          forwardToClient(result.message);
        }
      } catch (error) {
        forwardToClient({
          type: "checklist_error",
          error:
            error instanceof Error
              ? error.message
              : "Realtime checklist evaluation failed.",
        });
      } finally {
        checklistInFlight = false;
        if (checklistPending) {
          const nextForce = checklistPendingForce;
          checklistPending = false;
          checklistPendingForce = false;
          queueChecklistEvaluation(nextForce);
        }
      }
    })();
  }

  function transcriptTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  /** Split segments so each phrase ends at a period (one segment per sentence in the JSON). */
  function segmentsByPhrase(
    segs: { text: string; start: number; end: number }[]
  ): { text: string; start: number; end: number }[] {
    const out: { text: string; start: number; end: number }[] = [];
    for (const seg of segs) {
      const parts = seg.text.split(/(?<=\.)\s*/).map((s) => s.trim()).filter(Boolean);
      if (parts.length <= 1) {
        out.push(seg);
        continue;
      }
      const totalLen = parts.reduce((a, p) => a + p.length, 0);
      const duration = seg.end - seg.start;
      let t = seg.start;
      for (const part of parts) {
        const ratio = totalLen > 0 ? part.length / totalLen : 1 / parts.length;
        const endT = t + duration * ratio;
        out.push({ text: part, start: t, end: endT });
        t = endT;
      }
    }
    return out;
  }

  function flushAndSave() {
    if (saveDone) return;
    saveDone = true;
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    if (fallbackTimeout) {
      clearTimeout(fallbackTimeout);
      fallbackTimeout = null;
    }
    // #region agent log
    const half = Math.floor(transcript.length / 2);
    const firstHalf = transcript.slice(0, half);
    const secondHalf = transcript.slice(half);
    fetch("http://127.0.0.1:7941/ingest/012d3377-6e83-4feb-8f7e-f56921fb8148", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a91b2c" }, body: JSON.stringify({ sessionId: "a91b2c", location: "server.ts:flushAndSave", message: "before write", data: { transcriptLen: transcript.length, segmentsCount: segments.length, segmentTexts: segments.map((s) => s.text.length), firstHalfEqSecond: firstHalf === secondHalf, transcriptStart: transcript.slice(0, 100) }, timestamp: Date.now(), hypothesisId: "H4" }) }).catch(() => {});
    // #endregion
    const baseDir = path.join(process.cwd(), "transcript");
    const txtDir = path.join(baseDir, "txt");
    const jsonDir = path.join(baseDir, "json");
    try {
      fs.mkdirSync(txtDir, { recursive: true });
      fs.mkdirSync(jsonDir, { recursive: true });
    } catch (_) {
      forwardToClient({ type: "error", error: "Failed to create transcript folders." });
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
      return;
    }
    const ts = transcriptTimestamp();
    const txtPath = path.join(txtDir, `transcript_${ts}.txt`);
    const jsonPath = path.join(jsonDir, `transcript_${ts}.json`);
    const jsonSegments = segmentsByPhrase(segments);
    try {
      fs.writeFileSync(txtPath, transcript, "utf8");
      fs.writeFileSync(jsonPath, JSON.stringify({ transcript, segments: jsonSegments }, null, 2), "utf8");
      forwardToClient({ type: "saved", transcriptPath: txtPath, jsonPath });
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
    } catch (e) {
      console.error("Write failed:", e);
      forwardToClient({ type: "error", error: "Failed to save transcript." });
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
    }
  }

  elevenLabsWs = new WebSocket(elevenLabsUrl, { headers });

  elevenLabsWs.on("open", () => {
    // Start forwarding queued audio from client
    sessionStarted = true;
    sendChecklistSnapshot("heuristic");
    while (audioQueue.length > 0) {
      const msg = audioQueue.shift();
      if (msg && elevenLabsWs?.readyState === WebSocket.OPEN) elevenLabsWs.send(msg);
    }
  });

  elevenLabsWs.on("message", (data: Buffer | string) => {
    const raw = data.toString();
    let msg: { message_type?: string; text?: string; words?: { text?: string; start?: number; end?: number }[] };
    try {
      msg = JSON.parse(raw) as typeof msg;
    } catch {
      return;
    }
    forwardToClient(msg);
    const isCommitted =
      msg.message_type === "committed_transcript_with_timestamps" ||
      msg.message_type === "committed_transcript";

    if (isCommitted && msg.text) {
      const lastText = segments.length > 0 ? segments[segments.length - 1].text : null;
      const words = msg.words ?? [];
      const lastEnd = segments.length > 0 ? segments[segments.length - 1].end : 0;
      const start = words.length ? Math.min(...words.map((w) => w.start ?? 0)) : lastEnd;
      const end = words.length
        ? Math.max(...words.map((w) => w.end ?? 0))
        : start + Math.max(msg.text.trim().split(/\s+/).length * 0.28, 0.25);

      if (segments.length > 0 && lastText === msg.text) return;

      if (segments.length > 0 && lastText && msg.text.length > lastText.length && msg.text.startsWith(lastText)) {
        transcript = transcript.slice(0, -lastText.length) + msg.text;
        segments.pop();
        segments.push({ text: msg.text, start, end });
        queueChecklistEvaluation(stopRequested);
        // #region agent log
        fetch("http://127.0.0.1:7941/ingest/012d3377-6e83-4feb-8f7e-f56921fb8148", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a91b2c" }, body: JSON.stringify({ sessionId: "a91b2c", location: "server.ts:committed_transcript_with_timestamps", message: "replaced segment H6", data: { lastLen: lastText.length, newLen: msg.text.length }, timestamp: Date.now(), hypothesisId: "H6", runId: "post-fix" }) }).catch(() => {});
        // #endregion
        if (stopRequested && !saveDone && !saveTimeout) {
          saveTimeout = setTimeout(async () => {
            saveTimeout = null;
            await flushAndSave();
            if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
          }, 800);
        }
        return;
      }

      // #region agent log
      const skipped = segments.length > 0 && lastText === msg.text;
      fetch("http://127.0.0.1:7941/ingest/012d3377-6e83-4feb-8f7e-f56921fb8148", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a91b2c" }, body: JSON.stringify({ sessionId: "a91b2c", location: "server.ts:committed_transcript_with_timestamps", message: "commit event", data: { textLen: msg.text.length, textStart: msg.text.slice(0, 80), segmentsLenBefore: segments.length, lastSegmentStart: lastText ? lastText.slice(0, 80) : null, skipped, exactMatch: lastText === msg.text }, timestamp: Date.now(), hypothesisId: "H1_H2_H5" }) }).catch(() => {});
      // #endregion
      transcript += msg.text;
      segments.push({ text: msg.text, start, end });
      queueChecklistEvaluation(stopRequested);
      if (stopRequested && !saveDone && !saveTimeout) {
        saveTimeout = setTimeout(async () => {
          saveTimeout = null;
          await flushAndSave();
          if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
        }, 800);
      }
    }
  });

  elevenLabsWs.on("error", (err) => {
    console.error("ElevenLabs WS error:", err.message);
    forwardToClient({ type: "error", error: err.message });
  });

  elevenLabsWs.on("close", () => {
    elevenLabsWs = null;
  });

  clientWs.on("message", (data: Buffer | string) => {
    const raw = typeof data === "string" ? data : data.toString();
    let msg: { type?: string; message_type?: string; mode?: string };
    try {
      msg = JSON.parse(raw) as { type?: string; message_type?: string; mode?: string };
    } catch {
      return;
    }
    if (msg.type === "session_config") {
      if (!isPitchMode(msg.mode)) {
        forwardToClient({ type: "checklist_error", error: "Invalid pitch mode." });
        return;
      }
      checklistSession = createRealtimeChecklistSessionState(msg.mode);
      sendChecklistSnapshot("heuristic");
      return;
    }
    if (msg.type === "stop") {
      stopRequested = true;
      queueChecklistEvaluation(true);
      if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
        elevenLabsWs.send(
          JSON.stringify({
            message_type: "input_audio_chunk",
            audio_base_64: "",
            commit: true,
            sample_rate: 16000,
          })
        );
      }
      // Fallback: if no final commit arrives within 4s, save what we have and close
      fallbackTimeout = setTimeout(async () => {
        fallbackTimeout = null;
        await flushAndSave();
        if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
      }, 4000);
      return;
    }
    if (msg.message_type === "input_audio_chunk") {
      if (sessionStarted && elevenLabsWs?.readyState === WebSocket.OPEN) {
        elevenLabsWs.send(raw);
      } else {
        audioQueue.push(raw);
      }
    }
  });

  clientWs.on("close", () => {
    // When client sends "stop" it closes the socket; keep ElevenLabs open so we can
    // receive the final committed transcript and save before closing.
    if (!stopRequested && elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
      elevenLabsWs.close();
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});
