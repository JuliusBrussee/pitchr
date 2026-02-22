import { NextResponse } from "next/server";
import {
  getMiroService,
  MiroSyncUnavailableError,
  RunMiroBoardNotFoundError,
} from "@/services/miro/miroService";
import type {
  MiroFixBoardRequest,
  MiroFixPatchRequest,
  MiroFixStatus,
  MiroTopFixInput,
} from "@/services/miro/miroTypes";

function isMiroFixStatus(value: unknown): value is MiroFixStatus {
  return value === "todo" || value === "doing" || value === "done" || value === "blocked";
}

function isPitchMode(value: unknown): value is "elevator" | "vc_pitch" {
  return value === "elevator" || value === "vc_pitch";
}

function isFixImpact(value: unknown): value is "high" | "medium" | "low" {
  return value === "high" || value === "medium" || value === "low";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidTopFix(value: unknown): value is MiroTopFixInput {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item.rank !== "number" || !Number.isInteger(item.rank)) return false;
  if (item.rank < 1 || item.rank > 5) return false;
  return (
    isNonEmptyString(item.category) &&
    isFixImpact(item.impact) &&
    isNonEmptyString(item.issue) &&
    isNonEmptyString(item.fix)
  );
}

function isValidCreatePayload(body: unknown): body is MiroFixBoardRequest {
  if (!body || typeof body !== "object") return false;
  const value = body as Record<string, unknown>;
  if (
    !isNonEmptyString(value.runId) ||
    !isPitchMode(value.mode) ||
    !isNonEmptyString(value.oneLineVerdict) ||
    !isNonEmptyString(value.rewriteScript) ||
    !Array.isArray(value.topFixes)
  ) {
    return false;
  }
  if (typeof value.recreate !== "undefined" && typeof value.recreate !== "boolean") {
    return false;
  }
  if (value.topFixes.length === 0 || value.topFixes.length > 5) return false;
  const seenRanks = new Set<number>();
  for (const fix of value.topFixes) {
    if (!isValidTopFix(fix)) return false;
    if (seenRanks.has(fix.rank)) return false;
    seenRanks.add(fix.rank);
  }
  return true;
}

function isValidPatchPayload(body: unknown): body is MiroFixPatchRequest {
  if (!body || typeof body !== "object") return false;
  const value = body as Record<string, unknown>;
  if (!isNonEmptyString(value.runId)) return false;
  if (typeof value.rank !== "number" || !Number.isInteger(value.rank)) return false;
  if (value.rank < 1 || value.rank > 5) return false;
  if (!value.patch || typeof value.patch !== "object") return false;
  if (!isNonEmptyString(value.clientUpdatedAt)) return false;
  if (!Number.isFinite(Date.parse(value.clientUpdatedAt))) return false;
  const patch = value.patch as Record<string, unknown>;
  if (
    typeof patch.status === "undefined" &&
    typeof patch.owner === "undefined" &&
    typeof patch.notes === "undefined"
  ) {
    return false;
  }
  if (typeof patch.status !== "undefined" && !isMiroFixStatus(patch.status)) return false;
  if (typeof patch.owner !== "undefined") {
    if (typeof patch.owner !== "string") return false;
    if (patch.owner.length > 120) return false;
  }
  if (typeof patch.notes !== "undefined") {
    if (typeof patch.notes !== "string") return false;
    if (patch.notes.length > 600) return false;
  }
  return true;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const runId = url.searchParams.get("runId");
    if (!runId) {
      return NextResponse.json(
        { error: "runId is a required query parameter" },
        { status: 400 },
      );
    }

    const service = getMiroService();
    const result = await service.getFixBoard(runId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
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

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!isValidCreatePayload(body)) {
      return NextResponse.json(
        { error: "Invalid request body for /api/miro/fix-board" },
        { status: 400 },
      );
    }

    const service = getMiroService();
    const result = await service.createFixBoard(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body: unknown = await req.json();
    if (!isValidPatchPayload(body)) {
      return NextResponse.json(
        { error: "Invalid request body for /api/miro/fix-board PATCH" },
        { status: 400 },
      );
    }

    const service = getMiroService();
    const result = await service.patchFix(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof RunMiroBoardNotFoundError) {
      return NextResponse.json({ error: "Miro board not found for this run" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
