"use client";

import type { Expense } from "@/lib/types";

interface Props {
  expenses: Expense[];
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

export function CategoryBreakdown({ expenses }: Props) {
  const byCat: Record<string, number> = {};
  expenses.forEach((e) => {
    const m = monthlyEquivalent(e);
    if (m > 0) byCat[e.category] = (byCat[e.category] || 0) + m;
  });
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;

  return (
    <>
      <div className="ts-label">Monthly Equivalent By Category</div>
      <section className="ts-card p-6 mb-8">
        {entries.length === 0 ? (
          <div className="text-center py-12 ts-mono-meta">
            No active recurring expenses
          </div>
        ) : (
          entries.map(([cat, val]) => {
            const pct = max > 0 ? (val / max) * 100 : 0;
            return (
              <div
                key={cat}
                className="grid grid-cols-[140px_1fr_100px] items-center gap-3 py-2 border-b border-[#e5e7eb] last:border-b-0"
              >
                <div className="ts-mono-meta">{cat}</div>
                <div className="bg-[#f8f9fa] h-2 rounded-sm overflow-hidden">
                  <div
                    className="bg-navy h-full transition-all duration-300 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="font-mono text-[13px] font-medium text-navy text-right">
                  {fmtUSD(val)}
                </div>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}
