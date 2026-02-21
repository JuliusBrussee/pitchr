# HackEurope – ElevenLabs Realtime STT

Record voice and get a live transcript using [ElevenLabs Realtime Speech-to-Text](https://elevenlabs.io/realtime-speech-to-text) (Scribe v2) over WebSockets. Uses the browser microphone; the server issues a short-lived token and audio streams directly from the browser to ElevenLabs.

## Setup

- **Node 18+** (or Bun).
- **API key:** Create a key at [ElevenLabs → Profile → API key](https://elevenlabs.io/app/settings/api-keys). Put it in a `.env` file in the project root:

  ```
  ELEVENLABS_API_KEY=your_key_here
  ```

  Or set the `ELEVENLABS_API_KEY` environment variable.

## Run

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in your browser. Click **Start recording**, allow mic access, speak, then **Stop**. The transcript appears on the page.

- **Port:** Default is 3000. Override with `PORT=4000 npm run dev` (or set `PORT` in `.env`).
