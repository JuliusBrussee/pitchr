'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Square, X } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { usePitchRun } from '@/hooks/usePitchRun';
import { uploadRecording } from '@/services/recordingService';
import { createClient } from '@/lib/supabase/client';
import { CountdownTimer } from '@/views/components/arena/CountdownTimer';
import { AnalyzingOverlay } from '@/views/components/AnalyzingOverlay';
import { GlassCard } from '@/views/components/ui/GlassCard';
import type { Scenario } from '@/types/arena';
import type { PitchMode } from '@/types/pitch';

const ANALYSIS_TIMEOUT_MS = 90_000;

type RecorderPhase = 'starting' | 'recording' | 'processing';

interface ArenaRecorderProps {
  scenario: Scenario;
  timeLimitSec: number;
  onComplete: (runId: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

export function ArenaRecorder({
  scenario,
  timeLimitSec,
  onComplete,
  onCancel,
  onError,
}: ArenaRecorderProps) {
  const [phase, setPhase] = useState<RecorderPhase>('starting');
  const [showProcessingCancel, setShowProcessingCancel] = useState(false);
  const hasStoppedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    error: micError,
  } = useAudioRecorder();

  const { runPitchAnalysis } = usePitchRun();

  // Start mic on mount
  useEffect(() => {
    let cancelled = false;
    startRecording()
      .then(() => {
        if (!cancelled) setPhase('recording');
      })
      .catch(() => {
        if (!cancelled) onError('Microphone access denied. Please allow mic permissions and try again.');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Propagate mic errors
  useEffect(() => {
    if (micError && phase === 'starting') {
      onError(micError);
    }
  }, [micError, phase, onError]);

  // Show cancel button after delay during processing, and timeout safety net
  useEffect(() => {
    if (phase !== 'processing') {
      setShowProcessingCancel(false);
      return;
    }

    const cancelTimer = setTimeout(() => setShowProcessingCancel(true), 10_000);
    const timeoutTimer = setTimeout(() => {
      abortRef.current?.abort();
      onError('Analysis timed out. Please try again.');
    }, ANALYSIS_TIMEOUT_MS);

    return () => {
      clearTimeout(cancelTimer);
      clearTimeout(timeoutTimer);
    };
  }, [phase, onError]);

  const handleCancel = useCallback(() => {
    // Stop active recording before unmounting
    void stopRecording().catch(() => { /* cleanup best-effort */ });
    onCancel();
  }, [stopRecording, onCancel]);

  const handleProcessingCancel = useCallback(() => {
    abortRef.current?.abort();
    onError('Analysis cancelled.');
  }, [onError]);

  const handleStop = useCallback(async () => {
    if (hasStoppedRef.current) return;
    hasStoppedRef.current = true;
    setPhase('processing');

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const { audioBlob, transcript } = await stopRecording();

      if (abort.signal.aborted) return;

      // Best-effort upload
      let audioUrl: string | undefined;
      if (audioBlob && audioBlob.size > 0) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const tempId = crypto.randomUUID();
          audioUrl = await uploadRecording(supabase, user?.id ?? 'anonymous', tempId, audioBlob);
        } catch (uploadErr) {
          console.warn('[arena-recorder] Upload failed, proceeding without:', uploadErr);
        }
      }

      if (abort.signal.aborted) return;

      const mode = (scenario.pitchType === 'vc_pitch' ? 'vc_pitch' : 'elevator') as PitchMode;

      const result = await runPitchAnalysis({
        mode,
        inputType: 'audio',
        transcript: transcript || '[No transcript captured]',
        audioUrl,
      });

      if (abort.signal.aborted) return;

      onComplete(result.runId);
    } catch (err) {
      if (abort.signal.aborted) return;
      onError(err instanceof Error ? err.message : 'Pitch analysis failed.');
    }
  }, [stopRecording, runPitchAnalysis, scenario.pitchType, onComplete, onError]);

  // Countdown expiry auto-stops
  const handleCountdownComplete = useCallback(() => {
    void handleStop();
  }, [handleStop]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /* ——— Starting phase: waiting for mic ——— */
  if (phase === 'starting') {
    return (
      <div className="flex flex-col items-center gap-6 animate-fade-in-up">
        <GlassCard className="w-full max-w-md text-center">
          <div className="flex flex-col items-center gap-4 py-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#ff59411a' }}
            >
              <Mic size={28} className="animate-pulse" style={{ color: '#ff5941' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Requesting microphone access...
            </p>
            <button
              onClick={handleCancel}
              className="mt-2 px-4 py-2 rounded-xl border text-xs font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
              }}
            >
              Cancel
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  /* ——— Processing phase: analyzing overlay with escape hatch ——— */
  if (phase === 'processing') {
    return (
      <>
        <AnalyzingOverlay isVisible />
        {showProcessingCancel && (
          <div
            className="fixed bottom-8 left-1/2 z-[60] animate-fade-in-up"
            style={{ transform: 'translateX(-50%)' }}
          >
            <button
              onClick={handleProcessingCancel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <X size={12} />
              Cancel analysis
            </button>
          </div>
        )}
      </>
    );
  }

  /* ——— Recording phase ——— */
  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in-up">
      {/* Pitch countdown */}
      <CountdownTimer
        durationSec={timeLimitSec}
        onComplete={handleCountdownComplete}
        label="Pitch Time"
      />

      {/* Recording card */}
      <GlassCard className="w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-5 py-6">
          {/* Pulsing mic orb */}
          <div className="relative">
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                width: '72px',
                height: '72px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#ff594112',
                animationDuration: '2s',
              }}
            />
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #ff5941 0%, #ff7a33 50%, #ffaa33 100%)',
                boxShadow: '0 0 30px rgba(255, 89, 65, 0.3), 0 0 60px rgba(255, 170, 51, 0.1)',
              }}
            >
              {isRecording ? (
                <Mic size={24} color="#fff" strokeWidth={2.5} />
              ) : (
                <MicOff size={24} color="#fff" strokeWidth={2.5} />
              )}
            </div>
          </div>

          {/* Elapsed time */}
          <div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {formatTime(duration)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Recording your pitch
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { void handleStop(); }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: '#ff5941' }}
            >
              <Square size={14} fill="#fff" />
              Stop &amp; Submit
            </button>

            <button
              onClick={handleCancel}
              className="px-4 py-3 rounded-xl border text-sm font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
