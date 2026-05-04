"use client";

import { useMemo } from "react";
import type { Expense } from "@/lib/types";
import { RenewalCalendar } from "./RenewalCalendar";

interface Props {
  expenses: Expense[];
}

interface RenewalEvent {
  date: Date;
  expense: Expense;
  amount: number;
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

function getRenewalsInRange(
  expenses: Expense[],
  start: Date,
  end: Date
): RenewalEvent[] {
  const events: RenewalEvent[] = [];
  for (const e of expenses) {
    if (e.status !== "Active" || !e.renewal) continue;

    if (e.cycle === "Monthly") {
      let occ = parseISO(e.renewal);
      while (occ < start) occ = addMonthsKeepDay(occ, 1);
      while (occ <= end) {
        events.push({ date: new Date(occ), expense: e, amount: e.amount });
        occ = addMonthsKeepDay(occ, 1);
      }
    } else if (e.cycle === "Annual") {
      const occ = parseISO(e.renewal);
      if (occ >= start && occ <= end) {
        events.push({ date: occ, expense: e, amount: e.amount });
      }
    }
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}

export function RenewalsTab({ expenses }: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekEnd = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }, [today]);

  const monthEnd = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 30);
    return d;
  }, [today]);

  const thisWeek = useMemo(
    () => getRenewalsInRange(expenses, today, weekEnd),
    [expenses, today, weekEnd]
  );

  const thisMonth = useMemo(
    () => getRenewalsInRange(expenses, today, monthEnd),
    [expenses, today, monthEnd]
  );

  const weekTotal = thisWeek.reduce((s, e) => s + e.amount, 0);
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <RenewalCalendar expenses={expenses} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* This Week */}
        <div>
          <div className="ts-label">Renewing This Week</div>
          <section className="ts-card p-6">
            <div className="flex justify-between items-baseline mb-4">
              <div className="font-mono text-[11px] text-[#6b7280] uppercase tracking-wider">
                Next 7 days
              </div>
              <div className="font-mono text-[18px] font-semibold text-navy">
                {fmtUSD(weekTotal)}
              </div>
            </div>
            {thisWeek.length === 0 ? (
              <div className="text-center py-6 font-mono text-[11px] text-[#9ca3af] uppercase tracking-wider">
                Nothing renews this week
              </div>
            ) : (
              <div>
                {thisWeek.map((ev, i) => (
                  <RenewalRow key={i} ev={ev} today={today} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* This Month */}
        <div>
          <div className="ts-label">Renewing This Month</div>
          <section className="ts-card p-6">
            <div className="flex justify-between items-baseline mb-4">
              <div className="font-mono text-[11px] text-[#6b7280] uppercase tracking-wider">
                Next 30 days
              </div>
              <div className="font-mono text-[18px] font-semibold text-navy">
                {fmtUSD(monthTotal)}
              </div>
            </div>
            {thisMonth.length === 0 ? (
              <div className="text-center py-6 font-mono text-[11px] text-[#9ca3af] uppercase tracking-wider">
                Nothing renews this month
              </div>
            ) : (
              <div>
                {thisMonth.map((ev, i) => (
                  <RenewalRow key={i} ev={ev} today={today} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function RenewalRow({ ev, today }: { ev: RenewalEvent; today: Date }) {
  const days = Math.round(
    (ev.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#e5e7eb] last:border-b-0">
      <div>
        <div className="font-medium text-[13px]">{ev.expense.name}</div>
        {ev.expense.vendor && (
          <div className="text-[#6b7280] text-xs">{ev.expense.vendor}</div>
        )}
      </div>
      <div className="text-right">
        <div className="font-mono font-medium text-[13px] text-navy">
          {fmtUSD(ev.amount)}
        </div>
        <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider">
          {ev.date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          ·{" "}
          {days === 0 ? "today" : days === 1 ? "tomorrow" : `${days}d`}
        </div>
      </div>
    </div>
  );
}
