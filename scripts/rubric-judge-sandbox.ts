import { promises as fs } from 'fs';
import path from 'path';
import { config as loadDotenv } from 'dotenv';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildJudgeUserPromptWithTelemetry, JUDGE_SYSTEM_PROMPT } from '@/lib/prompts/judge';
import { buildScoringContext } from '@/services/prepAgentService';
import { buildLayeredSystemPrompt } from '@/supabase/functions/_shared/rubric-context';
import type { RubricScore } from '@/types/analysis-v2';
import type { PitchMode } from '@/types/pitch';

type ProviderName = 'anthropic' | 'openrouter';

interface CliOptions {
  mode: PitchMode;
  transcriptText?: string;
  transcriptFile?: string;
  deckFile?: string;
  rubricText?: string;
  rubricFile?: string;
  outPath?: string;
  provider?: ProviderName;
  includePrompts: boolean;
}

interface RunSummary {
  provider_used: string;
  fallback: boolean;
  latency_ms: number;
  overall_score: number;
  spoken_score: number | null;
  deck_score: number | null;
  one_line_verdict: string;
  rubric_breakdown: RubricScore[];
  top_fixes: Array<{
    rank: number;
    category: string;
    impact: string;
    issue: string;
    fix: string;
  }>;
}

interface SandboxReport {
  generated_at: string;
  mode: PitchMode;
  provider: ProviderName;
  inputs: {
    transcript_chars: number;
    deck_chars: number;
    rubric_override_chars: number;
  };
  prompt_map: {
    default_system_prompt: string;
    layered_system_prompt: string | null;
    user_prompt_preview: string;
    user_prompt_chars: number;
    clip_stage: number;
    knowledge_digest_chars: number;
    knowledge_included: boolean;
    injection_points: string[];
  };
  baseline: RunSummary;
  with_override: RunSummary | null;
  diff_vs_baseline: {
    overall_score_delta: number | null;
    spoken_score_delta: number | null;
    deck_score_delta: number | null;
    rubric_delta: Record<string, number>;
    verdict_changed: boolean;
  };
}

function printUsage(): void {
  console.log(
    [
      'Usage: tsx scripts/rubric-judge-sandbox.ts [options]',
      '',
      'Required:',
      '  --transcript-file <path>   Path to transcript text file',
      '  or --transcript <text>     Inline transcript text',
      '',
      'Optional:',
      '  --mode <vc_pitch|elevator>           Default: vc_pitch',
      '  --deck-file <path>                   Optional deck text file',
      '  --rubric-file <path>                 Optional rubric override text file',
      '  --rubric <text>                      Optional inline rubric override text',
      '  --provider <anthropic|openrouter>   Default: anthropic',
      '  --out <path>                         Output JSON report path',
      '  --include-prompts                    Include full prompts in report',
      '  --help                               Show this help',
    ].join('\n'),
  );
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    mode: 'vc_pitch',
    provider: 'anthropic',
    includePrompts: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    if (arg === '--mode' && next) {
      if (next !== 'vc_pitch' && next !== 'elevator') {
        throw new Error('Invalid --mode. Expected vc_pitch or elevator.');
      }
      options.mode = next;
      index += 1;
      continue;
    }
    if (arg === '--transcript' && next) {
      options.transcriptText = next;
      index += 1;
      continue;
    }
    if (arg === '--transcript-file' && next) {
      options.transcriptFile = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--deck-file' && next) {
      options.deckFile = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--rubric' && next) {
      options.rubricText = next;
      index += 1;
      continue;
    }
    if (arg === '--rubric-file' && next) {
      options.rubricFile = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--provider' && next) {
      if (next !== 'anthropic' && next !== 'openrouter') {
        throw new Error('Invalid --provider. Expected anthropic or openrouter.');
      }
      options.provider = next;
      index += 1;
      continue;
    }
    if (arg === '--out' && next) {
      options.outPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--include-prompts') {
      options.includePrompts = true;
      continue;
    }
  }

  return options;
}

function requireProviderKey(provider: ProviderName): void {
  if (provider === 'anthropic') {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      throw new Error('Missing ANTHROPIC_API_KEY for provider=anthropic.');
    }
    return;
  }
  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    throw new Error('Missing OPENROUTER_API_KEY for provider=openrouter.');
  }
}

async function readTextOption(value: string | undefined, filePath: string | undefined): Promise<string> {
  if (filePath) {
    return (await fs.readFile(filePath, 'utf8')).trim();
  }
  return (value ?? '').trim();
}

function toRunSummary(result: any): RunSummary {
  const feedback = result.analysis.outputs.feedback;
  return {
    provider_used: result.analysis.meta.provider_used,
    fallback: Boolean(result.fallback),
    latency_ms: result.analysis.meta.latency_ms ?? 0,
    overall_score: feedback.overall_score,
    spoken_score: typeof feedback.spoken_score === 'number' ? feedback.spoken_score : null,
    deck_score: typeof feedback.deck_score === 'number' ? feedback.deck_score : null,
    one_line_verdict: feedback.one_line_verdict,
    rubric_breakdown: feedback.rubric_breakdown,
    top_fixes: (feedback.top_fixes ?? []).slice(0, 5).map((fix: any, index: number) => ({
      rank: typeof fix.rank === 'number' ? fix.rank : index + 1,
      category: String(fix.category ?? ''),
      impact: String(fix.impact ?? ''),
      issue: String(fix.issue ?? ''),
      fix: String(fix.fix ?? ''),
    })),
  };
}

function rubricToMap(rubric: RubricScore[]): Record<string, number> {
  return rubric.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = item.score;
    return acc;
  }, {});
}

function computeDiff(
  baseline: RunSummary,
  withOverride: RunSummary | null,
): SandboxReport['diff_vs_baseline'] {
  if (!withOverride) {
    return {
      overall_score_delta: null,
      spoken_score_delta: null,
      deck_score_delta: null,
      rubric_delta: {},
      verdict_changed: false,
    };
  }

  const baselineMap = rubricToMap(baseline.rubric_breakdown);
  const overrideMap = rubricToMap(withOverride.rubric_breakdown);
  const categories = Array.from(new Set([...Object.keys(baselineMap), ...Object.keys(overrideMap)]));
  const rubricDelta: Record<string, number> = {};

  for (const category of categories) {
    rubricDelta[category] = (overrideMap[category] ?? 0) - (baselineMap[category] ?? 0);
  }

  return {
    overall_score_delta: withOverride.overall_score - baseline.overall_score,
    spoken_score_delta:
      baseline.spoken_score === null || withOverride.spoken_score === null
        ? null
        : withOverride.spoken_score - baseline.spoken_score,
    deck_score_delta:
      baseline.deck_score === null || withOverride.deck_score === null
        ? null
        : withOverride.deck_score - baseline.deck_score,
    rubric_delta: rubricDelta,
    verdict_changed: withOverride.one_line_verdict !== baseline.one_line_verdict,
  };
}

async function main(): Promise<void> {
  const dotenvPath = process.env.DOTENV_CONFIG_PATH || path.join(process.cwd(), '.env.local');
  loadDotenv({ path: dotenvPath });

  const options = parseArgs(process.argv.slice(2));
  if (options.provider) {
    process.env.LLM_PROVIDER = options.provider;
  }
  requireProviderKey(options.provider ?? 'anthropic');

  const transcript = await readTextOption(options.transcriptText, options.transcriptFile);
  if (!transcript) {
    throw new Error('Transcript is required. Use --transcript-file or --transcript.');
  }
  const deckText = await readTextOption(undefined, options.deckFile);
  const rubricOverride = await readTextOption(options.rubricText, options.rubricFile);

  // Keep sandbox runs focused on judge output and core scoring path.
  process.env.ENABLE_SECTION_FEEDBACK = 'false';
  process.env.ENABLE_REWRITE_DIFF = 'false';

  const [{ analyzePitch }, context] = await Promise.all([
    import('@/services/analysisService'),
    buildScoringContext({
      mode: options.mode,
      transcript,
      deckText: deckText || undefined,
    }),
  ]);

  const promptBuild = buildJudgeUserPromptWithTelemetry({
    mode: options.mode,
    transcript,
    deckText: deckText || undefined,
    context,
  });

  const supabaseStub = {} as SupabaseClient;
  const baselineRaw = await analyzePitch({
    supabase: supabaseStub,
    transcript,
    mode: options.mode,
    deckText: deckText || undefined,
    regenerate: 'feedback',
  });
  const baseline = toRunSummary(baselineRaw);

  let withOverride: RunSummary | null = null;
  if (rubricOverride.length > 0) {
    const overrideRaw = await analyzePitch({
      supabase: supabaseStub,
      transcript,
      mode: options.mode,
      deckText: deckText || undefined,
      systemPromptOverride: rubricOverride,
      regenerate: 'feedback',
    });
    withOverride = toRunSummary(overrideRaw);
  }

  const fullDefaultSystemPrompt = JUDGE_SYSTEM_PROMPT;
  const fullLayeredPrompt =
    rubricOverride.length > 0
      ? buildLayeredSystemPrompt(JUDGE_SYSTEM_PROMPT, rubricOverride)
      : null;

  const report: SandboxReport = {
    generated_at: new Date().toISOString(),
    mode: options.mode,
    provider: (options.provider ?? 'anthropic') as ProviderName,
    inputs: {
      transcript_chars: transcript.length,
      deck_chars: deckText.length,
      rubric_override_chars: rubricOverride.length,
    },
    prompt_map: {
      default_system_prompt: options.includePrompts
        ? fullDefaultSystemPrompt
        : fullDefaultSystemPrompt.slice(0, 800),
      layered_system_prompt:
        fullLayeredPrompt === null
          ? null
          : options.includePrompts
            ? fullLayeredPrompt
            : fullLayeredPrompt.slice(0, 1200),
      user_prompt_preview: options.includePrompts
        ? promptBuild.userPrompt
        : promptBuild.userPrompt.slice(0, 2000),
      user_prompt_chars: promptBuild.userPrompt.length,
      clip_stage: promptBuild.clipStage,
      knowledge_digest_chars: promptBuild.knowledgeChars,
      knowledge_included: promptBuild.knowledgeIncluded,
      injection_points: [
        'Transcript is injected into judge user prompt under "Original transcript".',
        'Deck text is injected into judge user prompt under "Deck text" when provided.',
        'Deterministic scoring context (beats, anti-patterns, delivery metrics, knowledge digest) is serialized under "Compact scoring context".',
        'Custom rubric context (analysis_system_prompt override) is layered into the system prompt before the LLM call.',
      ],
    },
    baseline,
    with_override: withOverride,
    diff_vs_baseline: computeDiff(baseline, withOverride),
  };

  const defaultOutPath = path.join(
    process.cwd(),
    '.cache',
    'rubric-sandbox',
    `report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  );
  const outPath = options.outPath ?? defaultOutPath;
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`[rubric-sandbox] mode=${options.mode} provider=${report.provider}`);
  console.log(`[rubric-sandbox] baseline overall_score=${baseline.overall_score}`);
  if (withOverride) {
    console.log(`[rubric-sandbox] override overall_score=${withOverride.overall_score}`);
    console.log(
      `[rubric-sandbox] delta=${report.diff_vs_baseline.overall_score_delta ?? 0} (override - baseline)`,
    );
  } else {
    console.log('[rubric-sandbox] no override rubric provided; override run skipped');
  }
  console.log(`[rubric-sandbox] report saved to ${outPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[rubric-sandbox] fatal: ${message}`);
  process.exitCode = 1;
});
