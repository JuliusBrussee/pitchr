/**
 * Webapp server: serves static frontend and provides POST /api/token for ElevenLabs single-use token.
 */
import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Static frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Single-use token for browser → ElevenLabs WebSocket (realtime STT)
app.post("/api/token", async (_req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey?.trim()) {
    res.status(500).json({ error: "Server configuration error." });
    return;
  }
  try {
    const r = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
      method: "POST",
      headers: { "xi-api-key": apiKey.trim(), "Content-Type": "application/json" },
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("ElevenLabs token error:", r.status, t);
      res.status(500).json({ error: "Could not get token." });
      return;
    }
    const data = (await r.json()) as { token?: string };
    if (!data.token) {
      res.status(500).json({ error: "Invalid token response." });
      return;
    }
    res.json({ token: data.token });
  } catch (e) {
    console.error("Token request failed:", e);
    res.status(500).json({ error: "Token request failed." });
  }
});

app.listen(PORT, () => {
  console.log(`Server at http://localhost:${PORT}`);
});
