import { promises as fs } from 'fs';
import path from 'path';

interface ElevatorDatasetRow {
  company?: string;
  transcript_clean?: string;
  transcript_raw?: string;
  [key: string]: unknown;
}

interface ProjectRecord {
  id: string;
  name: string;
  type: 'two_min_pitch' | 'elevator_pitch';
  isArchived: boolean;
}

interface RunResponse {
  runId?: string;
  status?: string;
  error?: string;
}

interface RunDetailResponse {
  run?: {
    id: string;
    status: string;
    overallScore?: number;
    fallback?: boolean;
    meta?: {
      provider_used?: string;
      fallback_used?: boolean;
    };
    error?: string;
  };
  error?: string;
}

interface BatchResultRow {
  input_id: string;
  runId: string | null;
  status: 'complete' | 'failed' | 'skipped' | 'submit_failed' | 'poll_timeout';
  overallScore: number | null;
  fallback: boolean | null;
  provider_used: string | null;
  error: string | null;
}

interface CliOptions {
  datasetPath: string;
  outputPath: string;
  projectId?: string;
  maxRows?: number;
}

const DEFAULT_DATASET_PATH = path.join(
  process.cwd(),
  'knowledge',
  'curated',
  'elevator-pitch-dataset',
  'elevator_pitch_dataset.json',
);

const DEFAULT_OUTPUT_PATH = path.join(
  process.cwd(),
  'knowledge',
  'curated',
  'elevator-pitch-dataset',
  `batch_results_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
);

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_NETWORK_RETRIES = 4;
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 80;

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    datasetPath: DEFAULT_DATASET_PATH,
    outputPath: DEFAULT_OUTPUT_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--dataset' && next) {
      options.datasetPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--out' && next) {
      options.outputPath = path.resolve(next);
      index += 1;
      continue;
    }
    if (arg === '--project-id' && next) {
      options.projectId = next;
      index += 1;
      continue;
    }
    if (arg === '--max' && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.maxRows = parsed;
      }
      index += 1;
    }
  }

  return options;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeTranscript(row: ElevatorDatasetRow): string {
  const raw = typeof row.transcript_clean === 'string' && row.transcript_clean.trim().length > 0
    ? row.transcript_clean
    : typeof row.transcript_raw === 'string'
      ? row.transcript_raw
      : '';

  return raw.replace(/\s+/g, ' ').trim();
}

function toInputId(row: ElevatorDatasetRow, index: number): string {
  const base = typeof row.company === 'string' && row.company.trim().length > 0
    ? row.company.trim()
    : `row_${index + 1}`;
  return `${index + 1}:${base}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetries(
  execute: () => Promise<Response>,
  label: string,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_NETWORK_RETRIES; attempt += 1) {
    try {
      const response = await execute();
      if (!RETRYABLE_STATUS.has(response.status)) {
        return response;
      }
      if (attempt === MAX_NETWORK_RETRIES) {
        return response;
      }
      const backoff = 2 ** (attempt - 1) * 400;
      console.warn(`[batch] ${label} retry ${attempt} after status ${response.status}`);
      await sleep(backoff);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === MAX_NETWORK_RETRIES) break;
      const backoff = 2 ** (attempt - 1) * 400;
      console.warn(`[batch] ${label} network retry ${attempt}: ${lastError.message}`);
      await sleep(backoff);
    }
  }

  if (lastError) {
    throw lastError;
  }
  throw new Error(`[batch] ${label} failed after retries`);
}

async function resolveAccessToken(supabaseUrl: string, anonKey: string): Promise<string> {
  const directToken = process.env.PITCHR_BATCH_JWT?.trim();
  if (directToken) return directToken;

  const email = process.env.PITCHR_BATCH_EMAIL?.trim();
  const password = process.env.PITCHR_BATCH_PASSWORD?.trim();
  if (!email || !password) {
    throw new Error(
      'Set PITCHR_BATCH_JWT or both PITCHR_BATCH_EMAIL and PITCHR_BATCH_PASSWORD.',
    );
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || 'Failed to authenticate batch user.');
  }
  return payload.access_token;
}

function edgeUrl(supabaseUrl: string, functionName: string, params?: Record<string, string>): string {
  const url = new URL(`${supabaseUrl}/functions/v1/${functionName}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function edgeRequest(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
  functionName: string,
  init: RequestInit & { params?: Record<string, string> },
  retryLabel: string,
): Promise<Response> {
  const url = edgeUrl(supabaseUrl, functionName, init.params);
  return fetchWithRetries(
    () => fetch(url, {
      ...init,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    }),
    retryLabel,
  );
}

async function resolveElevatorProjectId(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
): Promise<string> {
  const response = await edgeRequest(
    supabaseUrl,
    anonKey,
    accessToken,
    'projects',
    { method: 'GET' },
    'resolve project',
  );
  const payload = (await response.json()) as { projects?: ProjectRecord[]; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Failed to resolve projects.');
  }

  const projects = Array.isArray(payload.projects) ? payload.projects : [];
  const elevator = projects.find((project: { isArchived: boolean }) => !project.isArchived);
  if (!elevator) {
    throw new Error('No active project found.');
  }
  return (elevator as { id: string }).id;
}

async function pollRunDetail(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
  runId: string,
): Promise<RunDetailResponse['run'] | null> {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await edgeRequest(
      supabaseUrl,
      anonKey,
      accessToken,
      'pitch-run-detail',
      { method: 'GET', params: { runId } },
      `poll run ${runId}`,
    );

    const payload = (await response.json()) as RunDetailResponse;
    if (!response.ok) {
      if (RETRYABLE_STATUS.has(response.status)) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      throw new Error(payload.error || `Failed to poll run detail (${response.status}).`);
    }

    const run = payload.run;
    if (!run) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }
    if (run.status === 'complete' || run.status === 'failed') {
      return run;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return null;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const accessToken = await resolveAccessToken(supabaseUrl, anonKey);

  const rawDataset = await fs.readFile(options.datasetPath, 'utf8');
  const parsed = JSON.parse(rawDataset) as ElevatorDatasetRow[];
  if (!Array.isArray(parsed)) {
    throw new Error('Dataset must be a JSON array.');
  }

  const rows = options.maxRows ? parsed.slice(0, options.maxRows) : parsed;
  const projectId = options.projectId || await resolveElevatorProjectId(supabaseUrl, anonKey, accessToken);
  const results: BatchResultRow[] = [];

  console.log(`[batch] rows=${rows.length} projectId=${projectId}`);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const inputId = toInputId(row, index);
    const transcript = normalizeTranscript(row);

    if (!transcript) {
      results.push({
        input_id: inputId,
        runId: null,
        status: 'skipped',
        overallScore: null,
        fallback: null,
        provider_used: null,
        error: 'empty transcript after normalization',
      });
      continue;
    }

    try {
      const submitResponse = await edgeRequest(
        supabaseUrl,
        anonKey,
        accessToken,
        'pitch-run',
        {
          method: 'POST',
          body: JSON.stringify({
            projectId,
            mode: 'elevator',
            inputType: 'text',
            transcript,
          }),
        },
        `submit ${inputId}`,
      );
      const submitPayload = (await submitResponse.json()) as RunResponse;

      if (!submitResponse.ok) {
        if (submitResponse.status === 400) {
          results.push({
            input_id: inputId,
            runId: null,
            status: 'submit_failed',
            overallScore: null,
            fallback: null,
            provider_used: null,
            error: submitPayload.error || 'validation error',
          });
          continue;
        }
        throw new Error(submitPayload.error || `submit failed (${submitResponse.status})`);
      }

      const runId = submitPayload.runId ?? null;
      if (!runId) {
        results.push({
          input_id: inputId,
          runId: null,
          status: 'submit_failed',
          overallScore: null,
          fallback: null,
          provider_used: null,
          error: 'missing runId in submit response',
        });
        continue;
      }

      const run = await pollRunDetail(supabaseUrl, anonKey, accessToken, runId);
      if (!run) {
        results.push({
          input_id: inputId,
          runId,
          status: 'poll_timeout',
          overallScore: null,
          fallback: null,
          provider_used: null,
          error: 'run did not reach terminal status before timeout',
        });
        continue;
      }

      results.push({
        input_id: inputId,
        runId,
        status: run.status === 'complete' ? 'complete' : 'failed',
        overallScore: typeof run.overallScore === 'number' ? run.overallScore : null,
        fallback: run.fallback ?? run.meta?.fallback_used ?? null,
        provider_used: run.meta?.provider_used ?? null,
        error: run.error ?? null,
      });

      const summary = results[results.length - 1];
      console.log(`[batch] ${summary.input_id} -> ${summary.status}${summary.overallScore !== null ? ` score=${summary.overallScore}` : ''}`);
      await sleep(300);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        input_id: inputId,
        runId: null,
        status: 'submit_failed',
        overallScore: null,
        fallback: null,
        provider_used: null,
        error: message,
      });
      console.error(`[batch] ${inputId} failed: ${message}`);
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    datasetPath: options.datasetPath,
    projectId,
    totalRows: rows.length,
    complete: results.filter((row) => row.status === 'complete').length,
    failed: results.filter((row) => row.status === 'failed').length,
    skipped: results.filter((row) => row.status === 'skipped').length,
    submitFailed: results.filter((row) => row.status === 'submit_failed').length,
    pollTimeout: results.filter((row) => row.status === 'poll_timeout').length,
    results,
  };

  await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
  await fs.writeFile(options.outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`[batch] results written: ${options.outputPath}`);
}

main().catch((error) => {
  console.error('[batch] fatal:', error);
  process.exitCode = 1;
});
