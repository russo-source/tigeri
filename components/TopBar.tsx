"use client";

interface Props {
  syncedAt: Date | null;
  status: "loading" | "ok" | "error";
}

export function TopBar({ syncedAt, status }: Props) {
  let dotColor = "#2E6B16";
  let label = "Synced";
  let pulse = false;

  if (status === "loading") {
    dotColor = "#9C5700";
    label = "Syncing";
    pulse = true;
  } else if (status === "error") {
    dotColor = "#C0263C";
    label = "Error";
  } else if (syncedAt) {
    const hh = String(syncedAt.getHours()).padStart(2, "0");
    const mm = String(syncedAt.getMinutes()).padStart(2, "0");
    label = `Synced ${hh}:${mm}`;
  }

  return (
    <header
      className="h-16 px-8 flex items-center justify-between sticky top-0 z-20"
      style={{
        background: "var(--bg-base)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="font-mono text-[11px] font-medium uppercase tracking-[0.14em]"
        style={{ color: "var(--text-muted)" }}
      >
        Live Dashboard
      </div>
      <div
        className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full inline-block ${pulse ? "ts-pulse" : ""}`}
          style={{ backgroundColor: dotColor }}
        />
        <span>{label}</span>
      </div>
    </header>
  );
}
