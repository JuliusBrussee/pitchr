import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/miro/miroService", () => {
  class RunMiroBoardNotFoundError extends Error {}
  class MiroSyncUnavailableError extends Error {}
  return {
    getMiroService: vi.fn(),
    RunMiroBoardNotFoundError,
    MiroSyncUnavailableError,
  };
});

vi.mock("@/lib/supabase/auth-helpers", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    supabase: {},
    user: { id: "test-user-id" },
  }),
  AuthenticationError: class AuthenticationError extends Error {},
}));

import { POST } from "@/app/api/miro/fix-board/route";
import { getMiroService } from "@/services/miro/miroService";

const mockedGetMiroService = vi.mocked(getMiroService);

function validPayload(overrides?: Record<string, unknown>) {
  return {
    runId: "run_123",
    mode: "vc_pitch",
    oneLineVerdict: "Test verdict",
    rewriteScript: "Rewrite",
    topFixes: [
      {
        rank: 1,
        category: "market",
        impact: "high",
        issue: "Missing TAM",
        fix: "Add TAM",
      },
    ],
    ...(overrides ?? {}),
  };
}

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/miro/fix-board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/miro/fix-board", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts transcript when it is a string", async () => {
    const createFixBoard = vi.fn(async () => ({
      boardId: "board-1",
      boardUrl: "https://miro.com/app/board/board-1/",
      createdAt: "2026-02-22T10:00:00.000Z",
      reused: false,
      snapshot: {
        boardId: "board-1",
        syncedAt: "2026-02-22T10:00:00.000Z",
        fixes: [],
        warnings: [],
        queuedOps: 0,
        degraded: false,
        conflicts: 0,
        version: 1,
      },
    }));
    mockedGetMiroService.mockReturnValue({
      createFixBoard,
    } as unknown as ReturnType<typeof getMiroService>);

    const response = await POST(
      createRequest(validPayload({ transcript: "Full transcript content here." })),
    );

    expect(response.status).toBe(200);
    expect(createFixBoard).toHaveBeenCalledTimes(1);
  });

  it("rejects non-string transcript", async () => {
    const response = await POST(createRequest(validPayload({ transcript: 123 })));
    expect(response.status).toBe(400);
  });
});

