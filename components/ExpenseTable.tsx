"use client";

import { useState, useMemo } from "react";
import type { Expense, Category, Status } from "@/lib/types";
import { CATEGORIES, STATUSES } from "@/lib/types";

interface Props {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onCancel: (id: string) => Promise<void>;
  onRefresh: () => void;
  refreshing: boolean;
  onExport: () => void;
}

function fmtUSD(n: number): string {
  return (
    "$" +
    (Number(n) || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function monthlyEquivalent(e: Expense): number {
  if (e.status !== "Active") return 0;
  if (e.cycle === "Monthly") return e.amount || 0;
  if (e.cycle === "Annual") return (e.amount || 0) / 12;
  return 0;
}

const STATUS_BADGE_CLASS: Record<Status, string> = {
  Active: "ts-badge-active",
  "Pending Info": "ts-badge-pending",
  Cancelled: "ts-badge-cancelled",
  Trial: "ts-badge-trial",
};

const STATUS_RANK: Record<Status, number> = {
  Active: 0,
  "Pending Info": 1,
  Trial: 2,
  Cancelled: 3,
};

export function ExpenseTable({
  expenses,
  onEdit,
  onCancel,
  onRefresh,
  refreshing,
  onExport,
}: Props) {
  const [filterCategory, setFilterCategory] = useState<Category | "">("");
  const [filterStatus, setFilterStatus] = useState<Status | "">("Active");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = expenses.filter(
      (e) =>
        (!filterCategory || e.category === filterCategory) &&
        (!filterStatus || e.status === filterStatus)
    );
    return list.sort((a, b) => {
      const sa = STATUS_RANK[a.status] ?? 9;
      const sb = STATUS_RANK[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      return monthlyEquivalent(b) - monthlyEquivalent(a);
    });
  }, [expenses, filterCategory, filterStatus]);

  const totalMonthly = filtered.reduce((s, e) => s + monthlyEquivalent(e), 0);

  async function handleCancel(id: string, name: string) {
    if (!confirm(`Mark "${name}" as Cancelled in Notion? (Soft delete - row stays for audit)`))
      return;
    setCancellingId(id);
    try {
      await onCancel(id);
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <>
      <div className="flex justify-between items-end mb-4 gap-4 flex-wrap">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="min-w-[180px]">
            <label className="ts-label">Filter Category</label>
            <select
              className="ts-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | "")}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="ts-label">Filter Status</label>
            <select
              className="ts-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | "")}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            className="ts-btn ts-btn-secondary"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <span className="ts-loader mr-2" /> Refreshing
              </>
            ) : (
              "Refresh from Notion"
            )}
          </button>
          <button className="ts-btn ts-btn-secondary" onClick={onExport}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="ts-card overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {[
                "Name / Vendor",
                "Category",
                "Account",
                "Cycle",
                "Renewal",
                "Status",
              ].map((h) => (
                <th
                  key={h}
                  className="bg-[#f0f4f8] font-mono text-[11px] font-medium uppercase tracking-wider text-[#6b7280] px-4 py-3 text-left border-b border-[#e5e7eb] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
              <th className="bg-[#f0f4f8] font-mono text-[11px] font-medium uppercase tracking-wider text-[#6b7280] px-4 py-3 text-right border-b border-[#e5e7eb] whitespace-nowrap">
                Amount
              </th>
              <th className="bg-[#f0f4f8] font-mono text-[11px] font-medium uppercase tracking-wider text-[#6b7280] px-4 py-3 text-right border-b border-[#e5e7eb] whitespace-nowrap">
                Monthly Eq.
              </th>
              <th className="bg-[#f0f4f8] border-b border-[#e5e7eb]" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-12 ts-mono-meta"
                >
                  No entries match the current filter
                </td>
              </tr>
            ) : (
              filtered.map((e) => {
                const me = monthlyEquivalent(e);
                return (
                  <tr
                    key={e.id}
                    className="hover:bg-[#f8f9fa] transition-colors duration-150 border-b border-[#e5e7eb] last:border-b-0"
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="font-medium">{e.name}</div>
                      {e.vendor && (
                        <div className="text-[#6b7280] text-xs">{e.vendor}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="ts-mono-meta">{e.category}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="ts-mono-meta">{e.account || "—"}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="ts-mono-meta">{e.cycle}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="font-mono text-xs text-[#6b7280]">
                        {e.renewal || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`ts-badge ${STATUS_BADGE_CLASS[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle font-mono font-medium text-right">
                      {fmtUSD(e.amount)}
                    </td>
                    <td className="px-4 py-3 align-middle font-mono font-medium text-right">
                      {me > 0 ? fmtUSD(me) : "—"}
                    </td>
                    <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                      <button
                        className="ts-btn ts-btn-ghost"
                        onClick={() => onEdit(e)}
                      >
                        Edit
                      </button>
                      <button
                        className="ts-btn ts-btn-danger-ghost"
                        onClick={() => handleCancel(e.id, e.name)}
                        disabled={cancellingId === e.id}
                      >
                        {cancellingId === e.id ? "..." : "Cancel"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={7}
                  className="bg-[#f8f9fa] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-navy text-right border-t border-[#e5e7eb]"
                >
                  Filtered Monthly Total
                </td>
                <td className="bg-[#f8f9fa] px-4 py-3 font-mono text-sm font-semibold text-navy text-right border-t border-[#e5e7eb]">
                  {fmtUSD(totalMonthly)}
                </td>
                <td className="bg-[#f8f9fa] border-t border-[#e5e7eb]" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}
