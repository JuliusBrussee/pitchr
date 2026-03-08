'use client';

import { useCallback, useState } from 'react';
import { fetchEdge } from '@/lib/supabase/fetch-edge';
import type { AnalysisMeta, AnalysisOutputs } from '@/types/analysis-v2';
import type {
  CreatePitchRunErrorResponse,
  CreatePitchRunRequest,
  CreatePitchRunResponse,
} from '@/types/pitch';
import { getEdgeErrorCode, getEdgeRedirectTo, parseRetryAfter } from '@/lib/supabase/edge-error';
import { useRateLimitCooldown } from '@/hooks/useRateLimitCooldown';

export interface RunPitchAnalysisResult {
  runId: string;
  status: CreatePitchRunResponse['status'];
  analysis?: CreatePitchRunResponse['analysis'];
  outputs?: AnalysisOutputs;
  meta?: AnalysisMeta;
  coverage?: 'spoken_only' | 'spoken+deck';
  analysisVersion?: 'v2';
  fallback?: boolean;
  providerUsed?: AnalysisMeta['provider_used'];
  warning?: string;
  error?: string;
}

export interface UsePitchRunReturn {
  isAnalyzing: boolean;
  error: string | null;
  isRateLimited: boolean;
  secondsRemaining: number;
  runPitchAnalysis: (
    input: CreatePitchRunRequest,
  ) => Promise<RunPitchAnalysisResult>;
}

export function usePitchRun(): UsePitchRunReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isRateLimited, secondsRemaining, triggerCooldown } = useRateLimitCooldown();

  const runPitchAnalysis = useCallback(
    async (input: CreatePitchRunRequest): Promise<RunPitchAnalysisResult> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetchEdge('pitch-run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });

        const payload = (await response.json()) as CreatePitchRunResponse | CreatePitchRunErrorResponse;

        if (!response.ok) {
          // Handle 429 rate limit before other errors
          if (response.status === 429) {
            const body = payload as unknown as Record<string, unknown>;
            const retryAfter = parseRetryAfter(response, body);
            triggerCooldown(retryAfter);
            throw new Error('Too many requests. Please try again shortly.');
          }

          const edgePayload = payload as unknown as Record<string, unknown>;
          const code = getEdgeErrorCode(edgePayload);
          const redirectTo = getEdgeRedirectTo(edgePayload);
          if (code === 'GDPR_COMPLIANCE_REQUIRED' && redirectTo) {
            const safeRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//')
              ? redirectTo
              : '/compliance/check';
            const nextPath = typeof window !== 'undefined'
              ? `${window.location.pathname}${window.location.search}`
              : '/dashboard';
            const target = `${safeRedirect}?next=${encodeURIComponent(nextPath)}`;
            if (typeof window !== 'undefined') {
              window.location.assign(target);
            }
            throw new Error('GDPR compliance check required');
          }

          const errorMsg =
            ('error' in payload && payload.error)
              ? payload.error
              : ('message' in payload && (payload as Record<string, unknown>).message)
                ? String((payload as Record<string, unknown>).message)
                : `Pitch analysis failed (${response.status}).`;
          throw new Error(errorMsg);
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
          providerUsed: success.provider_used,
          warning: success.warning,
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
    [triggerCooldown],
  );

  return {
    isAnalyzing,
    error,
    isRateLimited,
    secondsRemaining,
    runPitchAnalysis,
  };
}
