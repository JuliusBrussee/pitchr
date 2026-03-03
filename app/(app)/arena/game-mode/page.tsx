'use client';

import { ArrowLeft, Loader2, Mic } from 'lucide-react';
import Link from 'next/link';
import { useGameMode } from '@/hooks/useGameMode';
import { DIFFICULTY_SETTINGS } from '@/config/arena';
import { GlassCard } from '@/views/components/ui/GlassCard';
import { GameModePanel } from '@/views/components/arena/GameModePanel';
import { ScenarioCard } from '@/views/components/arena/ScenarioCard';
import { CountdownTimer } from '@/views/components/arena/CountdownTimer';
import { GameModeResults } from '@/views/components/arena/GameModeResults';

export default function GameModePage() {
  const {
    state,
    scenario,
    difficulty,
    results,
    error,
    selectDifficulty,
    startRecording,
    reset,
  } = useGameMode();

  const isShowFullBrief = difficulty !== 'expert';

  return (
    <main
      className="flex-1 overflow-y-auto rounded-2xl border p-8"
      style={{
        backgroundColor: 'var(--bg-surface)',
        backdropFilter: 'blur(var(--blur-strength))',
        WebkitBackdropFilter: 'blur(var(--blur-strength))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Back button */}
        <Link
          href="/arena"
          className="no-underline flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80 w-fit"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} />
          Back to Arena
        </Link>

        {/* Error banner */}
        {error && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: '#e63b261a',
              backgroundColor: '#e63b260d',
              color: '#e63b26',
            }}
          >
            {error}
          </div>
        )}

        {/* State: idle */}
        {state === 'idle' && (
          <GameModePanel
            onSelectDifficulty={selectDifficulty}
            isLoading={false}
          />
        )}

        {/* State: loading */}
        {state === 'loading' && (
          <GameModePanel
            onSelectDifficulty={selectDifficulty}
            isLoading={true}
          />
        )}

        {/* State: reading */}
        {state === 'reading' && scenario && difficulty && (
          <div className="flex flex-col items-center gap-6">
            <CountdownTimer
              durationSec={DIFFICULTY_SETTINGS[difficulty].readTimeSec}
              onComplete={startRecording}
              label="Read Time"
            />
            <ScenarioCard
              scenario={scenario}
              showFullBrief={isShowFullBrief}
            />
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
              style={{ backgroundColor: '#ff5941' }}
            >
              <Mic size={16} />
              Skip to Pitch
            </button>
          </div>
        )}

        {/* State: recording (placeholder) */}
        {state === 'recording' && scenario && difficulty && (
          <div className="flex flex-col items-center gap-6">
            <ScenarioCard
              scenario={scenario}
              showFullBrief={false}
            />
            <GlassCard className="w-full max-w-md text-center">
              <div className="flex flex-col items-center gap-4 py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: '#ff59411a' }}
                >
                  <Mic size={28} style={{ color: '#ff5941' }} />
                </div>
                <div>
                  <p
                    className="text-lg font-bold mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Recording...
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Pitch recorder integration coming soon.
                    <br />
                    Time limit: {DIFFICULTY_SETTINGS[difficulty].pitchTimeSec}s
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                  }}
                >
                  Cancel
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* State: submitting */}
        {state === 'submitting' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: '#ff5941' }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Analyzing your pitch...
            </p>
          </div>
        )}

        {/* State: results */}
        {state === 'results' && results && (
          <GameModeResults
            results={results}
            onPlayAgain={reset}
            onBackToArena={() => { window.location.href = '/arena'; }}
          />
        )}
      </div>
    </main>
  );
}
