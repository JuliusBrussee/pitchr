import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('knowledge/patterns.v1.json', () => {
  it('contains benchmark profiles and source weights with bounded snippets', () => {
    const raw = readFileSync('knowledge/patterns.v1.json', 'utf8');
    const parsed = JSON.parse(raw) as {
      benchmark_profiles?: {
        yc_top_decile?: string[];
        yc_median?: string[];
        common_failures?: string[];
      };
      source_weights?: Record<string, number>;
      positive_patterns?: Array<{ text?: string }>;
    };

    expect(parsed.benchmark_profiles?.yc_top_decile?.length).toBeGreaterThan(0);
    expect(parsed.benchmark_profiles?.common_failures?.length).toBeGreaterThan(0);
    expect(parsed.source_weights?.['local-corpus']).toBe(0.4);

    const longestPositive = Math.max(
      ...(parsed.positive_patterns ?? []).map((pattern) => (pattern.text ?? '').length),
      0,
    );
    expect(longestPositive).toBeLessThanOrEqual(500);
  });
});
