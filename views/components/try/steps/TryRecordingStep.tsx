'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Square } from 'lucide-react';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useRecorder } from '@/hooks/useRecorder';
import { SiriBubble } from '@/views/components/SiriBubble';
import type { PitchMode } from '@/types/pitch';

interface TryRecordingStepProps {
  mode: PitchMode;
  onComplete: () => void;
}

const MODE_DURATION = {
  elevator: 30,
  vc_pitch: 300,
  hackathon: 210,
  final_year: 300,
};

export function TryRecordingStep({ mode, onComplete }: TryRecordingStepProps) {
  const { stream, videoRef, isCameraOn, isMicOn, toggleCamera, toggleMic, error: mediaError } = useMediaStream();
  const recorder = useRecorder();

  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [fakeWpm, setFakeWpm] = useState(0);
  const [fakeFillers, setFakeFillers] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const maxDuration = MODE_DURATION[mode];

  const stopAll = useCallback(() => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    recorder.stopRecording(); // blob is discarded
    onComplete();
  }, [recorder, onComplete]);

  const startAudioAnalysis = useCallback(() => {
    if (!stream) return;
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    audioContextRef.current = audioContext;

    let wpmTarget = 0;
    let fillerTimer = 0;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const isSpeaking = avg > 20;

      if (isSpeaking) {
        wpmTarget = 120 + Math.random() * 40;
        fillerTimer += 1;
      } else {
        wpmTarget = Math.max(0, wpmTarget - 2);
      }

      setFakeWpm(prev => Math.round(prev + (wpmTarget - prev) * 0.08));

      if (fillerTimer > 500 && Math.random() < 0.01) {
        setFakeFillers(prev => prev + 1);
        fillerTimer = 0;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, [stream]);

  const handleStart = useCallback(() => {
    if (!stream) return;
    recorder.startRecording(stream);
    setIsRecording(true);
    setHasStarted(true);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= maxDuration) {
          stopAll();
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);

    startAudioAnalysis();
  }, [stream, recorder, maxDuration, stopAll, startAudioAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const wpmColor = fakeWpm >= 130 && fakeWpm <= 160 ? '#22c55e' : fakeWpm > 160 ? '#ef4444' : 'var(--text-secondary)';

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 gap-6">
      {/* Camera preview or SiriBubble */}
      <div className="relative" style={{ width: 200, height: 200 }}>
        {/* Video always rendered so srcObject assignment works; visibility controlled below */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full rounded-full object-cover"
          style={{ transform: 'scaleX(-1)', display: isCameraOn && stream ? 'block' : 'none' }}
        />
        {/* Show orb only when camera is explicitly off — not during the stream-loading window */}
        {!isCameraOn && (
          <div className="absolute inset-0">
            <SiriBubble state={isRecording ? 'active' : 'idle'} fluid />
          </div>
        )}
        {/* Camera loading placeholder */}
        {isCameraOn && !stream && (
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#1a1a2e' }}
          />
        )}
      </div>

      {/* Timer */}
      <div className="text-center">
        <p
          className="text-4xl font-bold tabular-nums"
          style={{ color: elapsed >= maxDuration - 10 ? '#ef4444' : 'var(--text-primary)' }}
        >
          {formatTime(elapsed)}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {formatTime(maxDuration)} max
        </p>
      </div>

      {/* Live metrics (only show when recording) */}
      {isRecording && (
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums" style={{ color: wpmColor }}>
              {fakeWpm}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>WPM</p>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: 'var(--border-color)' }} />
          <div className="text-center">
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: fakeFillers > 3 ? '#ef4444' : fakeFillers > 0 ? '#f59e0b' : 'var(--text-secondary)' }}
            >
              {fakeFillers}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fillers</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMic}
          className="flex items-center justify-center w-12 h-12 rounded-full border transition-colors"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: isMicOn ? 'transparent' : 'rgba(239,68,68,0.1)',
          }}
        >
          {isMicOn ? (
            <Mic size={20} style={{ color: 'var(--text-primary)' }} />
          ) : (
            <MicOff size={20} style={{ color: '#ef4444' }} />
          )}
        </button>

        {!hasStarted ? (
          <button
            onClick={handleStart}
            disabled={!stream}
            className="flex items-center justify-center w-16 h-16 rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: '#ff5941' }}
          >
            <Mic size={28} />
          </button>
        ) : isRecording ? (
          <button
            onClick={stopAll}
            className="flex items-center justify-center w-16 h-16 rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#ef4444' }}
          >
            <Square size={24} fill="white" />
          </button>
        ) : null}

        <button
          onClick={toggleCamera}
          className="flex items-center justify-center w-12 h-12 rounded-full border transition-colors"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: isCameraOn ? 'transparent' : 'rgba(239,68,68,0.1)',
          }}
        >
          {isCameraOn ? (
            <Video size={20} style={{ color: 'var(--text-primary)' }} />
          ) : (
            <VideoOff size={20} style={{ color: '#ef4444' }} />
          )}
        </button>
      </div>

      {mediaError && (
        <p className="text-sm text-center max-w-xs" style={{ color: '#ef4444' }}>
          {mediaError}
        </p>
      )}

      {!hasStarted && !mediaError && (
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-secondary)' }}>
          Hit record and give us your best {mode === 'elevator' ? '30-second' : mode === 'hackathon' ? '3-minute' : mode === 'final_year' ? '4-minute' : '5-minute'} pitch.
          Don&apos;t overthink it — this is practice.
        </p>
      )}
    </div>
  );
}
