"use client";

import { useMemo, useState } from "react";
import type { Invoice } from "@/lib/sheets";

interface Props {
  invoices: Invoice[];
}

type SortKey = "date" | "amountUSD" | "vendor";

function fmtUSD(n: number): string {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function reimbursedBadge(i: Invoice) {
  if (i.reimbursementStatus === "pending")
    return <span className="ts-badge ts-badge-pending">Pending</span>;
  if (i.reimbursementStatus === "settled")
    return <span className="ts-badge ts-badge-active">Reimbursed</span>;
  return <span className="ts-mono-meta">—</span>;
}

export function InvoicesTable({ invoices }: Props) {
  const [person, setPerson] = useState<"all" | "Russo" | "Tim">("all");
  const [reimb, setReimb] = useState<"all" | "pending" | "settled" | "n/a">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    let list = invoices.filter((i) => {
      if (person !== "all" && i.paidBy !== person) return false;
      if (reimb !== "all" && i.reimbursementStatus !== reimb) return false;
      if (q) {
        const hay = `${i.vendor} ${i.description} ${i.invoiceNo}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      let r = 0;
      if (sort === "amountUSD") r = a.amountUSD - b.amountUSD;
      else if (sort === "vendor") r = a.vendor.localeCompare(b.vendor);
      else r = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return asc ? r : -r;
    });
    return list;
  }, [invoices, person, reimb, q, sort, asc]);

  const total = rows.reduce((s, i) => s + i.amountUSD, 0);

  function toggleSort(k: SortKey) {
    if (sort === k) setAsc((v) => !v);
    else { setSort(k); setAsc(false); }
  }

  function exportCsv() {
    const headers = ["Date", "Paid By", "Vendor", "Description", "Invoice #", "Status", "Reimbursed", "Currency", "Orig Amount", "Amount USD"];
    const data = rows.map((i) => [i.date || i.rawDate, i.paidBy, i.vendor, i.description, i.invoiceNo, i.status, i.reimbursed, i.currency, i.origAmount, i.amountUSD.toFixed(2)]);
    const csv = [headers, ...data]
      .map((r) => r.map((c) => { const s = String(c ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `tigeri-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const SortHead = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th
      onClick={() => toggleSort(k)}
      className={`font-mono text-[11px] font-medium uppercase tracking-wider px-4 py-3 border-b cursor-pointer select-none whitespace-nowrap ${right ? "text-right" : "text-left"}`}
      style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}
    >
      {label}{sort === k ? (asc ? " ▲" : " ▼") : ""}
    </th>
  );

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-muted)" }}>
            Ledger
          </div>
          <h2 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Invoices</h2>
        </div>
        <button className="ts-btn ts-btn-secondary" onClick={exportCsv}>Export CSV</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end mb-4 flex-wrap">
        <div className="min-w-[150px]">
          <label className="ts-label">Paid by</label>
          <select className="ts-select" value={person} onChange={(e) => setPerson(e.target.value as any)}>
            <option value="all">Everyone</option>
            <option value="Russo">Russo</option>
            <option value="Tim">Tim</option>
          </select>
        </div>
        <div className="min-w-[150px]">
          <label className="ts-label">Reimbursement</label>
          <select className="ts-select" value={reimb} onChange={(e) => setReimb(e.target.value as any)}>
            <option value="all">Any</option>
            <option value="pending">Pending</option>
            <option value="settled">Reimbursed</option>
            <option value="n/a">N/A</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="ts-label">Search</label>
          <input className="ts-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Vendor, description, invoice #" />
        </div>
      </div>

      <div className="ts-card overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <SortHead k="date" label="Date" />
              <SortHead k="vendor" label="Vendor / Description" />
              <th className="font-mono text-[11px] font-medium uppercase tracking-wider px-4 py-3 border-b text-left whitespace-nowrap" style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>Paid By</th>
              <th className="font-mono text-[11px] font-medium uppercase tracking-wider px-4 py-3 border-b text-left whitespace-nowrap" style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>Status</th>
              <th className="font-mono text-[11px] font-medium uppercase tracking-wider px-4 py-3 border-b text-left whitespace-nowrap" style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>Reimbursed</th>
              <SortHead k="amountUSD" label="Amount (USD)" right />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 ts-mono-meta">No invoices match</td></tr>
            ) : (
              rows.map((i) => (
                <tr key={i.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-4 py-3 align-middle font-mono text-[12px] whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{i.rawDate || "—"}</td>
                  <td className="px-4 py-3 align-middle">
                    <div className="font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>{i.vendor}</div>
                    <div className="ts-mono-meta truncate max-w-[280px]">{i.description}</div>
                  </td>
                  <td className="px-4 py-3 align-middle"><span className="ts-mono-meta">{i.paidBy}</span></td>
                  <td className="px-4 py-3 align-middle ts-mono-meta">{i.status || "—"}</td>
                  <td className="px-4 py-3 align-middle">{reimbursedBadge(i)}</td>
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <div className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>{fmtUSD(i.amountUSD)}</div>
                    {i.currency && i.currency !== "USD" && (
                      <div className="ts-mono-meta">{i.origAmount.toLocaleString()} {i.currency}</div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={5} className="px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-right border-t" style={{ background: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border-subtle)" }}>{rows.length} invoices · total</td>
                <td className="px-4 py-3 font-mono text-sm font-semibold text-right border-t" style={{ background: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border-subtle)" }}>{fmtUSD(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}
