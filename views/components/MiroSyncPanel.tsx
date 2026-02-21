"use client";

import type { MiroSyncedFix } from "@/services/miro/miroTypes";

interface MiroSyncPanelProps {
  fixes: MiroSyncedFix[];
  isSyncing: boolean;
  lastSyncedAt?: string;
  error?: string | null;
  boardUrl?: string;
  onSyncNow: () => void;
}

function statusStyle(status: MiroSyncedFix["status"]) {
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

export function MiroSyncPanel({
  fixes,
  isSyncing,
  lastSyncedAt,
  error,
  boardUrl,
  onSyncNow,
}: MiroSyncPanelProps) {
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
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Miro Sync
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

      {error ? (
        <div className="mb-3 text-[11px] px-2 py-1 rounded-lg" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
          {error}
        </div>
      ) : null}

      {fixes.length === 0 ? (
        <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          No synced fix statuses yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {fixes
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .map((fix) => {
              const style = statusStyle(fix.status);
              return (
                <div
                  key={`${fix.rank}-${fix.itemId || "local"}`}
                  className="rounded-lg border px-2.5 py-2"
                  style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-surface)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      Fix #{fix.rank}
                    </span>
                    <span
                      className="text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold"
                      style={{ color: style.color, backgroundColor: style.bg }}
                    >
                      {fix.status}
                    </span>
                  </div>
                  {fix.owner ? (
                    <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                      Owner: {fix.owner}
                    </div>
                  ) : null}
                  {fix.notes ? (
                    <div className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                      Notes: {fix.notes}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

