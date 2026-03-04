'use client';

import { useCallback, useState } from 'react';
import { Mic, Loader2, CheckCircle, Trophy } from 'lucide-react';
import { GlassCard } from '@/views/components/ui/GlassCard';
import { ScenarioCard } from '@/views/components/arena/ScenarioCard';
import { CountdownTimer } from '@/views/components/arena/CountdownTimer';
import { ArenaRecorder } from '@/views/components/arena/ArenaRecorder';
import type { Scenario, ChallengeSubmission } from '@/types/arena';

type SubmitFlowStep = 'read' | 'record' | 'submit' | 'done';

interface ChallengeSubmitFlowProps {
  scenario: Scenario;
  isSubmitting: boolean;
  onSubmit: (runId: string) => Promise<void>;
  userSubmission?: ChallengeSubmission | null;
  userRank?: number | null;
}

export function ChallengeSubmitFlow({
  scenario,
  isSubmitting,
  onSubmit,
  userSubmission,
  userRank,
}: ChallengeSubmitFlowProps) {
  const [step, setStep] = useState<SubmitFlowStep>(
    userSubmission ? 'done' : 'read',
  );
  const [recordError, setRecordError] = useState<string | null>(null);

  const handleReadComplete = useCallback(() => {
    setRecordError(null);
    setStep('record');
  }, []);

  const handleRecordComplete = useCallback(async (runId: string) => {
    try {
      setStep('submit');
      await onSubmit(runId);
      setStep('done');
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : 'Failed to submit your pitch. Please try again.');
      setStep('read');
    }
  }, [onSubmit]);

  const handleRecordCancel = useCallback(() => {
    setStep('read');
  }, []);

  const handleRecordError = useCallback((message: string) => {
    setRecordError(message);
    setStep('read');
  }, []);

  /* ——— Step: Read the scenario brief ——— */
  if (step === 'read') {
    return (
      <div className="flex flex-col items-center gap-6 animate-fade-in-up">
        {recordError && (
          <div
            className="w-full max-w-md rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: '#e63b261a',
              backgroundColor: '#e63b260d',
              color: '#e63b26',
            }}
          >
            {recordError}
          </div>
        )}

        <CountdownTimer
          durationSec={scenario.readTimeSec}
          onComplete={handleReadComplete}
          label="Read Time"
        />

        <ScenarioCard scenario={scenario} showFullBrief />

        <button
          onClick={handleReadComplete}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90"
          style={{ backgroundColor: '#ff5941' }}
        >
          <Mic size={16} />
          Skip to Pitch
        </button>
      </div>
    );
  }

  /* ——— Step: Record the pitch ——— */
  if (step === 'record') {
    return (
      <div className="flex flex-col items-center gap-6 animate-fade-in-up">
        <ScenarioCard scenario={scenario} showFullBrief={false} />

        <ArenaRecorder
          scenario={scenario}
          timeLimitSec={scenario.timeLimitSec}
          onComplete={(runId) => { void handleRecordComplete(runId); }}
          onCancel={handleRecordCancel}
          onError={handleRecordError}
        />
      </div>
    );
  }

  /* ——— Step: Submitting ——— */
  if (step === 'submit' || isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 animate-fade-in-up">
        <Loader2
          size={32}
          className="animate-spin"
          style={{ color: '#ff5941' }}
        />
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          Submitting your challenge entry...
        </p>
      </div>
    );
  }

  /* ——— Step: Done / Results ——— */
  const submission = userSubmission;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto animate-fade-in-up">
      {/* Score Hero */}
      <GlassCard className="w-full text-center" animationDelay="0.1s">
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle size={28} style={{ color: '#22c55e' }} />

          <div>
            <span
              className="text-5xl font-bold tabular-nums"
              style={{ color: getScoreColor(submission?.totalScore ?? 0) }}
            >
              {submission?.totalScore ?? '--'}
            </span>
            <span
              className="text-xl font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              /100
            </span>
          </div>

          {submission?.baseScore !== undefined && submission?.bonusScore > 0 && (
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>Base: {submission.baseScore}</span>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <span style={{ color: '#ffaa33' }}>+{submission.bonusScore} bonus</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Rank + XP */}
      <GlassCard className="w-full" animationDelay="0.2s">
        <div className="flex items-center justify-between">
          {/* Rank */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#a855f71a', color: '#a855f7' }}
            >
              <Trophy size={20} />
            </div>
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider block"
                style={{ color: 'var(--text-muted)' }}
              >
                Your Rank
              </span>
              <span
                className="text-xl font-bold tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {userRank ? `#${userRank}` : '--'}
              </span>
            </div>
          </div>

          {/* XP */}
          <div className="text-right">
            <span
              className="text-xs font-semibold uppercase tracking-wider block"
              style={{ color: 'var(--text-muted)' }}
            >
              XP Earned
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: '#ffaa33' }}
            >
              +{submission?.xpEarned ?? 0} XP
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ——— Helpers ——— */

function getScoreColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#ffaa33';
  if (score >= 50) return '#ff5941';
  return '#e63b26';
}
