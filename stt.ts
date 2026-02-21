/**
 * ElevenLabs Realtime STT CLI
 * Records from mic, streams PCM to ElevenLabs over WebSockets, saves transcript.
 * Stop: ENTER or Ctrl+C. Requires SoX on PATH (for node-record-lpcm16).
 */
import dotenv from "dotenv";
import { createRequire } from "node:module";
import * as fs from "node:fs";
import * as readline from "node:readline";
import { Transform } from "node:stream";
import WebSocket from "ws";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const record = require("node-record-lpcm16") as {
  record: (opts?: { sampleRate?: number; channels?: number }) => { stream: () => NodeJS.ReadableStream; stop: () => void };
};

dotenv.config({ path: ".env.local" });

const SAMPLE_RATE = 16000;
const CHUNK_SIZE = 2048;
const WAV_HEADER_BYTES = 44;
const WS_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime";
const PARAMS = new URLSearchParams({
  model_id: "scribe_v2_realtime",
  audio_format: "pcm_16000",
  include_timestamps: "true",
});

// --- State
let transcript = "";
const segments: { text: string; words: { text: string; start: number; end: number }[] }[] = [];
let recording: { stream: () => NodeJS.ReadableStream; stop: () => void } | null = null;
let shutdownDone = false;
let ws: WebSocket | null = null;

// --- Strip WAV header (first 44 bytes), forward raw PCM
function stripWavHeader(): Transform {
  let skipped = 0;
  return new Transform({
    transform(chunk: Buffer, _enc, cb) {
      if (skipped < WAV_HEADER_BYTES) {
        const take = Math.min(chunk.length, WAV_HEADER_BYTES - skipped);
        skipped += take;
        if (take < chunk.length) this.push(chunk.subarray(take));
      } else {
        this.push(chunk);
      }
      cb();
    },
  });
}

// --- Send audio chunk to WS
function sendAudioChunk(base64: string, commit: boolean): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      message_type: "input_audio_chunk",
      audio_base_64: base64,
      commit,
      sample_rate: SAMPLE_RATE,
    })
  );
}

// --- One-shot shutdown: stop mic, commit, close WS, write files, exit
function shutdown(): void {
  if (shutdownDone) return;
  shutdownDone = true;

  try {
    if (recording) recording.stop();
  } catch (_) {
    /* ignore */
  }

  // Flush: send final commit so server finalizes any pending transcript
  sendAudioChunk(Buffer.alloc(0).toString("base64"), true);

  if (ws) {
    try {
      ws.close();
    } catch (_) {
      /* ignore */
    }
    ws = null;
  }

  // Small delay so we can receive last committed_transcript* before closing
  setTimeout(() => {
    const outDir = process.cwd();
    const txtPath = `${outDir}/transcript.txt`;
    const jsonPath = `${outDir}/transcript.json`;
    fs.writeFileSync(txtPath, transcript, "utf8");
    fs.writeFileSync(
      jsonPath,
      JSON.stringify({ transcript, segments }, null, 2),
      "utf8"
    );
    console.log("\nSaved " + txtPath + " and " + jsonPath);
    process.exit(0);
  }, 500);
}

// --- Main
function main(): void {
  const apiKey = process.env.ELEVENLABS_API_KEY_STT || process.env.ELEVENLABS_API_KEY;
  if (!apiKey?.trim()) {
    console.error("Missing ELEVENLABS_API_KEY_STT (or ELEVENLABS_API_KEY fallback). Set it in .env.local.");
    process.exit(1);
  }

  const url = `${WS_URL}?${PARAMS.toString()}`;
  const headers = { "xi-api-key": apiKey.trim() };

  ws = new WebSocket(url, { headers });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    if (!shutdownDone) {
      shutdownDone = true;
      try {
        if (recording) recording.stop();
      } catch (_) {
        /* ignore */
      }
      process.exit(1);
    }
  });

  ws.on("close", () => {
    if (!shutdownDone) {
      try {
        if (recording) recording.stop();
      } catch (_) {
        /* ignore */
      }
    }
  });

  ws.on("message", (data: Buffer | string) => {
    let msg: { message_type?: string; text?: string; words?: { text?: string; start?: number; end?: number }[] };
    try {
      msg = JSON.parse(data.toString()) as typeof msg;
    } catch {
      return;
    }
    const type = msg.message_type;

    if (type === "session_started") {
      recording = record.record({ sampleRate: SAMPLE_RATE, channels: 1 });
      const strip = stripWavHeader();
      let buffer = Buffer.alloc(0);
      recording.stream().pipe(strip);
      strip.on("data", (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);
        while (buffer.length >= CHUNK_SIZE) {
          const slice = buffer.subarray(0, CHUNK_SIZE);
          buffer = buffer.subarray(CHUNK_SIZE);
          sendAudioChunk(slice.toString("base64"), false);
        }
      });
      strip.on("end", () => {
        if (buffer.length > 0) sendAudioChunk(buffer.toString("base64"), false);
      });
      console.log("Recording. Press ENTER or Ctrl+C to stop.\n");
      return;
    }

    if (type === "partial_transcript" && msg.text != null) {
      process.stdout.write("\r" + msg.text.padEnd(80, " ") + "\r");
      return;
    }

    if (type === "committed_transcript" && msg.text != null) {
      transcript += msg.text;
      process.stdout.write("\r" + " ".repeat(80) + "\r");
      console.log("[final] " + msg.text);
      return;
    }

    if (type === "committed_transcript_with_timestamps" && msg.text != null) {
      transcript += msg.text;
      const words = (msg.words ?? []).map((w) => ({
        text: w.text ?? "",
        start: w.start ?? 0,
        end: w.end ?? 0,
      }));
      segments.push({ text: msg.text, words });
      process.stdout.write("\r" + " ".repeat(80) + "\r");
      console.log("[final] " + msg.text);
      return;
    }

    if (
      type === "error" ||
      type === "auth_error" ||
      type === "quota_exceeded" ||
      type === "rate_limited" ||
      type === "transcriber_error" ||
      (typeof type === "string" && type.endsWith("_error"))
    ) {
      const err = (msg as { error?: string }).error ?? "Unknown error";
      console.error("API error:", type, err);
      shutdown();
    }
  });

  ws.on("open", () => {
    // Session starts when server sends session_started; we don't send anything first
  });

  // Stop on ENTER
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode?.(true);
    process.stdin.on("keypress", (_str, key) => {
      if (key?.name === "return" || key?.name === "enter") shutdown();
    });
  } else {
    process.stdin.on("data", (d: Buffer) => {
      if (d[0] === 13 || d[0] === 10) shutdown();
    });
  }
  process.on("SIGINT", () => shutdown());
}

main();
