"use client";

import { useEffect, useMemo, useState } from "react";
import type { MiroFixStatus, MiroSyncedFix } from "@/services/miro/miroTypes";

interface MiroSyncPanelProps {
  fixes: MiroSyncedFix[];
  isSyncing: boolean;
  lastSyncedAt?: string;
  error?: string | null;
  boardUrl?: string;
  queuedOps: number;
  degraded: boolean;
  conflicts: number;
  version: number;
  onSyncNow: () => void;
  onSaveFix: (input: {
    rank: number;
    patch: {
      status: MiroFixStatus;
      owner: string;
      notes: string;
    };
  }) => Promise<void>;
}

interface FixDraft {
  status: MiroFixStatus;
  owner: string;
  notes: string;
}

function statusStyle(status: MiroFixStatus) {
  if (status === "done") return { color: "#22c55e", bg: "rgba(34,197,94,0.10)" };
  if (status === "doing") return { color: "#3b82f6", bg: "rgba(59,130,246,0.10)" };
  if (status === "blocked") return { color: "#ef4444", bg: "rgba(239,68,68,0.10)" };
  return { color: "#f59e0b", bg: "rgba(245,158,11,0.10)" };
}

function formatSyncTime(value?: string) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function makeInitialDraft(fix: MiroSyncedFix): FixDraft {
  return {
    status: fix.status,
    owner: fix.owner ?? "",
    notes: fix.notes ?? "",
  };
}

export function MiroSyncPanel({
  fixes,
  isSyncing,
  lastSyncedAt,
  error,
  boardUrl,
  queuedOps,
  degraded,
  conflicts,
  version,
  onSyncNow,
  onSaveFix,
}: MiroSyncPanelProps) {
  const sortedFixes = useMemo(
    () => fixes.slice().sort((a, b) => a.rank - b.rank),
    [fixes],
  );
  const [drafts, setDrafts] = useState<Record<number, FixDraft>>({});
  const [savingRank, setSavingRank] = useState<number | null>(null);

  useEffect(() => {
    const nextDrafts: Record<number, FixDraft> = {};
    for (const fix of sortedFixes) {
      nextDrafts[fix.rank] = makeInitialDraft(fix);
    }
    setDrafts(nextDrafts);
  }, [sortedFixes]);

  const updateDraft = (rank: number, patch: Partial<FixDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [rank]: {
        ...(prev[rank] || { status: "todo", owner: "", notes: "" }),
        ...patch,
      },
    }));
  };

  const saveFix = async (fix: MiroSyncedFix) => {
    const draft = drafts[fix.rank] || makeInitialDraft(fix);
    setSavingRank(fix.rank);
    try {
      await onSaveFix({
        rank: fix.rank,
        patch: {
          status: draft.status,
          owner: draft.owner.trim(),
          notes: draft.notes.trim(),
        },
      });
    } finally {
      setSavingRank((current) => (current === fix.rank ? null : current));
    }
  };

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-color)",
        backdropFilter: "blur(var(--blur-strength))",
        WebkitBackdropFilter: "blur(var(--blur-strength))",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Miro Execution Sync
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            Last synced: {formatSyncTime(lastSyncedAt)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {boardUrl ? (
            <a
              href={boardUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded-lg text-[11px] border no-underline"
              style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
            >
              Open Board
            </a>
          ) : null}
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="px-2 py-1 rounded-lg text-[11px] border"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-secondary)",
              opacity: isSyncing ? 0.6 : 1,
            }}
          >
            {isSyncing ? "Syncing..." : "Sync now"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className="text-[11px] px-2 py-1 rounded-md border"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
        >
          queuedOps: {queuedOps}
        </span>
        <span
          className="text-[11px] px-2 py-1 rounded-md border"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
        >
          conflicts: {conflicts}
        </span>
        <span
          className="text-[11px] px-2 py-1 rounded-md border"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
        >
          version: {version}
        </span>
        {degraded ? (
          <span
            className="text-[11px] px-2 py-1 rounded-md"
            style={{ color: "#ffaa33", background: "rgba(255,170,51,0.12)" }}
          >
            Degraded mode
          </span>
        ) : null}
      </div>

      {error ? (
        <div
          className="mb-3 text-[11px] px-2 py-1 rounded-lg"
          style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}
        >
          {error}
        </div>
      ) : null}

      {sortedFixes.length === 0 ? (
        <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          No synced fix statuses yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {sortedFixes.map((fix) => {
            const style = statusStyle(fix.status);
            const draft = drafts[fix.rank] || makeInitialDraft(fix);
            const changed =
              draft.status !== fix.status ||
              draft.owner !== (fix.owner ?? "") ||
              draft.notes !== (fix.notes ?? "");
            const isSaving = savingRank === fix.rank;
            return (
              <div
                key={`${fix.rank}-${fix.itemId || "local"}`}
                className="rounded-lg border px-3 py-3"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-surface)",
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      Fix #{fix.rank}
                    </span>
                    <span
                      className="text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold"
                      style={{ color: style.color, backgroundColor: style.bg }}
                    >
                      {fix.status}
                    </span>
                    {fix.conflict ? (
                      <span
                        className="text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold"
                        style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.10)" }}
                      >
                        conflict
                      </span>
                    ) : null}
                  </div>
                  <button
                    onClick={() => {
                      void saveFix(fix);
                    }}
                    disabled={isSaving || !changed}
                    className="px-2 py-1 rounded-md text-[11px] border"
                    style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-secondary)",
                      opacity: isSaving || !changed ? 0.6 : 1,
                    }}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <label className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    Status
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        updateDraft(fix.rank, {
                          status: event.target.value as MiroFixStatus,
                        })
                      }
                      className="mt-1 w-full rounded-md border px-2 py-1 text-[12px] bg-transparent"
                      style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                    >
                      <option value="todo">todo</option>
                      <option value="doing">doing</option>
                      <option value="blocked">blocked</option>
                      <option value="done">done</option>
                    </select>
                  </label>
                  <label className="text-[11px] md:col-span-2" style={{ color: "var(--text-secondary)" }}>
                    Owner
                    <input
                      value={draft.owner}
                      maxLength={120}
                      onChange={(event) => updateDraft(fix.rank, { owner: event.target.value })}
                      className="mt-1 w-full rounded-md border px-2 py-1 text-[12px] bg-transparent"
                      style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                      placeholder="owner@company.com"
                    />
                  </label>
                </div>

                <label className="block text-[11px] mt-2" style={{ color: "var(--text-secondary)" }}>
                  Notes
                  <textarea
                    value={draft.notes}
                    maxLength={600}
                    onChange={(event) => updateDraft(fix.rank, { notes: event.target.value })}
                    className="mt-1 w-full rounded-md border px-2 py-1 text-[12px] bg-transparent min-h-[72px]"
                    style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                    placeholder="Execution notes..."
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
