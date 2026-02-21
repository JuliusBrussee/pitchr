'use client';

import { useCallback, useState } from 'react';
import { saveRun } from '@/models/run';
import type { AnalysisResult } from '@/types/analysis';
import type {
  CreatePitchRunErrorResponse,
  CreatePitchRunRequest,
  CreatePitchRunResponse,
  Run,
} from '@/types/pitch';

export interface RunPitchAnalysisResult {
  runId: string;
  analysis: AnalysisResult;
  fallback: boolean;
}

export interface UsePitchRunReturn {
  isAnalyzing: boolean;
  error: string | null;
  runPitchAnalysis: (
    input: CreatePitchRunRequest,
  ) => Promise<RunPitchAnalysisResult>;
}

export function usePitchRun(): UsePitchRunReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPitchAnalysis = useCallback(
    async (input: CreatePitchRunRequest): Promise<RunPitchAnalysisResult> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/pitch/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });

        const payload = (await response.json()) as
          | (CreatePitchRunResponse & { fallback?: boolean })
          | CreatePitchRunErrorResponse;

        if (!response.ok) {
          throw new Error(
            'error' in payload && payload.error
              ? payload.error
              : 'Pitch analysis failed.',
          );
        }

        const success = payload as CreatePitchRunResponse & { fallback?: boolean };
        const run: Run = {
          id: success.runId,
          createdAt: new Date().toISOString(),
          mode: input.mode,
          inputType: input.inputType,
          transcript: input.transcript,
          audioUrl: input.audioUrl,
          analysis: success.analysis,
          overallScore: success.analysis.overall_score,
        };
        saveRun(run);

        return {
          runId: success.runId,
          analysis: success.analysis,
          fallback: success.fallback ?? false,
        };
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Pitch analysis failed.';
        setError(message);
        throw caughtError;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  return {
    isAnalyzing,
    error,
    runPitchAnalysis,
  };
}
