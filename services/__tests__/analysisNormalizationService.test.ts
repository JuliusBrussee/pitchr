import { describe, expect, it } from 'vitest';
import { normalizeStoredAnalysis } from '@/services/analysisNormalizationService';

describe('normalizeStoredAnalysis', () => {
  it('returns v2 analysis unchanged when valid', () => {
    const v2 = {
      analysisVersion: 'v2' as const,
      coverage: 'spoken_only' as const,
      outputs: {
        feedback: { overall_score: 65, one_line_verdict: 'Test' } as any,
        qa_1min: {} as any,
      },
      meta: {
        provider_used: 'anthropic' as const,
        fallback_used: false,
        cache_hit: false,
        llm_calls_used: 1,
        latency_ms: 1000,
        attempt_count: 1,
      },
      analysis: {} as any,
      fallback: false,
    };
    const result = normalizeStoredAnalysis(v2, false);
    expect(result.analysisVersion).toBe('v2');
    expect(result.coverage).toBe('spoken_only');
  });

  it('converts legacy v1 analysis to v2 format', () => {
    const v1 = {
      overall_score: 60,
      one_line_verdict: 'Getting There',
      rubric_breakdown: [
        { category: 'structure', score: 12, max_score: 20, rationale: 'OK' },
      ],
      top_fixes: [
        { rank: 1, category: 'evidence', issue: 'No proof', fix: 'Add metrics', impact: 'high' },
      ],
      rewrite_script: 'Better version.',
      delivery_metrics: {
        word_count: 100,
        wpm: 140,
      },
    };
    const result = normalizeStoredAnalysis(v1, false);
    expect(result.analysisVersion).toBe('v2');
    expect(result.coverage).toBe('spoken_only');
    expect(result.outputs.feedback.overall_score).toBe(60);
    expect(result.outputs.feedback.one_line_verdict).toBe('Getting There');
    expect(result.outputs.qa_1min).toBeDefined();
  });

  it('sets fallback flag correctly for legacy analysis', () => {
    const v1 = {
      overall_score: 50,
      one_line_verdict: 'Fallback',
      rubric_breakdown: [],
      top_fixes: [],
      rewrite_script: '',
      delivery_metrics: {},
    };
    const result = normalizeStoredAnalysis(v1, true);
    expect(result.fallback).toBe(true);
    expect(result.meta.fallback_used).toBe(true);
  });

  it('returns sample result for completely unknown data', () => {
    const result = normalizeStoredAnalysis({ random: 'garbage' }, false);
    expect(result.analysisVersion).toBe('v2');
    expect(result.outputs).toBeDefined();
    expect(result.outputs.feedback).toBeDefined();
  });

  it('returns sample result for null input', () => {
    const result = normalizeStoredAnalysis(null, true);
    expect(result.analysisVersion).toBe('v2');
    expect(result.fallback).toBe(true);
  });

  it('normalizes economics data in v2 analysis', () => {
    const v2 = {
      analysisVersion: 'v2' as const,
      coverage: 'spoken_only' as const,
      outputs: {
        feedback: {} as any,
        qa_1min: {} as any,
      },
      meta: {
        provider_used: 'anthropic' as const,
        fallback_used: false,
        cache_hit: false,
        llm_calls_used: 1,
        latency_ms: 1000,
        attempt_count: 1,
        economics: {
          model_cost_usd: 0.005,
          estimated_cost_usd: 0.01,
          estimated_input_tokens: 5000,
          estimated_output_tokens: 2000,
          coach_hourly_rate_usd: 200,
          manual_baseline_minutes: 30,
          agent_runtime_minutes: 0.5,
          time_saved_minutes: 29.5,
          money_saved_vs_coach_usd: 5.0,
          estimated_value_usd: 5.0,
        },
      },
      analysis: {} as any,
      fallback: false,
    };
    const result = normalizeStoredAnalysis(v2, false);
    expect(result.meta.economics).toBeDefined();
    expect(result.meta.economics!.model_cost_usd).toBe(0.005);
    expect(result.meta.economics!.roi_multiple).toBeGreaterThan(0);
  });
});
