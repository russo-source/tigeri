"use client";

interface Props {
  status: "loading" | "ok" | "error";
  syncedAt: Date | null;
}

export function Header({ status, syncedAt }: Props) {
  let dotColor = "bg-[#059669]";
  let label = "SYNCED";

  if (status === "loading") {
    dotColor = "bg-[#d97706] ts-pulse";
    label = "SYNCING";
  } else if (status === "error") {
    dotColor = "bg-[#dc2626]";
    label = "SYNC FAILED";
  } else if (syncedAt) {
    const hh = String(syncedAt.getHours()).padStart(2, "0");
    const mm = String(syncedAt.getMinutes()).padStart(2, "0");
    label = `SYNCED ${hh}:${mm}`;
  }

  return (
    <header className="bg-navy text-white px-6 h-16 flex items-center justify-between">
      <div className="text-xl font-semibold tracking-tight">
        TIGERI EXPENSE TRACKER
      </div>
      <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/70 flex items-center gap-3">
        <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotColor}`} />
        <span>{label}</span>
      </div>
    </header>
  );
}
