import { promises as fs } from 'fs';
import path from 'path';

interface CaseFeedbackCriteria {
  category: string;
  without_custom: number | null;
  with_custom: number | null;
  delta: number | null;
}

interface CaseOutcome {
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
}

interface MatrixCase {
  sequence: string;
  case_name: string;
  pitch_type: string;
  transcript_file: string;
  deck_file: string | null;
  rubric_file: string | null;
  rubric_prompt: string | null;
  feedback_criteria: CaseFeedbackCriteria[];
  score_without_custom: number | null;
  score_with_custom: number | null;
  score_delta: number | null;
  outcome_without_custom: CaseOutcome | null;
  outcome_with_custom: CaseOutcome | null;
  status: string;
  error?: string;
}

interface MatrixSummary {
  generated_at: string;
  provider: string;
  custom_policy: string;
  total_cases: number;
  success_cases: number;
  failed_cases: number;
  cases: MatrixCase[];
}

interface CliOptions {
  summaryPath: string;
  outPath?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    summaryPath: path.resolve('.cache/rubric-sandbox/matrix-anthropic/summary.json'),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--summary' && next) {
      options.summaryPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--out' && next) {
      options.outPath = path.resolve(next);
      index += 1;
      continue;
    }
  }

  return options;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '').replace(/\r?\n/gu, ' ').trim();
  if (text.includes('"') || text.includes(',') || text.includes('\t')) {
    return `"${text.replace(/"/gu, '""')}"`;
  }
  return text;
}

function checklistText(outcome: CaseOutcome | null): string {
  if (!outcome?.do_next_checklist?.length) return '';
  return outcome.do_next_checklist.join(' | ');
}

function topFix(outcome: CaseOutcome | null, rank: number): {
  category: string;
  impact: string;
  issue: string;
  fix: string;
} {
  if (!outcome?.top_fixes?.length) {
    return { category: '', impact: '', issue: '', fix: '' };
  }
  const entry =
    outcome.top_fixes.find((item) => item.rank === rank) ??
    outcome.top_fixes[Math.max(0, rank - 1)] ??
    null;
  if (!entry) return { category: '', impact: '', issue: '', fix: '' };
  return {
    category: entry.category ?? '',
    impact: entry.impact ?? '',
    issue: entry.issue ?? '',
    fix: entry.fix ?? '',
  };
}

function buildCriteriaMap(criteria: CaseFeedbackCriteria[]): Map<string, CaseFeedbackCriteria> {
  const map = new Map<string, CaseFeedbackCriteria>();
  for (const entry of criteria ?? []) {
    map.set(entry.category, entry);
  }
  return map;
}

async function readOptionalText(
  filePath: string | null | undefined,
  cache: Map<string, string>,
): Promise<string> {
  if (!filePath) return '';
  if (cache.has(filePath)) return cache.get(filePath) ?? '';
  const content = await fs
    .readFile(filePath, 'utf8')
    .then((text) => text.trim())
    .catch(() => '');
  cache.set(filePath, content);
  return content;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const raw = await fs.readFile(options.summaryPath, 'utf8');
  const summary = JSON.parse(raw) as MatrixSummary;
  const textCache = new Map<string, string>();

  const categorySet = new Set<string>();
  for (const row of summary.cases ?? []) {
    for (const item of row.feedback_criteria ?? []) {
      categorySet.add(item.category);
    }
  }
  const categories = [...categorySet].sort();

  const header = [
    'generated_at',
    'provider',
    'custom_policy',
    'sequence',
    'case_name',
    'pitch_type',
    'status',
    'transcript_file',
    'transcript_input_text',
    'deck_file',
    'deck_input_text',
    'rubric_file',
    'rubric_prompt',
    'score_without_custom',
    'score_with_custom',
    'score_delta',
    'provider_without_custom',
    'provider_with_custom',
    'fallback_without_custom',
    'fallback_with_custom',
    'latency_ms_without_custom',
    'latency_ms_with_custom',
    'verdict_without_custom',
    'verdict_with_custom',
    'rewrite_without_custom',
    'rewrite_with_custom',
    'checklist_without_custom',
    'checklist_with_custom',
    'top_fix_1_without_category',
    'top_fix_1_without_impact',
    'top_fix_1_without_issue',
    'top_fix_1_without_fix',
    'top_fix_1_with_category',
    'top_fix_1_with_impact',
    'top_fix_1_with_issue',
    'top_fix_1_with_fix',
    'error',
  ];

  for (const category of categories) {
    header.push(`${category}_without_custom`);
    header.push(`${category}_with_custom`);
    header.push(`${category}_delta`);
  }

  const lines: string[] = [header.map(csvEscape).join(',')];

  for (const row of summary.cases ?? []) {
    const transcriptInputText = await readOptionalText(row.transcript_file, textCache);
    const deckInputText = await readOptionalText(row.deck_file, textCache);
    const criteriaMap = buildCriteriaMap(row.feedback_criteria ?? []);
    const topFixWithout = topFix(row.outcome_without_custom, 1);
    const topFixWith = topFix(row.outcome_with_custom, 1);

    const values: unknown[] = [
      summary.generated_at,
      summary.provider,
      summary.custom_policy,
      row.sequence,
      row.case_name,
      row.pitch_type,
      row.status,
      row.transcript_file,
      transcriptInputText,
      row.deck_file ?? '',
      deckInputText,
      row.rubric_file ?? '',
      row.rubric_prompt ?? '',
      row.score_without_custom ?? '',
      row.score_with_custom ?? '',
      row.score_delta ?? '',
      row.outcome_without_custom?.provider_used ?? '',
      row.outcome_with_custom?.provider_used ?? '',
      row.outcome_without_custom?.fallback ?? '',
      row.outcome_with_custom?.fallback ?? '',
      row.outcome_without_custom?.latency_ms ?? '',
      row.outcome_with_custom?.latency_ms ?? '',
      row.outcome_without_custom?.one_line_verdict ?? '',
      row.outcome_with_custom?.one_line_verdict ?? '',
      row.outcome_without_custom?.rewrite_script ?? '',
      row.outcome_with_custom?.rewrite_script ?? '',
      checklistText(row.outcome_without_custom),
      checklistText(row.outcome_with_custom),
      topFixWithout.category,
      topFixWithout.impact,
      topFixWithout.issue,
      topFixWithout.fix,
      topFixWith.category,
      topFixWith.impact,
      topFixWith.issue,
      topFixWith.fix,
      row.error ?? '',
    ];

    for (const category of categories) {
      const item = criteriaMap.get(category);
      values.push(item?.without_custom ?? '');
      values.push(item?.with_custom ?? '');
      values.push(item?.delta ?? '');
    }

    lines.push(values.map(csvEscape).join(','));
  }

  const outDir = path.dirname(options.summaryPath);
  const timestamp = new Date().toISOString().replace(/[:.]/gu, '-');
  const outPath = options.outPath ?? path.join(outDir, `summary-${timestamp}.csv`);
  const latestPath = path.join(outDir, 'summary.csv');

  await fs.writeFile(outPath, `${lines.join('\n')}\n`, 'utf8');
  await fs.writeFile(latestPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(`[matrix-csv] source summary: ${options.summaryPath}`);
  console.log(`[matrix-csv] csv written: ${outPath}`);
  console.log(`[matrix-csv] latest csv: ${latestPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[matrix-csv] fatal: ${message}`);
  process.exitCode = 1;
});
