"use client";

import { useMemo, useState } from "react";
import type { Invoice } from "@/lib/sheets";
import { StatCard } from "./StatCard";

interface Props {
  invoices: Invoice[];
  onMarkSettled: (row: number) => Promise<void>;
}

function fmtUSD(n: number): string {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function nextFifteenth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const target = now.getDate() <= 15 ? new Date(y, m, 15) : new Date(y, m + 1, 15);
  return target.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function ReimbursementsView({ invoices, onMarkSettled }: Props) {
  const [busyRow, setBusyRow] = useState<number | null>(null);

  const pending = useMemo(
    () => invoices.filter((i) => i.reimbursementStatus === "pending").sort((a, b) => (a.date < b.date ? -1 : 1)),
    [invoices]
  );
  const settled = useMemo(
    () => invoices.filter((i) => i.reimbursementStatus === "settled").sort((a, b) => (a.date < b.date ? 1 : -1)),
    [invoices]
  );

  const owed = pending.reduce((s, i) => s + i.amountUSD, 0);
  const settledTotal = settled.reduce((s, i) => s + i.amountUSD, 0);

  async function handle(row: number) {
    setBusyRow(row);
    try {
      await onMarkSettled(row);
    } finally {
      setBusyRow(null);
    }
  }

  return (
    <>
      <div className="mb-8">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-muted)" }}>
          Settlement
        </div>
        <h2 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Reimbursements</h2>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          Tim reimburses Russo's out-of-pocket costs each month on the 15th. Next settlement: <strong style={{ color: "var(--text-primary)" }}>{nextFifteenth()}</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard gradient label="Tim owes Russo" value={fmtUSD(owed)} sub={`${pending.length} pending`} />
        <StatCard label="Reimbursed to date" value={fmtUSD(settledTotal)} sub={`${settled.length} settled`} />
        <StatCard label="Next settlement" value={nextFifteenth().split(",")[0]} sub="Monthly, on the 15th" />
      </div>

      {/* Pending */}
      <div className="ts-label">Pending — Tim owes Russo</div>
      <section className="ts-card mb-8 divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {pending.length === 0 ? (
          <div className="text-center py-10 ts-mono-meta">Nothing outstanding — all settled 🎉</div>
        ) : (
          pending.map((i) => (
            <div key={i.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-4 sm:px-5 py-3 row-hover" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="min-w-0">
                <div className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>
                  {i.vendor} <span style={{ color: "var(--text-muted)" }}>· {i.description}</span>
                </div>
                <div className="ts-mono-meta">{i.rawDate}{i.invoiceNo && i.invoiceNo !== "—" ? ` · ${i.invoiceNo}` : ""}</div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                <span className="font-mono font-semibold text-[14px]" style={{ color: "var(--text-primary)" }}>{fmtUSD(i.amountUSD)}</span>
                <button className="ts-btn ts-btn-primary" style={{ padding: "8px 14px", fontSize: "13px" }} disabled={busyRow === i.row} onClick={() => handle(i.row)}>
                  {busyRow === i.row ? <><span className="ts-loader mr-2" /> Saving</> : "Mark settled"}
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Settled */}
      <div className="ts-label">Reimbursed history</div>
      <section className="ts-card divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {settled.length === 0 ? (
          <div className="text-center py-10 ts-mono-meta">No reimbursements yet</div>
        ) : (
          settled.map((i) => (
            <div key={i.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-4 sm:px-5 py-3 row-hover" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="min-w-0">
                <div className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>
                  {i.vendor} <span style={{ color: "var(--text-muted)" }}>· {i.description}</span>
                </div>
                <div className="ts-mono-meta">{i.rawDate}</div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="font-mono font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>{fmtUSD(i.amountUSD)}</span>
                <span className="ts-badge ts-badge-active">Reimbursed</span>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
