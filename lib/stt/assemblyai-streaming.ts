/**
 * AssemblyAI Streaming Speech-to-Text: real-time partial and final transcripts over WebSocket.
 * Server-only; uses ASSEMBLYAI_API_KEY. Used to drive live WPM and filler metrics during a session.
 */

import WebSocket from "ws";

const STREAMING_WS_URL = "wss://streaming.assemblyai.com/v3/ws";
const SAMPLE_RATE = 16000;

function getApiKey(): string {
  const key = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing ASSEMBLYAI_API_KEY.");
  }
  return key;
}

export interface PartialTranscriptPayload {
  text: string;
  words?: Array<{ text: string; start: number; end: number }>;
}

export interface FinalTranscriptPayload {
  text: string;
  words?: Array<{ text: string; start: number; end: number }>;
}

export interface AssemblyAIStreamingCallbacks {
  onPartial?: (payload: PartialTranscriptPayload) => void;
  onFinal?: (payload: FinalTranscriptPayload) => void;
  onError?: (message: string) => void;
}

/**
 * Create a streaming session: connect to AssemblyAI realtime WS, send PCM audio,
 * and invoke callbacks for partial/final transcripts. Audio must be 16-bit PCM mono at 16kHz.
 */
export function createAssemblyAIStreamingSession(
  callbacks: AssemblyAIStreamingCallbacks = {}
): {
  sendAudio: (buffer: Buffer) => void;
  close: () => void;
  isOpen: () => boolean;
} {
  const apiKey = getApiKey();
  const url = `${STREAMING_WS_URL}?sample_rate=${SAMPLE_RATE}&encoding=pcm_s16le&format_turns=true&speech_model=universal-streaming-english`;
  const queue: Buffer[] = [];
  let ws: WebSocket | null = null;
  let opened = false;

  try {
    ws = new WebSocket(url, {
      headers: {
        Authorization: apiKey,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "WebSocket create failed";
    callbacks.onError?.(msg);
    return {
      sendAudio: () => {},
      close: () => {},
      isOpen: () => false,
    };
  }

  ws.binaryType = "nodebuffer";

  ws.on("open", () => {
    opened = true;
    while (queue.length > 0) {
      const buf = queue.shift();
      if (buf && ws?.readyState === WebSocket.OPEN) ws.send(buf);
    }
  });

  ws.on("message", (data: Buffer | string) => {
    const raw = typeof data === "string" ? data : data.toString("utf8");
    let data_: {
      type?: string;
      transcript?: string;
      utterance?: string;
      turn_is_formatted?: boolean;
      words?: Array<{ text?: string; start?: number; end?: number }>;
      error?: string;
    };
    try {
      data_ = JSON.parse(raw) as typeof data_;
    } catch {
      return;
    }

    const type = data_.type;

    if (type === "Begin" || type === "Termination") {
      return;
    }

    if (type === "Turn") {
      const formatted = data_.turn_is_formatted === true;
      // Formatted final turn may use utterance (punctuated); otherwise use transcript.
      const transcript =
        formatted && (data_.utterance ?? "").trim().length > 0
          ? (data_.utterance ?? "").trim()
          : (data_.transcript ?? "").trim();
      const wordsRaw = data_.words ?? [];
      const words = wordsRaw.map((w) => ({
        text: String(w.text ?? "").trim(),
        start: (Number(w.start) || 0) / 1000,
        end: (Number(w.end) || 0) / 1000,
      }));

      if (formatted) {
        callbacks.onFinal?.({ text: transcript, words });
      } else {
        callbacks.onPartial?.({ text: transcript, words: words.length > 0 ? words : undefined });
      }
      return;
    }

    if (data_.error || (type && (type.endsWith("_error") || type === "error"))) {
      callbacks.onError?.(data_.error ?? type ?? "Streaming error");
    }
  });

  ws.on("error", (err) => {
    callbacks.onError?.(err.message ?? "WebSocket error");
  });

  ws.on("close", () => {
    opened = false;
    ws = null;
  });

  return {
    sendAudio(buffer: Buffer) {
      if (buffer.length === 0) return;
      if (opened && ws?.readyState === WebSocket.OPEN) {
        ws.send(buffer);
      } else {
        queue.push(Buffer.from(buffer));
      }
    },
    close() {
      if (ws) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "Terminate" }));
          }
          ws.close();
        } catch (_) {}
        ws = null;
      }
      opened = false;
      queue.length = 0;
    },
    isOpen: () => opened && ws?.readyState === WebSocket.OPEN,
  };
}
