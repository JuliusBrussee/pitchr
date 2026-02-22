/**
 * Realtime STT proxy: serves static frontend and relays browser audio to ElevenLabs over WebSocket.
 * API key stays server-side; client connects to this server only.
 * On session stop, generates one LLM-created Q&A from the transcript and optional TTS.
 */
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import fs from "node:fs";
import WebSocket, { WebSocketServer } from "ws";
import { generateFeedbackQuestion, getCoachFeedback } from "./lib/llm/feedbackQA";
import { getPitchFromEnv } from "./lib/llm/pitchCoach";
import { synthesizeMp3 } from "./lib/elevenlabs/tts";
import {
  buildChecklistUpdateMessage,
  createRealtimeChecklistSessionState,
  evaluateRealtimeChecklist,
} from "./services/realtimeChecklistService";
import type { PitchMode } from "./types/pitch";

// Load local overrides first, then fallback to shared env.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const hasTtsKey = !!(process.env.ELEVENLABS_API_KEY_TTS?.trim());
const hasVoiceId = !!(process.env.ELEVENLABS_VOICE_ID?.trim());
if (!hasTtsKey || !hasVoiceId) {
  console.warn(
    "[TTS] Env check: ELEVENLABS_API_KEY_TTS=" + (hasTtsKey ? "set" : "MISSING") +
    ", ELEVENLABS_VOICE_ID=" + (hasVoiceId ? "set" : "MISSING") +
    ". Coach voice feedback will fail until both are set in .env.local and server is restarted.",
  );
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3000;
const ELEVENLABS_WS_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";

function getElevenLabsSttApiKey(): string {
  const direct = process.env.ELEVENLABS_API_KEY?.trim();
  if (direct) return direct;
  const stt = process.env.ELEVENLABS_API_KEY_STT?.trim();
  if (stt) return stt;
  return "";
}

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});
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

app.post("/api/coach-answer", express.json(), async (req, res) => {
  try {
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    const answer = typeof req.body?.answer === "string" ? req.body.answer.trim() : "";
    if (!question || !answer) {
      res.status(400).json({ error: "Missing question or answer" });
      return;
    }
    const pitch = getPitchFromEnv();
    const feedbackText = await getCoachFeedback(question, answer, pitch);
    let audioBase64: string | undefined;
    let audioError: string | undefined;
    try {
      const { audio } = await synthesizeMp3(feedbackText);
      audioBase64 = audio.toString("base64");
      console.log("[coach-answer] TTS OK, audio size:", audio.length, "bytes");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[coach-answer] TTS failed:", msg);
      audioError = msg;
    }
    res.json({ feedbackText, audioBase64, audioError });
  } catch (e) {
    console.error("coach-answer error:", e);
    res.status(500).json({
      error: e instanceof Error ? e.message : "Coach feedback failed",
    });
  }
});

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

function isPitchMode(value: unknown): value is PitchMode {
  return value === "elevator" || value === "vc_pitch";
}

wss.on("connection", (clientWs) => {
  const apiKey = getElevenLabsSttApiKey();
  if (!apiKey) {
    clientWs.send(
      JSON.stringify({
        type: "error",
        error: "Server configuration error: missing ELEVENLABS_API_KEY (or ELEVENLABS_API_KEY_STT).",
      })
    );
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
  let livePartialTranscript = "";
  const segments: { text: string; start: number; end: number }[] = [];
  let stopRequested = false;
  let saveDone = false;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
  let answerMode = false;
  let checklistSession = createRealtimeChecklistSessionState("elevator");
  let checklistInFlight = false;
  let checklistPending = false;
  let checklistPendingForce = false;

  function forwardToClient(obj: object) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(obj));
    }
  }

  function sendChecklistSnapshot(source: "llm" | "heuristic"): void {
    forwardToClient(
      buildChecklistUpdateMessage({
        mode: checklistSession.mode,
        source,
        items: checklistSession.items,
        evaluatedAtIso: new Date().toISOString(),
      })
    );
  }

  function getChecklistTranscript(): string {
    const committed = transcript.trim();
    const partial = livePartialTranscript.trim();
    if (!partial) return committed;
    if (!committed) return partial;
    if (committed.endsWith(partial)) return committed;
    return `${committed} ${partial}`.trim();
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
          transcript: getChecklistTranscript(),
          previousItems: checklistSession.items,
          scheduler: checklistSession.scheduler,
          sessionStartedAtMs: checklistSession.startedAtMs,
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

  async function flushAndSave() {
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
    const finalTranscript = getChecklistTranscript();
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
      fs.writeFileSync(txtPath, finalTranscript, "utf8");
      fs.writeFileSync(jsonPath, JSON.stringify({ transcript: finalTranscript, segments: jsonSegments }, null, 2), "utf8");
    } catch (e) {
      console.error("Write failed:", e);
      forwardToClient({ type: "error", error: "Failed to save transcript." });
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
      return;
    }

    let feedbackQuestion = "";
    let feedbackError: string | undefined;
    try {
      const intendedPitch = getPitchFromEnv();
      feedbackQuestion = await generateFeedbackQuestion(intendedPitch);
    } catch (e) {
      console.error("Feedback question error:", e);
      feedbackError = e instanceof Error ? e.message : "Feedback failed";
    }
    forwardToClient({
      type: "saved",
      transcriptPath: txtPath,
      jsonPath,
      feedbackQuestion,
      feedbackError,
    });
    // Voice feedback: speak the question via ElevenLabs so the user hears it and can answer
    if (feedbackQuestion && clientWs.readyState === WebSocket.OPEN) {
      try {
        const { audio } = await synthesizeMp3(feedbackQuestion);
        forwardToClient({ type: "feedback_audio", base64: audio.toString("base64") });
      } catch (e) {
        console.error("TTS error:", e);
      }
    }
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
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
    if (msg.message_type === "partial_transcript") {
      const nextPartial = msg.text?.trim() ?? "";
      if (nextPartial !== livePartialTranscript) {
        livePartialTranscript = nextPartial;
        queueChecklistEvaluation(false);
      }
      return;
    }

    const isCommitted =
      msg.message_type === "committed_transcript_with_timestamps" ||
      msg.message_type === "committed_transcript";

    if (isCommitted && msg.text) {
      livePartialTranscript = "";
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
        if (!answerMode && stopRequested && !saveDone && !saveTimeout) {
          if (fallbackTimeout) {
            clearTimeout(fallbackTimeout);
            fallbackTimeout = null;
          }
          saveTimeout = setTimeout(async () => {
            saveTimeout = null;
            flushAndSave();
            if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
          }, 800);
        }
        return;
      }

      transcript += msg.text;
      segments.push({ text: msg.text, start, end });
      queueChecklistEvaluation(stopRequested);
      if (!answerMode && stopRequested && !saveDone && !saveTimeout) {
        if (fallbackTimeout) {
          clearTimeout(fallbackTimeout);
          fallbackTimeout = null;
        }
        saveTimeout = setTimeout(async () => {
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
    let msg: { type?: string; message_type?: string; question?: string; mode?: string };
    try {
      msg = JSON.parse(raw) as { type?: string; message_type?: string; question?: string; mode?: string };
    } catch {
      return;
    }
    if (msg.type === "start_answer") {
      answerMode = true;
      return;
    }
    if (msg.type === "session_config") {
      if (!isPitchMode(msg.mode)) {
        forwardToClient({ type: "checklist_error", error: "Invalid pitch mode." });
        return;
      }
      checklistSession = createRealtimeChecklistSessionState(msg.mode, Date.now());
      livePartialTranscript = "";
      sendChecklistSnapshot("heuristic");
      return;
    }
    if (msg.type === "stop") {
      stopRequested = true;
      queueChecklistEvaluation(true);
      if (answerMode) {
        console.log("[answer] Stop received, sending answer_transcript in 1.5s, transcript length:", transcript.length);
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
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
        fallbackTimeout = setTimeout(() => {
          fallbackTimeout = null;
          if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "answer_transcript", text: transcript }));
            setTimeout(() => {
              if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
            }, 200);
          }
        }, 1500);
        return;
      }
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
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      fallbackTimeout = setTimeout(async () => {
        fallbackTimeout = null;
        flushAndSave();
        if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) elevenLabsWs.close();
      }, 1500);
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
