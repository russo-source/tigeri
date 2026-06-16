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

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysLabel(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

function urgencyColor(days: number): string {
  if (days <= 3) return "var(--status-error)";
  if (days <= 14) return "var(--status-warning)";
  return "var(--text-muted)";
}

export function UpcomingRenewals({ expenses }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const items = expenses
    .filter(
      (e) =>
        e.status === "Active" &&
        e.category !== "Salaries" &&
        !!e.renewal
    )
    .map((e) => {
      const date = parseISO(e.renewal);
      const days = Math.round(
        (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return { e, date, days };
    })
    .filter((x) => x.days >= 0 && x.days <= 45)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  if (items.length === 0) {
    return (
      <div className="ts-card p-6 text-center ts-mono-meta">
        Nothing renews in the next 45 days
      </div>
    );
  }

  return (
    <div className="ts-card divide-y" style={{ borderColor: "var(--border-subtle)" }}>
      {items.map(({ e, date, days }) => (
        <div
          key={e.id}
          className="flex items-center justify-between gap-3 px-5 py-3"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="min-w-0">
            <div
              className="font-medium text-[14px] truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {e.name}
            </div>
            <div className="font-mono text-[11px] uppercase tracking-wider mt-0.5">
              <span style={{ color: "var(--text-muted)" }}>
                {date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                ·{" "}
              </span>
              <span style={{ color: urgencyColor(days) }}>{daysLabel(days)}</span>
            </div>
          </div>
          <div
            className="font-mono font-semibold text-[14px] shrink-0"
            style={{ color: "var(--text-primary)" }}
          >
            {fmtUSD(e.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}
