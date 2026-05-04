"use client";

import type { Expense } from "@/lib/types";

interface Props {
  expenses: Expense[];
  loading: boolean;
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

export function MetricCards({ expenses, loading }: Props) {
  const monthly = expenses.reduce((s, e) => s + monthlyEquivalent(e), 0);
  const annual = monthly * 12;
  const oneTime = expenses
    .filter((e) => e.cycle === "One-time" && e.status === "Active")
    .reduce((s, e) => s + (e.amount || 0), 0);
  const pending = expenses.filter((e) => e.status === "Pending Info").length;

  const cards = [
    {
      label: "Monthly Burn",
      value: fmtUSD(monthly),
      sublabel: "Active subscriptions only",
    },
    {
      label: "Annual Run Rate",
      value: fmtUSD(annual),
      sublabel: "Monthly × 12",
    },
    {
      label: "One-time Logged",
      value: fmtUSD(oneTime),
      sublabel: "Hardware, top-ups, contractors",
    },
    {
      label: "Pending Info",
      value: String(pending),
      sublabel: "Items awaiting amount",
    },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((c) => (
        <div key={c.label} className="ts-card p-6">
          <div className="ts-label">{c.label}</div>
          <div className="font-mono text-[26px] font-semibold text-navy tracking-tight mt-3">
            {loading && expenses.length === 0 ? "—" : c.value}
          </div>
          <div className="font-mono text-[11px] text-[#9ca3af] uppercase tracking-wider mt-2">
            {c.sublabel}
          </div>
        </div>
      ))}
    </section>
  );
}
