import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('knowledge/patterns.v1.json', () => {
  it('contains benchmark profiles, judge guidance, and source weights with bounded snippets', () => {
    const raw = readFileSync('knowledge/patterns.v1.json', 'utf8');
    const parsed = JSON.parse(raw) as {
      benchmark_profiles?: {
        yc_top_decile?: string[];
        yc_median?: string[];
        common_failures?: string[];
      };
      judge_guidance?: {
        do_rules?: string[];
        dont_rules?: string[];
        category_guidance?: Record<string, string[]>;
        anti_pattern_playbook?: Record<string, string>;
        digest_version?: string;
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

    const guidance = parsed.judge_guidance;
    expect(guidance?.do_rules?.length).toBeGreaterThan(0);
    expect(guidance?.dont_rules?.length).toBeGreaterThan(0);
    expect(guidance?.category_guidance?.structure?.length).toBeGreaterThanOrEqual(3);
    expect(guidance?.category_guidance?.clarity?.length).toBeGreaterThanOrEqual(3);
    expect(guidance?.category_guidance?.evidence?.length).toBeGreaterThanOrEqual(3);
    expect(guidance?.category_guidance?.market?.length).toBeGreaterThanOrEqual(3);
    expect(guidance?.category_guidance?.delivery?.length).toBeGreaterThanOrEqual(3);
    expect(guidance?.anti_pattern_playbook?.no_proof).toBeDefined();
    expect(guidance?.digest_version).toBeTruthy();

    const hasMojibake = /â€|Ã|Â|�/u.test(raw);
    expect(hasMojibake).toBe(false);
  });
});
