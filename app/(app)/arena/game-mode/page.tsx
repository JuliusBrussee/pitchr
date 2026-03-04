'use client';

import { ArrowLeft, Loader2, Mic } from 'lucide-react';
import Link from 'next/link';
import { useGameMode } from '@/hooks/useGameMode';
import { DIFFICULTY_SETTINGS } from '@/config/arena';
import { GameModePanel } from '@/views/components/arena/GameModePanel';
import { ScenarioCard } from '@/views/components/arena/ScenarioCard';
import { CountdownTimer } from '@/views/components/arena/CountdownTimer';
import { ArenaRecorder } from '@/views/components/arena/ArenaRecorder';
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
    submitPitch,
    reportError,
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

        {/* State: recording */}
        {state === 'recording' && scenario && difficulty && (
          <div className="flex flex-col items-center gap-6">
            <ScenarioCard
              scenario={scenario}
              showFullBrief={false}
            />
            <ArenaRecorder
              scenario={scenario}
              timeLimitSec={DIFFICULTY_SETTINGS[difficulty].pitchTimeSec}
              onComplete={(runId) => { void submitPitch(runId); }}
              onCancel={reset}
              onError={reportError}
            />
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
