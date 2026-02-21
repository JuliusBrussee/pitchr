import { NextResponse } from "next/server";
import { getMiroService } from "@/services/miro/miroService";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const runId = url.searchParams.get("runId");
    const boardId = url.searchParams.get("boardId");

    if (!runId || !boardId) {
      return NextResponse.json(
        { error: "runId and boardId are required query parameters" },
        { status: 400 },
      );
    }

    const service = getMiroService();
    const result = await service.syncFixBoard({ runId, boardId });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

