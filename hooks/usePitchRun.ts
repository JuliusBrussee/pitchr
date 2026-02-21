'use client';

import { useCallback, useState } from 'react';
import type { AnalysisMeta, AnalysisOutputs } from '@/types/analysis-v2';
import type {
  CreatePitchRunErrorResponse,
  CreatePitchRunRequest,
  CreatePitchRunResponse,
} from '@/types/pitch';

export interface RunPitchAnalysisResult {
  runId: string;
  status: CreatePitchRunResponse['status'];
  analysis?: CreatePitchRunResponse['analysis'];
  outputs?: AnalysisOutputs;
  meta?: AnalysisMeta;
  coverage?: 'spoken_only' | 'spoken+deck';
  analysisVersion?: 'v2';
  fallback?: boolean;
  error?: string;
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

        const payload = (await response.json()) as CreatePitchRunResponse | CreatePitchRunErrorResponse;

        if (!response.ok) {
          throw new Error(
            'error' in payload && payload.error
              ? payload.error
              : 'Pitch analysis failed.',
          );
        }

        const success = payload as CreatePitchRunResponse;

        return {
          runId: success.runId,
          status: success.status,
          analysis: success.analysis,
          outputs: success.outputs,
          meta: success.meta,
          coverage: success.coverage,
          analysisVersion: success.analysisVersion,
          fallback: success.fallback,
          error: success.error,
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
