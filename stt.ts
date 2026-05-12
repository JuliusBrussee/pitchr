/**
 * AssemblyAI STT CLI
 * Records from mic, then transcribes via AssemblyAI and saves transcript.
 * Stop: ENTER or Ctrl+C. Requires SoX on PATH (for node-record-lpcm16).
 */
import dotenv from "dotenv";
import { createRequire } from "node:module";
import * as fs from "node:fs";
import * as readline from "node:readline";
import { Transform } from "node:stream";
import { transcribeAudio } from "./lib/stt/assemblyai";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const record = require("node-record-lpcm16") as {
  record: (opts?: { sampleRate?: number; channels?: number }) => { stream: () => NodeJS.ReadableStream; stop: () => void };
};

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const SAMPLE_RATE = 16000;
const CHUNK_SIZE = 2048;
const WAV_HEADER_BYTES = 44;

let recording: { stream: () => NodeJS.ReadableStream; stop: () => void } | null = null;
let shutdownDone = false;
const pcmChunks: Buffer[] = [];

function getAssemblyAIApiKey(): string {
  return process.env.ASSEMBLYAI_API_KEY?.trim() ?? "";
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
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(16000, 24);
  header.writeUInt32LE(32000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return header;
}

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

async function shutdown(): Promise<void> {
  if (shutdownDone) return;
  shutdownDone = true;

  try {
    if (recording) recording.stop();
  } catch (_) {
    /* ignore */
  }

  const concat = Buffer.concat(pcmChunks);
  const outDir = process.cwd();
  const txtPath = `${outDir}/transcript.txt`;
  const jsonPath = `${outDir}/transcript.json`;

  if (concat.length === 0) {
    fs.writeFileSync(txtPath, "", "utf8");
    fs.writeFileSync(jsonPath, JSON.stringify({ transcript: "", segments: [] }, null, 2), "utf8");
    console.log("\nNo audio recorded. Saved empty " + txtPath + " and " + jsonPath);
    process.exit(0);
    return;
  }

  const wavHeader = buildWavHeader(concat.length);
  const wavBuffer = Buffer.concat([wavHeader, concat]);

  try {
    console.log("\nTranscribing with AssemblyAI...");
    const result = await transcribeAudio({ bytes: wavBuffer, mimeType: "audio/wav" });
    const transcript = result.text?.trim() ?? "";
    const segments = result.words?.length
      ? [{ text: transcript, words: result.words.map((w) => ({ text: w.text, start: w.start, end: w.end })) }]
      : [];

    fs.writeFileSync(txtPath, transcript, "utf8");
    fs.writeFileSync(jsonPath, JSON.stringify({ transcript, segments }, null, 2), "utf8");
    console.log("Saved " + txtPath + " and " + jsonPath);
  } catch (err) {
    console.error("Transcription failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
  process.exit(0);
}

function startRecording(): void {
  recording = record.record({ sampleRate: SAMPLE_RATE, channels: 1 });
  const strip = stripWavHeader();
  let buffer = Buffer.alloc(0);
  recording!.stream().pipe(strip);
  strip.on("data", (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= CHUNK_SIZE) {
      pcmChunks.push(buffer.subarray(0, CHUNK_SIZE));
      buffer = buffer.subarray(CHUNK_SIZE);
    }
  });
  strip.on("end", () => {
    if (buffer.length > 0) pcmChunks.push(buffer);
  });
  console.log("Recording. Press ENTER or Ctrl+C to stop.\n");
}

function main(): void {
  const apiKey = getAssemblyAIApiKey();
  if (!apiKey) {
    console.error("Missing ASSEMBLYAI_API_KEY. Set it in .env.local or .env.");
    process.exit(1);
  }

  startRecording();

  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode?.(true);
    process.stdin.on("keypress", (_str, key) => {
      if (key?.name === "return" || key?.name === "enter") void shutdown();
    });
  } else {
    process.stdin.on("data", (d: Buffer) => {
      if (d[0] === 13 || d[0] === 10) void shutdown();
    });
  }
  process.on("SIGINT", () => void shutdown());
}

main();
