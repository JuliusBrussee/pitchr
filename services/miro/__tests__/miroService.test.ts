import { describe, expect, it } from "vitest";
import { buildRetryDelayMs, mergeLocalAndRemoteFix } from "@/services/miro/miroService";
import {
  buildPitchrBoardName,
  buildPitchrStickyContent,
  detectStatusFromPosition,
  parsePitchrStickyContent,
} from "@/services/miro/providers/miroRestProvider";

describe("buildPitchrBoardName", () => {
  it("keeps name at or below Miro's 60-char limit for UUID run IDs", () => {
    const boardName = buildPitchrBoardName({
      runId: "9ce95f14-0e7e-44f3-aa23-8fca51ed06c2",
      datePart: "2026-02-22",
      boardNamePrefix: "Pitchr Fix Board",
    });

    expect(boardName.length).toBeLessThanOrEqual(60);
    expect(boardName).toContain("2026-02-22");
  });

  it("trims very long prefixes to stay within limit", () => {
    const boardName = buildPitchrBoardName({
      runId: "9ce95f14-0e7e-44f3-aa23-8fca51ed06c2",
      datePart: "2026-02-22",
      boardNamePrefix:
        "Pitchr Enterprise Accelerator Program Workspace Board Name Prefix",
    });

    expect(boardName.length).toBeLessThanOrEqual(60);
    expect(boardName).toContain("2026-02-22");
  });
});

describe("parsePitchrStickyContent", () => {
  it("parses status, owner, and notes from the card body", () => {
    const content = buildPitchrStickyContent({
      fix: {
        rank: 2,
        category: "delivery",
        impact: "high",
        issue: "Too many filler words",
        fix: "Shorten transitions and pause",
      },
      status: "doing",
      owner: "coach@pitchr.ai",
      notes: "Practice twice before next run.",
      nextStep: "Record one clean take",
      successMetric: "WPM stays below 160",
      blocker: "Need revised market slide",
    });

    const parsed = parsePitchrStickyContent(content);
    expect(parsed.warning).toBeUndefined();
    expect(parsed.parsed?.rank).toBe(2);
    expect(parsed.parsed?.status).toBe("doing");
    expect(parsed.parsed?.owner).toBe("coach@pitchr.ai");
    expect(parsed.parsed?.notes).toBe("Practice twice before next run.");
    expect(parsed.parsed?.nextStep).toBe("Record one clean take");
    expect(parsed.parsed?.successMetric).toBe("WPM stays below 160");
    expect(parsed.parsed?.blocker).toBe("Need revised market slide");
  });

  it("returns warning for malformed sticky", () => {
    const parsed = parsePitchrStickyContent("[PITCHR_FIX]\nstatus: todo");
    expect(parsed.parsed).toBeUndefined();
    expect(parsed.warning).toContain("rank");
  });
});

describe("mergeLocalAndRemoteFix", () => {
  it("applies last-write-wins when remote is newer", () => {
    const merged = mergeLocalAndRemoteFix({
      local: {
        itemId: "item-1",
        status: "todo",
        owner: "",
        notes: "",
        updatedAt: "2026-02-22T09:00:00.000Z",
        source: "app",
      },
      remote: {
        rank: 1,
        itemId: "item-1",
        status: "doing",
        owner: "pm@pitchr.ai",
        notes: "Moved in board",
        updatedAt: "2026-02-22T09:01:00.000Z",
        source: "miro",
      },
    });

    expect(merged.merged.status).toBe("doing");
    expect(merged.merged.owner).toBe("pm@pitchr.ai");
    expect(merged.conflict).toBe(true);
  });

  it("breaks equal timestamps toward miro", () => {
    const merged = mergeLocalAndRemoteFix({
      local: {
        itemId: "item-1",
        status: "done",
        owner: "app-owner",
        notes: "",
        updatedAt: "2026-02-22T09:01:00.000Z",
        source: "app",
      },
      remote: {
        rank: 1,
        itemId: "item-1",
        status: "blocked",
        owner: "miro-owner",
        notes: "blocked in board",
        updatedAt: "2026-02-22T09:01:00.000Z",
        source: "miro",
      },
    });

    expect(merged.merged.status).toBe("blocked");
    expect(merged.merged.owner).toBe("miro-owner");
    expect(merged.conflict).toBe(true);
  });
});

describe("buildRetryDelayMs", () => {
  it("computes bounded backoff schedule", () => {
    expect(buildRetryDelayMs(1)).toBe(2000);
    expect(buildRetryDelayMs(2)).toBe(4000);
    expect(buildRetryDelayMs(3)).toBe(8000);
    expect(buildRetryDelayMs(4)).toBe(16000);
    expect(buildRetryDelayMs(5)).toBe(32000);
    expect(buildRetryDelayMs(6)).toBe(60000);
    expect(buildRetryDelayMs(12)).toBe(60000);
  });
});

describe("detectStatusFromPosition", () => {
  const centers = {
    todo: -900,
    doing: -300,
    blocked: 300,
    done: 900,
  } as const;

  it("maps x-position to nearest status column", () => {
    expect(detectStatusFromPosition(-920, centers)).toBe("todo");
    expect(detectStatusFromPosition(-350, centers)).toBe("doing");
    expect(detectStatusFromPosition(200, centers)).toBe("blocked");
    expect(detectStatusFromPosition(1100, centers)).toBe("done");
  });
});
