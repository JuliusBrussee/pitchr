import { execFile } from 'child_process';
import { promisify } from 'util';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  listQueuedResourceGaps,
  markResourceGapDone,
  markResourceGapFailed,
  markResourceGapProcessing,
} from '@/services/qna/resourceGapService';

const execFileAsync = promisify(execFile);

let inFlightRefresh: Promise<void> | null = null;

interface CommandInvocation {
  command: string;
  args: string[];
}

function getScriptCommandCandidates(scriptName: string): CommandInvocation[] {
  if (process.platform === 'win32') {
    return [
      { command: 'yarn.cmd', args: [scriptName] },
      { command: 'yarn', args: [scriptName] },
      { command: 'corepack.cmd', args: ['yarn', scriptName] },
      { command: 'corepack', args: ['yarn', scriptName] },
    ];
  }

  return [
    { command: 'yarn', args: [scriptName] },
    { command: 'corepack', args: ['yarn', scriptName] },
  ];
}

function isCommandNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as { code?: unknown };
  return value.code === 'ENOENT';
}

function getExecErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Unknown command execution error.';
}

async function runYarnScript(scriptName: string): Promise<void> {
  const candidates = getScriptCommandCandidates(scriptName);
  let lastCommandNotFound: unknown;

  for (const candidate of candidates) {
    try {
      await execFileAsync(candidate.command, candidate.args, {
        cwd: process.cwd(),
        windowsHide: true,
      });
      return;
    } catch (error) {
      if (isCommandNotFoundError(error)) {
        lastCommandNotFound = error;
        continue;
      }

      const message = getExecErrorMessage(error);
      throw new Error(
        `Failed to run "${candidate.command} ${candidate.args.join(' ')}": ${message}`,
      );
    }
  }

  const fallbackMessage = lastCommandNotFound
    ? `Last error: ${getExecErrorMessage(lastCommandNotFound)}`
    : 'No runner candidates were available.';

  throw new Error(
    `Unable to execute "${scriptName}" because neither yarn nor corepack were found in PATH. ${fallbackMessage}`,
  );
}

async function runKnowledgeRefreshScripts(): Promise<void> {
  await runYarnScript('knowledge:snapshot');
  await runYarnScript('knowledge:build');
}

export function refreshKnowledgeResourcesInBackground(): void {
  if (inFlightRefresh) return;
  inFlightRefresh = runKnowledgeRefreshScripts()
    .catch((error) => {
      const message = getExecErrorMessage(error);
      console.error(`[qna-resource-refresh] Background refresh failed: ${message}`);
    })
    .finally(() => {
      inFlightRefresh = null;
    });
}

export async function processQueuedResourceRefresh(limit = 5): Promise<{
  processed: number;
  queued: number;
  failed: number;
}> {
  const supabase = createAdminClient();
  const queued = await listQueuedResourceGaps(supabase, limit);
  if (queued.length === 0) {
    return {
      processed: 0,
      queued: 0,
      failed: 0,
    };
  }

  for (const gap of queued) {
    await markResourceGapProcessing(supabase, gap.id);
  }

  try {
    await runKnowledgeRefreshScripts();
    for (const gap of queued) {
      await markResourceGapDone(supabase, gap.id);
    }
    return {
      processed: queued.length,
      queued: 0,
      failed: 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Knowledge refresh failed.';
    for (const gap of queued) {
      await markResourceGapFailed(supabase, gap.id, message);
    }
    return {
      processed: 0,
      queued: queued.length,
      failed: queued.length,
    };
  }
}
