import { NextResponse } from "next/server";
import { getMiroService } from "@/services/miro/miroService";
import type { MiroFixBoardRequest } from "@/services/miro/miroTypes";

function isValidMarkdownPayload(body: unknown): body is MiroFixBoardRequest {
  if (!body || typeof body !== "object") return false;
  const value = body as Record<string, unknown>;
  return (
    typeof value.runId === "string" &&
    typeof value.mode === "string" &&
    typeof value.oneLineVerdict === "string" &&
    typeof value.rewriteScript === "string" &&
    Array.isArray(value.topFixes)
  );
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!isValidMarkdownPayload(body)) {
      return NextResponse.json(
        { error: "Invalid request body for /api/miro/fix-board/markdown" },
        { status: 400 },
      );
    }

    const service = getMiroService();
    const markdown = service.createMarkdownFallback(body);
    return NextResponse.json(
      {
        markdown,
        filename: `pitchr-fix-board-${body.runId}.md`,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

