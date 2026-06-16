"use client";

import type { Expense } from "@/lib/types";

interface Props {
  expenses: Expense[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "AI/API": "#3537D7",
  Infrastructure: "#55ADE5",
  "SaaS Tools": "#6764CF",
  Hardware: "#1AA9A4",
  Domains: "#7178C2",
  Contractors: "#4B49A8",
  Salaries: "#9AB6DD",
  Other: "#8A8FB0",
};

function fmtUSD(n: number): string {
  return (
    "$" +
    (Number(n) || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function monthlyEq(e: Expense): number {
  if (e.status !== "Active") return 0;
  if (e.cycle === "Monthly") return e.amount || 0;
  if (e.cycle === "Annual") return (e.amount || 0) / 12;
  return 0;
}

export function TopServices({ expenses }: Props) {
  const top = expenses
    .map((e) => ({ e, m: monthlyEq(e) }))
    .filter((x) => x.m > 0)
    .sort((a, b) => b.m - a.m)
    .slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="ts-card p-6 text-center ts-mono-meta">
        No active recurring services
      </div>
    );
  }

  return (
    <div className="ts-card divide-y" style={{ borderColor: "var(--border-subtle)" }}>
      {top.map(({ e, m }) => (
        <div
          key={e.id}
          className="flex items-center justify-between gap-3 px-5 py-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: CATEGORY_COLORS[e.category] || "#8A8FB0",
              }}
            />
            <div className="min-w-0">
              <div
                className="font-medium text-[14px] truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {e.name}
              </div>
              <div className="ts-mono-meta truncate">
                {e.category}
                {e.vendor ? ` · ${e.vendor}` : ""}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span
              className="font-mono font-semibold text-[14px]"
              style={{ color: "var(--text-primary)" }}
            >
              {fmtUSD(m)}
            </span>
            <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
              /mo
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
