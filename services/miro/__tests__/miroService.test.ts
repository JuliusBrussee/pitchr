import { describe, expect, it } from "vitest";
import { MiroService } from "@/services/miro/miroService";
import { parsePitchrStickyContent } from "@/services/miro/providers/miroRestProvider";
import type { MiroProvider } from "@/services/miro/miroProvider";

const sampleRequest = {
  runId: "run_test_1",
  mode: "vc_pitch",
  oneLineVerdict: "Test verdict",
  rewriteScript: "Rewrite text",
  topFixes: [
    {
      rank: 1,
      category: "market",
      impact: "high",
      issue: "Missing TAM",
      fix: "Add market sizing",
    },
  ],
};

describe("miroService", () => {
  it("uses stub provider when MIRO_PROVIDER=stub", async () => {
    process.env.MIRO_PROVIDER = "stub";
    process.env.MIRO_ACCESS_TOKEN = "token";

    const service = new MiroService();
    const result = await service.createFixBoard(sampleRequest);

    expect(result.boardId).toContain("stub-board-");
    expect(result.fallback).toBe(true);
  });

  it("falls back to stub when provider throws", async () => {
    const throwingProvider: MiroProvider = {
      async createFixBoard() {
        throw new Error("boom");
      },
      async syncFixBoard() {
        throw new Error("boom");
      },
    };

    const service = new MiroService({ provider: throwingProvider });
    const result = await service.createFixBoard(sampleRequest);

    expect(result.fallback).toBe(true);
    expect(result.message).toContain("Miro create failed");
  });
});

describe("parsePitchrStickyContent", () => {
  it("parses valid sticky format", () => {
    const content = `
      [PITCHR_FIX]
      runId: run_test_1
      fixRank: 2
      category: delivery
      impact: medium
      status: done
      owner: coach@pitchr.ai
      notes: Good update
    `;

    const parsed = parsePitchrStickyContent(content);
    expect(parsed.fix).toBeTruthy();
    expect(parsed.fix?.rank).toBe(2);
    expect(parsed.fix?.status).toBe("done");
    expect(parsed.fix?.owner).toBe("coach@pitchr.ai");
  });

  it("returns warning for malformed sticky", () => {
    const parsed = parsePitchrStickyContent("[PITCHR_FIX]\nstatus: todo");
    expect(parsed.fix).toBeUndefined();
    expect(parsed.warning).toContain("fixRank");
  });
});

