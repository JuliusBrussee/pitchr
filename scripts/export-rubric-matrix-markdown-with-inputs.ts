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

async function readOptionalText(filePath: string | null | undefined): Promise<string> {
  if (!filePath) return '';
  try {
    return (await fs.readFile(filePath, 'utf8')).trim();
  } catch {
    return '';
  }
}

function outcomeSection(title: string, outcome: CaseOutcome | null): string[] {
  const lines: string[] = [];
  lines.push(`### ${title}`);
  lines.push('');
  if (!outcome) {
    lines.push('- (missing)');
    lines.push('');
    return lines;
  }

  lines.push(`- score: ${outcome.score}`);
  lines.push(`- verdict: ${outcome.one_line_verdict}`);
  lines.push(`- rewrite_script: ${outcome.rewrite_script}`);
  lines.push('- top_fixes:');
  if (!outcome.top_fixes?.length) {
    lines.push('  - (none)');
  } else {
    for (const fix of outcome.top_fixes.slice(0, 5)) {
      lines.push(`  - #${fix.rank} [${fix.category}/${fix.impact}] ${fix.issue} => ${fix.fix}`);
    }
  }
  lines.push('- do_next_checklist:');
  if (!outcome.do_next_checklist?.length) {
    lines.push('  - (none)');
  } else {
    for (const item of outcome.do_next_checklist.slice(0, 5)) {
      lines.push(`  - ${item}`);
    }
  }
  lines.push('');
  return lines;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const raw = await fs.readFile(options.summaryPath, 'utf8');
  const summary = JSON.parse(raw) as MatrixSummary;

  const lines: string[] = [];
  lines.push('# Rubric Matrix Summary (With Inputs)');
  lines.push('');
  lines.push(`- generated_at: ${summary.generated_at}`);
  lines.push(`- provider: ${summary.provider}`);
  lines.push(`- custom_policy: ${summary.custom_policy}`);
  lines.push(`- total_cases: ${summary.total_cases}`);
  lines.push(`- success_cases: ${summary.success_cases}`);
  lines.push(`- failed_cases: ${summary.failed_cases}`);
  lines.push('');
  lines.push('| Sequence | Pitch Type | Score w/o Custom | Score w/ Custom | Delta | Status |');
  lines.push('|---|---|---:|---:|---:|---|');
  for (const row of summary.cases ?? []) {
    lines.push(
      `| ${row.sequence} | ${row.pitch_type} | ${row.score_without_custom ?? '-'} | ${row.score_with_custom ?? '-'} | ${row.score_delta ?? '-'} | ${row.status} |`,
    );
  }
  lines.push('');

  for (const row of summary.cases ?? []) {
    const transcriptInput = await readOptionalText(row.transcript_file);
    const deckInput = await readOptionalText(row.deck_file);

    lines.push(`## ${row.sequence} ${row.case_name}`);
    lines.push('');
    lines.push(`- pitch_type: ${row.pitch_type}`);
    lines.push(`- status: ${row.status}`);
    lines.push(`- transcript_file: ${row.transcript_file}`);
    lines.push(`- deck_file: ${row.deck_file ?? '(none)'}`);
    lines.push(`- rubric_file: ${row.rubric_file ?? '(none)'}`);
    lines.push(`- score_without_custom: ${row.score_without_custom ?? '-'}`);
    lines.push(`- score_with_custom: ${row.score_with_custom ?? '-'}`);
    lines.push(`- score_delta: ${row.score_delta ?? '-'}`);
    if (row.error) {
      lines.push(`- error: ${row.error}`);
    }
    lines.push('');
    lines.push('### Transcript Input');
    lines.push('');
    lines.push('```text');
    lines.push(transcriptInput || '(missing transcript input text)');
    lines.push('```');
    lines.push('');
    lines.push('### Deck Input');
    lines.push('');
    lines.push('```text');
    lines.push(deckInput || '(none)');
    lines.push('```');
    lines.push('');
    lines.push('### Rubric Prompt');
    lines.push('');
    lines.push('```text');
    lines.push(row.rubric_prompt ?? '(none)');
    lines.push('```');
    lines.push('');
    lines.push('### Feedback Criteria');
    lines.push('');
    if (!row.feedback_criteria?.length) {
      lines.push('- (none)');
    } else {
      for (const item of row.feedback_criteria) {
        lines.push(
          `- ${item.category}: ${item.without_custom ?? '-'} -> ${item.with_custom ?? '-'} (delta ${item.delta ?? '-'})`,
        );
      }
    }
    lines.push('');
    lines.push(...outcomeSection('Outcome Without Custom Rubric', row.outcome_without_custom));
    lines.push(...outcomeSection('Outcome With Custom Rubric', row.outcome_with_custom));
  }

  const outDir = path.dirname(options.summaryPath);
  const timestamp = new Date().toISOString().replace(/[:.]/gu, '-');
  const outPath = options.outPath ?? path.join(outDir, `summary-with-inputs-${timestamp}.md`);
  const latestPath = path.join(outDir, 'summary-with-inputs.md');

  const content = `${lines.join('\n')}\n`;
  await fs.writeFile(outPath, content, 'utf8');
  await fs.writeFile(latestPath, content, 'utf8');

  console.log(`[matrix-md-inputs] source summary: ${options.summaryPath}`);
  console.log(`[matrix-md-inputs] markdown written: ${outPath}`);
  console.log(`[matrix-md-inputs] latest markdown: ${latestPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[matrix-md-inputs] fatal: ${message}`);
  process.exitCode = 1;
});
