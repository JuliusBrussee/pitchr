import type { MiroProvider } from "@/services/miro/miroProvider";
import { MiroRestProvider } from "@/services/miro/providers/miroRestProvider";
import { MiroStubProvider } from "@/services/miro/providers/miroStubProvider";
import type {
  MiroFixBoardRequest,
  MiroFixBoardResponse,
  MiroSyncSnapshot,
  MiroTopFixInput,
} from "@/services/miro/miroTypes";

function toMarkdown(input: {
  runId: string;
  mode: string;
  oneLineVerdict: string;
  topFixes: MiroTopFixInput[];
  rewriteScript: string;
}) {
  const lines = [
    `# Pitchr Fix Board Export`,
    "",
    `Run: ${input.runId}`,
    `Mode: ${input.mode}`,
    "",
    `## Verdict`,
    input.oneLineVerdict,
    "",
    "## Top Fixes",
    ...input.topFixes.flatMap((fix) => [
      `### #${fix.rank} ${fix.category} (${fix.impact})`,
      `Issue: ${fix.issue}`,
      `Action: ${fix.fix}`,
      "",
    ]),
    "## Tightened Rewrite",
    input.rewriteScript,
  ];
  return lines.join("\n");
}

export class MiroService {
  private readonly liveProvider: MiroProvider | null;
  private readonly stubProvider: MiroProvider;

  constructor(opts?: { provider?: MiroProvider }) {
    this.stubProvider = new MiroStubProvider();
    if (opts?.provider) {
      this.liveProvider = opts.provider;
      return;
    }

    const enabled = process.env.MIRO_ENABLED !== "false";
    const mode = (process.env.MIRO_PROVIDER || "rest").toLowerCase();
    const token = process.env.MIRO_ACCESS_TOKEN;
    const teamId = process.env.MIRO_TEAM_ID;

    if (!enabled || mode === "stub" || !token) {
      this.liveProvider = null;
      return;
    }

    this.liveProvider = new MiroRestProvider({ token, teamId });
  }

  async createFixBoard(input: MiroFixBoardRequest): Promise<MiroFixBoardResponse> {
    const provider = this.liveProvider || this.stubProvider;
    try {
      return await provider.createFixBoard(input);
    } catch (error) {
      const fallback = await this.stubProvider.createFixBoard(input);
      return {
        ...fallback,
        fallback: true,
        message: `Miro create failed; fallback activated. ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async syncFixBoard(input: { runId: string; boardId: string }): Promise<MiroSyncSnapshot> {
    if (input.boardId.startsWith("stub-board-")) {
      return this.stubProvider.syncFixBoard(input);
    }

    const provider = this.liveProvider || this.stubProvider;
    try {
      return await provider.syncFixBoard(input);
    } catch (error) {
      const fallback = await this.stubProvider.syncFixBoard(input);
      return {
        ...fallback,
        fallback: true,
        message: `Miro sync failed; fallback activated. ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  createMarkdownFallback(input: MiroFixBoardRequest) {
    return toMarkdown({
      runId: input.runId,
      mode: input.mode,
      oneLineVerdict: input.oneLineVerdict,
      topFixes: input.topFixes,
      rewriteScript: input.rewriteScript,
    });
  }
}

export function getMiroService() {
  // Do not memoize across requests in dev: env/provider mode can change while server is running.
  return new MiroService();
}
