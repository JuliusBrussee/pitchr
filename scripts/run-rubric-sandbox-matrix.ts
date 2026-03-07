import { promises as fs } from 'fs';
import path from 'path';
import { config as loadDotenv } from 'dotenv';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RubricScore } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

type ProviderName = 'anthropic';
type CustomPolicy = 'case-or-default' | 'case-only';

interface CaseRecord {
  id: string;
  name: string;
  mode: PitchMode;
  transcriptFile: string;
  deckFile?: string | null;
  rubricFile?: string | null;
  checks?: string[];
}

interface CasesFile {
  description?: string;
  defaultProvider?: string;
  cases: CaseRecord[];
}

interface CliOptions {
  provider: ProviderName;
  casesPath: string;
  outDir: string;
  defaultRubricPath: string;
  customPolicy: CustomPolicy;
  limit?: number;
  modeFilter?: PitchMode;
}

interface OutcomeSummary {
  score: number;
  provider_used: string;
  fallback: boolean;
  latency_ms: number;
  one_line_verdict: string;
  rewrite_script: string;
  top_fixes: Array<{
    rank: number;
    category: string;
    impact: string;
    issue: string;
    fix: string;
  }>;
  do_next_checklist: string[];
  rubric_breakdown: RubricScore[];
  error_details?: string;
}

interface CaseResult {
  sequence: string;
  case_name: string;
  pitch_type: PitchMode;
  transcript_file: string;
  deck_file: string | null;
  rubric_file: string | null;
  rubric_prompt: string | null;
  feedback_criteria: Array<{
    category: string;
    without_custom: number | null;
    with_custom: number | null;
    delta: number | null;
  }>;
  score_without_custom: number | null;
  score_with_custom: number | null;
  score_delta: number | null;
  outcome_without_custom: OutcomeSummary | null;
  outcome_with_custom: OutcomeSummary | null;
  status: 'ok' | 'failed';
  error?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    provider: 'anthropic',
    casesPath: path.resolve('tests/fixtures/rubric-sandbox/cases.json'),
    outDir: path.resolve('.cache/rubric-sandbox/matrix-anthropic'),
    defaultRubricPath: path.resolve('tests/fixtures/rubric-sandbox/rubrics/strict_risk.txt'),
    customPolicy: 'case-or-default',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--provider' && next) {
      if (next !== 'anthropic') {
        throw new Error('This script supports anthropic only. Use --provider anthropic.');
      }
      options.provider = 'anthropic';
      index += 1;
      continue;
    }
    if (arg === '--cases' && next) {
      options.casesPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--out-dir' && next) {
      options.outDir = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--default-rubric' && next) {
      options.defaultRubricPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--custom-policy' && next) {
      if (next !== 'case-or-default' && next !== 'case-only') {
        throw new Error('Invalid --custom-policy. Use case-or-default or case-only.');
      }
      options.customPolicy = next;
      index += 1;
      continue;
    }
    if (arg === '--limit' && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = parsed;
      }
      index += 1;
      continue;
    }
    if (arg === '--mode' && next) {
      if (next !== 'vc_pitch' && next !== 'elevator') {
        throw new Error('Invalid --mode. Use vc_pitch or elevator.');
      }
      options.modeFilter = next;
      index += 1;
      continue;
    }
  }

  return options;
}

function requireAnthropicKey(): void {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error('Missing ANTHROPIC_API_KEY in environment.');
  }
}

function normalize(text: string): string {
  return text.replace(/\r?\n/gu, '\n').trim();
}

async function readText(filePath: string): Promise<string> {
  return normalize(await fs.readFile(filePath, 'utf8'));
}

function toOutcomeSummary(result: any): OutcomeSummary {
  const feedback = result.analysis.outputs.feedback;
  const topFixes = (feedback.top_fixes ?? []).slice(0, 5).map((item: any, index: number) => ({
    rank: typeof item.rank === 'number' ? item.rank : index + 1,
    category: String(item.category ?? ''),
    impact: String(item.impact ?? ''),
    issue: String(item.issue ?? ''),
    fix: String(item.fix ?? ''),
  }));

  return {
    score: Number(feedback.overall_score ?? 0),
    provider_used: String(result.analysis.meta?.provider_used ?? 'unknown'),
    fallback: Boolean(result.fallback),
    latency_ms: Number(result.analysis.meta?.latency_ms ?? 0),
    one_line_verdict: String(feedback.one_line_verdict ?? ''),
    rewrite_script: String(feedback.rewrite_script ?? ''),
    top_fixes: topFixes,
    do_next_checklist: Array.isArray(feedback.do_next_checklist)
      ? feedback.do_next_checklist.slice(0, 5).map((item: unknown) => String(item))
      : [],
    rubric_breakdown: Array.isArray(feedback.rubric_breakdown) ? feedback.rubric_breakdown : [],
    error_details: result.analysis.meta?.error_details?.message
      ? String(result.analysis.meta.error_details.message)
      : undefined,
  };
}

function rubricMap(items: RubricScore[] | undefined): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items ?? []) {
    map.set(item.category, item.score);
  }
  return map;
}

function buildFeedbackCriteria(
  baseline: OutcomeSummary | null,
  custom: OutcomeSummary | null,
): CaseResult['feedback_criteria'] {
  const baseMap = rubricMap(baseline?.rubric_breakdown);
  const customMap = rubricMap(custom?.rubric_breakdown);
  const categories = [...new Set([...baseMap.keys(), ...customMap.keys()])].sort();

  return categories.map((category) => {
    const withoutCustom = baseMap.has(category) ? baseMap.get(category) ?? null : null;
    const withCustom = customMap.has(category) ? customMap.get(category) ?? null : null;
    const delta =
      withoutCustom === null || withCustom === null ? null : Number((withCustom - withoutCustom).toFixed(2));
    return {
      category,
      without_custom: withoutCustom,
      with_custom: withCustom,
      delta,
    };
  });
}

function toMarkdown(results: CaseResult[], settings: { provider: ProviderName; customPolicy: CustomPolicy }): string {
  const lines: string[] = [];
  lines.push('# Rubric Matrix Report');
  lines.push('');
  lines.push(`- provider: ${settings.provider}`);
  lines.push(`- custom_policy: ${settings.customPolicy}`);
  lines.push(`- generated_at: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('| Sequence | Pitch Type | Score w/o Custom | Score w/ Custom | Delta | Status |');
  lines.push('|---|---|---:|---:|---:|---|');
  for (const row of results) {
    lines.push(
      `| ${row.sequence} | ${row.pitch_type} | ${row.score_without_custom ?? '-'} | ${row.score_with_custom ?? '-'} | ${row.score_delta ?? '-'} | ${row.status} |`,
    );
  }
  lines.push('');

  for (const row of results) {
    lines.push(`## ${row.sequence} ${row.case_name}`);
    lines.push('');
    lines.push(`- pitch_type: ${row.pitch_type}`);
    lines.push(`- transcript: ${row.transcript_file}`);
    lines.push(`- deck: ${row.deck_file ?? '(none)'}`);
    lines.push(`- rubric_file: ${row.rubric_file ?? '(none)'}`);
    lines.push(`- score_without_custom: ${row.score_without_custom ?? '-'}`);
    lines.push(`- score_with_custom: ${row.score_with_custom ?? '-'}`);
    lines.push(`- score_delta: ${row.score_delta ?? '-'}`);
    if (row.error) {
      lines.push(`- error: ${row.error}`);
    }
    lines.push('');
    lines.push('### Rubric Prompt');
    lines.push('');
    lines.push('```text');
    lines.push(row.rubric_prompt ?? '(none)');
    lines.push('```');
    lines.push('');
    lines.push('### Feedback Criteria');
    lines.push('');
    if (row.feedback_criteria.length === 0) {
      lines.push('- (none)');
    } else {
      for (const criteria of row.feedback_criteria) {
        lines.push(
          `- ${criteria.category}: ${criteria.without_custom ?? '-'} -> ${criteria.with_custom ?? '-'} (delta ${criteria.delta ?? '-'})`,
        );
      }
    }
    lines.push('');
    lines.push('### Outcome Without Custom Rubric');
    lines.push('');
    if (!row.outcome_without_custom) {
      lines.push('- (missing)');
    } else {
      lines.push(`- verdict: ${row.outcome_without_custom.one_line_verdict}`);
      lines.push(`- rewrite_script: ${row.outcome_without_custom.rewrite_script}`);
      lines.push('- top_fixes:');
      for (const fix of row.outcome_without_custom.top_fixes.slice(0, 3)) {
        lines.push(`  - [${fix.category}/${fix.impact}] ${fix.issue} => ${fix.fix}`);
      }
      lines.push('- do_next_checklist:');
      for (const item of row.outcome_without_custom.do_next_checklist) {
        lines.push(`  - ${item}`);
      }
    }
    lines.push('');
    lines.push('### Outcome With Custom Rubric');
    lines.push('');
    if (!row.outcome_with_custom) {
      lines.push('- (missing)');
    } else {
      lines.push(`- verdict: ${row.outcome_with_custom.one_line_verdict}`);
      lines.push(`- rewrite_script: ${row.outcome_with_custom.rewrite_script}`);
      lines.push('- top_fixes:');
      for (const fix of row.outcome_with_custom.top_fixes.slice(0, 3)) {
        lines.push(`  - [${fix.category}/${fix.impact}] ${fix.issue} => ${fix.fix}`);
      }
      lines.push('- do_next_checklist:');
      for (const item of row.outcome_with_custom.do_next_checklist) {
        lines.push(`  - ${item}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function main(): Promise<void> {
  const dotenvPath = process.env.DOTENV_CONFIG_PATH || path.resolve('.env.local');
  loadDotenv({ path: dotenvPath });

  const options = parseArgs(process.argv.slice(2));
  process.env.LLM_PROVIDER = 'anthropic';
  process.env.ENABLE_SECTION_FEEDBACK = 'false';
  process.env.ENABLE_REWRITE_DIFF = 'false';
  requireAnthropicKey();

  const [{ analyzePitch }, rawCases] = await Promise.all([
    import('@/services/analysisService'),
    fs.readFile(options.casesPath, 'utf8'),
  ]);

  const casesDoc = JSON.parse(rawCases) as CasesFile;
  let cases = casesDoc.cases ?? [];
  if (options.modeFilter) {
    cases = cases.filter((entry) => entry.mode === options.modeFilter);
  }
  if (options.limit) {
    cases = cases.slice(0, options.limit);
  }

  await fs.mkdir(options.outDir, { recursive: true });

  const defaultRubricExists = await fs
    .access(options.defaultRubricPath)
    .then(() => true)
    .catch(() => false);
  const defaultRubricText =
    options.customPolicy === 'case-or-default' && defaultRubricExists
      ? await readText(options.defaultRubricPath)
      : '';

  const results: CaseResult[] = [];
  const supabaseStub = {} as SupabaseClient;

  for (const testCase of cases) {
    const caseId = testCase.id;
    const transcriptPath = path.resolve(testCase.transcriptFile);
    const deckPath = testCase.deckFile ? path.resolve(testCase.deckFile) : null;
    const caseRubricPath = testCase.rubricFile ? path.resolve(testCase.rubricFile) : null;

    console.log(`[matrix] running ${caseId} (${testCase.mode}) with anthropic`);

    try {
      const transcript = await readText(transcriptPath);
      const deckText = deckPath ? await readText(deckPath) : '';
      const caseRubricText = caseRubricPath ? await readText(caseRubricPath) : '';
      const rubricText =
        caseRubricText || (options.customPolicy === 'case-or-default' ? defaultRubricText : '');
      const rubricSource = caseRubricText
        ? caseRubricPath
        : rubricText
          ? options.defaultRubricPath
          : null;

      const baselineRaw = await analyzePitch({
        supabase: supabaseStub,
        transcript,
        mode: testCase.mode,
        deckText: deckText || undefined,
        regenerate: 'feedback',
      });
      const baseline = toOutcomeSummary(baselineRaw);

      let custom: OutcomeSummary | null = null;
      if (rubricText) {
        const customRaw = await analyzePitch({
          supabase: supabaseStub,
          transcript,
          mode: testCase.mode,
          deckText: deckText || undefined,
          systemPromptOverride: rubricText,
          regenerate: 'feedback',
        });
        custom = toOutcomeSummary(customRaw);
      }

      const criteria = buildFeedbackCriteria(baseline, custom);
      const scoreWithout = baseline.score;
      const scoreWith = custom?.score ?? null;
      const scoreDelta = scoreWith === null ? null : Number((scoreWith - scoreWithout).toFixed(2));

      results.push({
        sequence: caseId,
        case_name: testCase.name,
        pitch_type: testCase.mode,
        transcript_file: transcriptPath,
        deck_file: deckPath,
        rubric_file: rubricSource,
        rubric_prompt: rubricText || null,
        feedback_criteria: criteria,
        score_without_custom: scoreWithout,
        score_with_custom: scoreWith,
        score_delta: scoreDelta,
        outcome_without_custom: baseline,
        outcome_with_custom: custom,
        status: 'ok',
      });

      console.log(
        `[matrix] ${caseId} done baseline=${scoreWithout} custom=${scoreWith ?? '-'} delta=${scoreDelta ?? '-'}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        sequence: caseId,
        case_name: testCase.name,
        pitch_type: testCase.mode,
        transcript_file: transcriptPath,
        deck_file: deckPath,
        rubric_file: caseRubricPath,
        rubric_prompt: null,
        feedback_criteria: [],
        score_without_custom: null,
        score_with_custom: null,
        score_delta: null,
        outcome_without_custom: null,
        outcome_with_custom: null,
        status: 'failed',
        error: message,
      });
      console.error(`[matrix] ${caseId} failed: ${message}`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/gu, '-');
  const jsonPath = path.join(options.outDir, `summary-${timestamp}.json`);
  const mdPath = path.join(options.outDir, `summary-${timestamp}.md`);
  const latestJsonPath = path.join(options.outDir, 'summary.json');
  const latestMdPath = path.join(options.outDir, 'summary.md');

  const payload = {
    generated_at: new Date().toISOString(),
    provider: options.provider,
    custom_policy: options.customPolicy,
    mode_filter: options.modeFilter ?? null,
    total_cases: results.length,
    success_cases: results.filter((item) => item.status === 'ok').length,
    failed_cases: results.filter((item) => item.status === 'failed').length,
    cases: results,
  };

  await fs.writeFile(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
  await fs.writeFile(latestJsonPath, JSON.stringify(payload, null, 2), 'utf8');

  const markdown = toMarkdown(results, {
    provider: options.provider,
    customPolicy: options.customPolicy,
  });
  await fs.writeFile(mdPath, markdown, 'utf8');
  await fs.writeFile(latestMdPath, markdown, 'utf8');

  console.log(`[matrix] json written: ${jsonPath}`);
  console.log(`[matrix] markdown written: ${mdPath}`);
  console.log(`[matrix] latest json: ${latestJsonPath}`);
  console.log(`[matrix] latest markdown: ${latestMdPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[matrix] fatal: ${message}`);
  process.exitCode = 1;
});
