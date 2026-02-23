import { NextResponse } from "next/server";
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';
import {
  getMiroService,
  MiroSyncUnavailableError,
  RunMiroBoardNotFoundError,
} from "@/services/miro/miroService";

export async function GET(req: Request) {
  try {
    const { supabase } = await getAuthenticatedUser();
    const url = new URL(req.url);
    const runId = url.searchParams.get("runId");

    if (!runId) {
      return NextResponse.json(
        { error: "runId is a required query parameter" },
        { status: 400 },
      );
    }

    const service = getMiroService(supabase);
    const result = await service.syncFixBoard({ runId });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof RunMiroBoardNotFoundError) {
      return NextResponse.json({ error: "Miro board not found for this run" }, { status: 404 });
    }
    if (error instanceof MiroSyncUnavailableError) {
      return NextResponse.json(
        { error: error.message || "Miro sync unavailable" },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
