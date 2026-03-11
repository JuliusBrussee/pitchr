/**
 * Realtime STT proxy: serves static frontend, buffers browser audio, transcribes via AssemblyAI on stop.
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
import { transcribeAudio } from "./lib/stt/assemblyai";
import { createAssemblyAIStreamingSession } from "./lib/stt/assemblyai-streaming";
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
const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function getAssemblyAIApiKey(): string {
  const key = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!key) return "";
  return key;
}

/** Build 44-byte WAV header for PCM 16-bit mono at 16000 Hz. */
function buildWavHeader(pcmByteLength: number): Buffer {
  const header = Buffer.alloc(44);
  const dataSize = pcmByteLength;
  const fileSize = 36 + dataSize;
  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(16000, 24); // sample rate
  header.writeUInt32LE(32000, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return header;
}

function parseAllowedOrigins(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) return new Set(DEFAULT_ALLOWED_ORIGINS);
  const parsed = raw.split(",").map((v) => v.trim()).filter(Boolean);
  return new Set(parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS);
}

const allowedOrigins = parseAllowedOrigins();

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return true;
    }
  } catch {
    // Fall through to explicit allow-list check.
  }
  return allowedOrigins.has(origin);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    res.status(403).json({ error: "Origin not allowed by sidecar CORS policy." });
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", origin ?? "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
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

app.get("/api/stt-capabilities", (_req, res) => {
  if (!getAssemblyAIApiKey()) {
    res.json({
      enabled: false,
      message: "Server configuration error: missing ASSEMBLYAI_API_KEY.",
    });
    return;
  }

  res.json({ enabled: true });
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

wss.on("connection", (clientWs, req) => {
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    clientWs.close(4003, "Origin not allowed");
    return;
  }

  const sttApiKey = getAssemblyAIApiKey();
  if (!sttApiKey) {
    clientWs.send(
      JSON.stringify({
        type: "error",
        error: "Server configuration error: missing ASSEMBLYAI_API_KEY.",
      })
    );
    clientWs.close();
    return;
  }

  let sessionStarted = false;
  const pcmChunks: Buffer[] = [];
  let transcript = "";
  let livePartialTranscript = "";
  const segments: { text: string; start: number; end: number }[] = [];
  let stopRequested = false;
  let saveDone = false;
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let answerMode = false;
  let checklistSession = createRealtimeChecklistSessionState("elevator");
  let checklistInFlight = false;
  let checklistPending = false;
  let checklistPendingForce = false;
  let transcriptionInProgress = false;
  let streamingSession: ReturnType<typeof createAssemblyAIStreamingSession> | null = null;

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

  async function runAssemblyAIAndFinish(isAnswer: boolean): Promise<void> {
    if (transcriptionInProgress) return;
    transcriptionInProgress = true;

    const concat = Buffer.concat(pcmChunks);
    if (concat.length === 0) {
      if (isAnswer) {
        forwardToClient({ type: "answer_transcript", text: "" });
        if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
      } else {
        transcript = "";
        flushAndSave();
      }
      transcriptionInProgress = false;
      return;
    }

    const wavHeader = buildWavHeader(concat.length);
    const wavBuffer = Buffer.concat([wavHeader, concat]);

    try {
      const result = await transcribeAudio({ bytes: wavBuffer, mimeType: "audio/wav" });
      transcript = result.text ?? "";
      if (result.words && result.words.length > 0) {
        const start = result.words[0].start;
        const end = result.words[result.words.length - 1].end;
        segments.length = 0;
        segments.push({ text: transcript, start, end });
      } else if (transcript) {
        segments.length = 0;
        segments.push({ text: transcript, start: 0, end: Math.max(0.25, transcript.split(/\s+/).length * 0.28) });
      }

      if (isAnswer) {
        forwardToClient({ type: "answer_transcript", text: transcript });
        if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
      } else {
        forwardToClient({
          message_type: "committed_transcript_with_timestamps",
          text: transcript,
          words: result.words?.map((w) => ({ text: w.text, start: w.start, end: w.end })),
        });
        flushAndSave();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transcription failed";
      console.error("[STT] AssemblyAI error:", msg);
      forwardToClient({ type: "error", error: msg });
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
    } finally {
      transcriptionInProgress = false;
    }
  }

  clientWs.on("message", (data: Buffer | string) => {
    const raw = typeof data === "string" ? data : data.toString();
    let msg: { type?: string; message_type?: string; question?: string; mode?: string; audio_base_64?: string };
    try {
      msg = JSON.parse(raw) as typeof msg;
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
      sessionStarted = true;
      checklistSession = createRealtimeChecklistSessionState(msg.mode, Date.now());
      livePartialTranscript = "";
      transcript = "";
      segments.length = 0;
      if (streamingSession) {
        streamingSession.close();
        streamingSession = null;
      }
      try {
        streamingSession = createAssemblyAIStreamingSession({
          onPartial(payload) {
            livePartialTranscript = payload.text?.trim() ?? "";
            forwardToClient({ message_type: "partial_transcript", text: payload.text ?? "" });
          },
          onFinal(payload) {
            const text = payload.text?.trim() ?? "";
            if (text) {
              transcript = transcript ? `${transcript} ${text}` : text;
              livePartialTranscript = "";
              const words = payload.words ?? [];
              const start = words.length > 0 ? (words[0]?.start ?? 0) : 0;
              const end = words.length > 0 ? (words[words.length - 1]?.end ?? start + 0.25) : start + 0.25;
              segments.push({ text, start, end });
              forwardToClient({
                message_type: "committed_transcript_with_timestamps",
                text,
                words: words.map((w) => ({ text: w.text, start: w.start, end: w.end })),
              });
            }
          },
          onError(err) {
            if (process.env.NODE_ENV !== "production") {
              console.warn("[STT] Streaming error:", err);
            }
          },
        });
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[STT] Streaming session create failed:", e);
        }
      }
      sendChecklistSnapshot("heuristic");
      return;
    }
    if (msg.type === "stop") {
      stopRequested = true;
      queueChecklistEvaluation(true);
      if (streamingSession) {
        streamingSession.close();
        streamingSession = null;
      }
      if (answerMode) {
        void runAssemblyAIAndFinish(true);
        return;
      }
      void runAssemblyAIAndFinish(false);
      return;
    }
    if (msg.message_type === "input_audio_chunk") {
      if (!sessionStarted) sessionStarted = true;
      const b64 = typeof msg.audio_base_64 === "string" ? msg.audio_base_64 : "";
      if (b64) {
        try {
          const buf = Buffer.from(b64, "base64");
          pcmChunks.push(buf);
          streamingSession?.sendAudio(buf);
        } catch (_) {
          // ignore malformed chunk
        }
      }
    }
  });

  clientWs.on("close", () => {
    if (streamingSession) {
      streamingSession.close();
      streamingSession = null;
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
  if (!getAssemblyAIApiKey()) {
    console.warn("[STT] ASSEMBLYAI_API_KEY not set — live transcript and WPM will not work. Set it in .env.local and restart.");
  }
});
