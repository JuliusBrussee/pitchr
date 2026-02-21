(function () {
  "use strict";

  const TARGET_SAMPLE_RATE = 16000;
  const CHUNK_SAMPLES = 2048;

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const errorEl = document.getElementById("error");
  const liveEl = document.getElementById("live");
  const transcriptEl = document.getElementById("transcript");

  let audioContext = null;
  let stream = null;
  let ws = null;
  let processor = null;
  let source = null;

  function setError(msg) {
    errorEl.textContent = msg || "";
  }

  function setLive(text) {
    liveEl.textContent = text || "";
  }

  function appendTranscript(text, isFinal) {
    if (!text) return;
    const span = document.createElement("span");
    span.className = isFinal ? "final-line" : "";
    span.textContent = text;
    transcriptEl.appendChild(span);
  }

  function resampleTo16k(float32Mono, inputSampleRate) {
    if (inputSampleRate === TARGET_SAMPLE_RATE) return float32Mono;
    const inLen = float32Mono.length;
    const outLen = Math.round((inLen * TARGET_SAMPLE_RATE) / inputSampleRate);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const srcIdx = (i * inputSampleRate) / TARGET_SAMPLE_RATE;
      const j = Math.floor(srcIdx);
      const frac = srcIdx - j;
      const a = float32Mono[j] ?? 0;
      const b = float32Mono[Math.min(j + 1, inLen - 1)] ?? 0;
      out[i] = a + frac * (b - a);
    }
    return out;
  }

  function floatTo16BitPcm(float32Array) {
    const int16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16;
  }

  function base64FromInt16(int16Array) {
    const uint8 = new Uint8Array(int16Array.buffer);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    return btoa(binary);
  }

  function sendChunk(base64, commit) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        message_type: "input_audio_chunk",
        audio_base_64: base64,
        commit: !!commit,
        sample_rate: TARGET_SAMPLE_RATE,
      })
    );
  }

  function stopRecording() {
    if (processor) {
      try {
        processor.disconnect();
      } catch (_) {}
      processor = null;
    }
    if (source) {
      try {
        source.disconnect();
      } catch (_) {}
      source = null;
    }
    if (stream) {
      stream.getTracks().forEach(function (t) {
        t.stop();
      });
      stream = null;
    }
    sendChunk("", true);
    if (ws) {
      try {
        ws.close();
      } catch (_) {}
      ws = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setLive("");
  }

  function handleMessage(event) {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (_) {
      return;
    }
    const type = msg.message_type;
    if (type === "partial_transcript" && msg.text != null) {
      setLive(msg.text);
      return;
    }
    if (type === "committed_transcript" && msg.text != null) {
      appendTranscript(msg.text, true);
      setLive("");
      return;
    }
    if (type === "committed_transcript_with_timestamps" && msg.text != null) {
      appendTranscript(msg.text, true);
      setLive("");
      return;
    }
    if (type === "error" || type === "auth_error" || (type && type.endsWith("_error"))) {
      setError("Transcription error: " + (msg.error || type));
    }
  }

  startBtn.addEventListener("click", async function () {
    setError("");
    setLive("");
    transcriptEl.innerHTML = "";
    startBtn.disabled = true;

    let token;
    try {
      const res = await fetch("/api/token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not get token.");
        startBtn.disabled = false;
        return;
      }
      token = data.token;
    } catch (e) {
      setError("Network error: " + (e.message || "failed"));
      startBtn.disabled = false;
      return;
    }

    if (!token) {
      setError("No token returned.");
      startBtn.disabled = false;
      return;
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setError("Microphone access denied or not supported.");
      startBtn.disabled = false;
      return;
    }

    const params = new URLSearchParams({
      token: token,
      model_id: "scribe_v2_realtime",
      audio_format: "pcm_16000",
      include_timestamps: "true",
    });
    const wsUrl = "wss://api.elevenlabs.io/v1/speech-to-text/realtime?" + params.toString();

    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      setError("WebSocket error: " + (e.message || "failed"));
      stream.getTracks().forEach(function (t) {
        t.stop();
      });
      startBtn.disabled = false;
      return;
    }

    ws.onerror = function () {
      setError("WebSocket error.");
    };
    ws.onclose = function () {
      stopRecording();
    };
    ws.onmessage = handleMessage;

    ws.onopen = function () {
      stopBtn.disabled = false;
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;

      source = audioContext.createMediaStreamSource(stream);
      processor = audioContext.createScriptProcessor(4096, 1, 1);

      let buffer = new Float32Array(0);

      processor.onaudioprocess = function (e) {
        const input = e.inputBuffer.getChannelData(0);
        const mono = input.length === 0 ? new Float32Array(0) : input;
        const resampled = resampleTo16k(mono, sampleRate);
        const totalLen = buffer.length + resampled.length;
        const newBuffer = new Float32Array(totalLen);
        newBuffer.set(buffer);
        newBuffer.set(resampled, buffer.length);
        buffer = newBuffer;

        while (buffer.length >= CHUNK_SAMPLES) {
          const chunk = buffer.slice(0, CHUNK_SAMPLES);
          buffer = buffer.slice(CHUNK_SAMPLES);
          const int16 = floatTo16BitPcm(chunk);
          const b64 = base64FromInt16(int16);
          sendChunk(b64, false);
        }
      };

      source.connect(processor);
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);
    };
  });

  stopBtn.addEventListener("click", function () {
    stopRecording();
  });
})();
