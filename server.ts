/**
 * Realtime STT proxy: serves static frontend and relays browser audio to ElevenLabs over WebSocket.
 * API key stays server-side; client connects to this server only.
 */
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import WebSocket, { WebSocketServer } from "ws";

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
  <p>This server provides the WebSocket for transcription. Use the main app: run <code>npm run dev</code> and open <a href="http://localhost:3000">http://localhost:3000</a>.</p>
</body></html>`);
});

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

wss.on("connection", (clientWs) => {
  const apiKey = process.env.ELEVENLABS_API_KEY_STT?.trim() || process.env.ELEVENLABS_API_KEY?.trim();
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

  function forwardToClient(obj: object) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(obj));
    }
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
    forwardToClient({ type: "saved" });
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
  }

  elevenLabsWs = new WebSocket(elevenLabsUrl, { headers });

  elevenLabsWs.on("open", () => {
    // Start forwarding queued audio from client
    sessionStarted = true;
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
        if (stopRequested && !saveDone && !saveTimeout) {
          saveTimeout = setTimeout(() => {
            saveTimeout = null;
            flushAndSave();
            if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
          }, 800);
        }
        return;
      }

      transcript += msg.text;
      segments.push({ text: msg.text, start, end });
      if (stopRequested && !saveDone && !saveTimeout) {
        saveTimeout = setTimeout(() => {
          saveTimeout = null;
          flushAndSave();
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
    let msg: { type?: string; message_type?: string };
    try {
      msg = JSON.parse(raw) as { type?: string; message_type?: string };
    } catch {
      return;
    }
    if (msg.type === "stop") {
      stopRequested = true;
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
      fallbackTimeout = setTimeout(() => {
        fallbackTimeout = null;
        flushAndSave();
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
