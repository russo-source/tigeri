"use client";

import { useMemo } from "react";
import type { Expense } from "@/lib/types";
import { MetricCards } from "./MetricCards";
import { CategoryBreakdown } from "./CategoryBreakdown";

interface Props {
  expenses: Expense[];
  loading: boolean;
}

function fmtUSD(n: number): string {
  return (
    "$" +
    n.toLocaleString("en-US", {
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

function isoOf(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addMonthsKeepDay(date: Date, n: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + n;
  d.setMonth(targetMonth);
  const expected = ((targetMonth % 12) + 12) % 12;
  if (d.getMonth() !== expected) d.setDate(0);
  return d;
}

function nextRenewals(expenses: Expense[], count: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 365);

  const events: { date: Date; expense: Expense; amount: number }[] = [];

  for (const e of expenses) {
    if (e.status !== "Active" || !e.renewal) continue;

    if (e.cycle === "Monthly") {
      let occ = parseISO(e.renewal);
      while (occ < today) occ = addMonthsKeepDay(occ, 1);
      if (occ <= horizon) {
        events.push({ date: occ, expense: e, amount: e.amount });
      }
    } else if (e.cycle === "Annual") {
      const occ = parseISO(e.renewal);
      if (occ >= today && occ <= horizon) {
        events.push({ date: occ, expense: e, amount: e.amount });
      }
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events.slice(0, count);
}

export function OverviewTab({ expenses, loading }: Props) {
  // Top vendor by total monthly equivalent
  const topVendor = useMemo(() => {
    const byVendor: Record<string, number> = {};
    expenses.forEach((e) => {
      if (!e.vendor) return;
      const m = monthlyEquivalent(e);
      if (m > 0) byVendor[e.vendor] = (byVendor[e.vendor] || 0) + m;
    });
    const entries = Object.entries(byVendor).sort((a, b) => b[1] - a[1]);
    return entries[0] || null;
  }, [expenses]);

  // Biggest single recurring expense
  const biggestExpense = useMemo(() => {
    const recurring = expenses.filter(
      (e) =>
        e.status === "Active" &&
        (e.cycle === "Monthly" || e.cycle === "Annual")
    );
    if (recurring.length === 0) return null;
    return recurring.reduce((biggest, e) =>
      monthlyEquivalent(e) > monthlyEquivalent(biggest) ? e : biggest
    );
  }, [expenses]);

  // Most expensive category
  const topCategory = useMemo(() => {
    const byCat: Record<string, number> = {};
    expenses.forEach((e) => {
      const m = monthlyEquivalent(e);
      if (m > 0) byCat[e.category] = (byCat[e.category] || 0) + m;
    });
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    return entries[0] || null;
  }, [expenses]);

  const upcomingRenewals = useMemo(() => nextRenewals(expenses, 3), [expenses]);

  return (
    <>
      <MetricCards expenses={expenses} loading={loading} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="ts-card p-6">
          <div className="ts-label">Top Vendor</div>
          {topVendor ? (
            <>
              <div className="font-semibold text-[16px] text-navy mt-3">
                {topVendor[0]}
              </div>
              <div className="font-mono text-[18px] font-semibold text-navy mt-1">
                {fmtUSD(topVendor[1])}
              </div>
              <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
                Per month
              </div>
            </>
          ) : (
            <div className="font-mono text-[12px] text-[#9ca3af] uppercase tracking-wider mt-3">
              No vendor data
            </div>
          )}
        </div>

        <div className="ts-card p-6">
          <div className="ts-label">Biggest Recurring</div>
          {biggestExpense ? (
            <>
              <div className="font-semibold text-[16px] text-navy mt-3">
                {biggestExpense.name}
              </div>
              <div className="font-mono text-[18px] font-semibold text-navy mt-1">
                {fmtUSD(monthlyEquivalent(biggestExpense))}
              </div>
              <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
                {biggestExpense.cycle === "Annual"
                  ? `${fmtUSD(biggestExpense.amount)} annual`
                  : "Per month"}
              </div>
            </>
          ) : (
            <div className="font-mono text-[12px] text-[#9ca3af] uppercase tracking-wider mt-3">
              No active expenses
            </div>
          )}
        </div>

        <div className="ts-card p-6">
          <div className="ts-label">Top Category</div>
          {topCategory ? (
            <>
              <div className="font-semibold text-[16px] text-navy mt-3">
                {topCategory[0]}
              </div>
              <div className="font-mono text-[18px] font-semibold text-navy mt-1">
                {fmtUSD(topCategory[1])}
              </div>
              <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
                Per month
              </div>
            </>
          ) : (
            <div className="font-mono text-[12px] text-[#9ca3af] uppercase tracking-wider mt-3">
              No category data
            </div>
          )}
        </div>
      </div>

      <CategoryBreakdown expenses={expenses} />

      <div className="ts-label">Next 3 Renewals</div>
      <section className="ts-card p-6 mb-8">
        {upcomingRenewals.length === 0 ? (
          <div className="text-center py-6 font-mono text-[12px] text-[#9ca3af] uppercase tracking-wider">
            No upcoming renewals
          </div>
        ) : (
          <div>
            {upcomingRenewals.map((ev, i) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const days = Math.round(
                (ev.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={i}
                  className="flex justify-between items-center py-3 border-b border-[#e5e7eb] last:border-b-0"
                >
                  <div>
                    <div className="font-semibold text-[14px]">
                      {ev.expense.name}
                    </div>
                    {ev.expense.vendor && (
                      <div className="text-[#6b7280] text-xs mt-0.5">
                        {ev.expense.vendor}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-[14px] text-navy">
                      {fmtUSD(ev.amount)}
                    </div>
                    <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-0.5">
                      {ev.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
