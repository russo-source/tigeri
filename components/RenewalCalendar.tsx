"use client";

import { useState, useMemo } from "react";
import type { Expense } from "@/lib/types";

interface Props {
  expenses: Expense[];
}

interface DayData {
  date: Date;
  iso: string;
  events: { expense: Expense; amount: number }[];
  total: number;
}

const NAVY_RGB = "4, 2, 115";
const WEEKS = 14; // 14 × 7 = 98 days, gives 90+ day visibility
const MONTH_LABELS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function fmtUSD(n: number): string {
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
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
  // Handle month overflow (e.g., Jan 31 + 1mo could land in March)
  const expected = ((targetMonth % 12) + 12) % 12;
  if (d.getMonth() !== expected) {
    d.setDate(0); // set to last day of intended month
  }
  return d;
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildGrid(expenses: Expense[]) {
  const totalDays = WEEKS * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = getMondayOf(today);
  const end = new Date(start);
  end.setDate(end.getDate() + totalDays - 1);

  // Initialize all days
  const map = new Map<string, DayData>();
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = isoOf(d);
    map.set(iso, { date: d, iso, events: [], total: 0 });
  }

  // Project renewals
  for (const e of expenses) {
    if (e.status !== "Active" || !e.renewal) continue;

    if (e.cycle === "Monthly") {
      let occ = parseISO(e.renewal);
      // Walk forward until we reach today (or pass it)
      while (occ < today) {
        occ = addMonthsKeepDay(occ, 1);
      }
      // Add every monthly occurrence within window
      while (occ <= end) {
        const day = map.get(isoOf(occ));
        if (day) {
          day.events.push({ expense: e, amount: e.amount });
          day.total += e.amount;
        }
        occ = addMonthsKeepDay(occ, 1);
      }
    } else if (e.cycle === "Annual") {
      const occ = parseISO(e.renewal);
      if (occ >= today && occ <= end) {
        const day = map.get(isoOf(occ));
        if (day) {
          day.events.push({ expense: e, amount: e.amount });
          day.total += e.amount;
        }
      }
    }
  }

  // Group into weeks (columns)
  const weeks: DayData[][] = [];
  let cursor = new Date(start);
  for (let w = 0; w < WEEKS; w++) {
    const week: DayData[] = [];
    for (let d = 0; d < 7; d++) {
      const day = map.get(isoOf(cursor));
      if (day) week.push(day);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks, today };
}

function intensityStyle(amount: number): React.CSSProperties {
  if (amount === 0) return { backgroundColor: "#f8f9fa" };
  if (amount < 50) return { backgroundColor: `rgba(${NAVY_RGB}, 0.20)` };
  if (amount < 200) return { backgroundColor: `rgba(${NAVY_RGB}, 0.40)` };
  if (amount < 500) return { backgroundColor: `rgba(${NAVY_RGB}, 0.60)` };
  if (amount < 1500) return { backgroundColor: `rgba(${NAVY_RGB}, 0.80)` };
  return { backgroundColor: `rgb(${NAVY_RGB})` };
}

function getMonthHeaders(weeks: DayData[][]) {
  const headers: { month: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, idx) => {
    if (week.length === 0) return;
    const month = week[0].date.getMonth();
    if (month !== lastMonth) {
      headers.push({ month: MONTH_LABELS[month], weekIdx: idx });
      lastMonth = month;
    }
  });
  return headers;
}

export function RenewalCalendar({ expenses }: Props) {
  const [selectedISO, setSelectedISO] = useState<string | null>(null);

  const { weeks, today } = useMemo(() => buildGrid(expenses), [expenses]);
  const monthHeaders = useMemo(() => getMonthHeaders(weeks), [weeks]);

  // Default-select the first day with events for an immediate signal
  const firstEventDay = useMemo(() => {
    for (const week of weeks) {
      for (const day of week) {
        if (day.events.length > 0 && day.date >= today) return day.iso;
      }
    }
    return null;
  }, [weeks, today]);

  const totalUpcoming = useMemo(() => {
    let sum = 0;
    weeks.forEach((week) =>
      week.forEach((day) => {
        if (day.date >= today) sum += day.total;
      })
    );
    return sum;
  }, [weeks, today]);

  const activeISO = selectedISO || firstEventDay;
  const selectedDay = activeISO
    ? weeks.flat().find((d) => d.iso === activeISO)
    : null;
  const todayISO = isoOf(today);

  // Day labels: only Mon, Wed, Fri shown (GitHub pattern)
  const dayLabels = ["MON", "", "WED", "", "FRI", "", ""];

  return (
    <>
      <div className="ts-label">Renewals - Next 90 Days</div>
      <section className="ts-card p-6 mb-8">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-[#6b7280]">
            Total upcoming:{" "}
            <span className="text-navy font-semibold">
              {fmtUSD(totalUpcoming)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
            <span>Less</span>
            {[0, 25, 100, 350, 1000, 2000].map((v) => (
              <div
                key={v}
                className="w-3.5 h-3.5 rounded-sm border border-[#e5e7eb]"
                style={intensityStyle(v)}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-flex flex-col">
            {/* Month header row */}
            <div className="relative h-3 mb-1.5" style={{ marginLeft: 32 }}>
              {monthHeaders.map((h) => (
                <div
                  key={`${h.weekIdx}-${h.month}`}
                  className="absolute font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]"
                  style={{ left: `${h.weekIdx * 19}px` }}
                >
                  {h.month}
                </div>
              ))}
            </div>

            {/* Day rows */}
            <div className="flex">
              {/* Day labels column */}
              <div className="flex flex-col mr-2" style={{ width: 24 }}>
                {dayLabels.map((label, i) => (
                  <div
                    key={i}
                    className="font-mono text-[9px] uppercase tracking-wider text-[#9ca3af] flex items-center"
                    style={{ height: 16, marginBottom: 3 }}
                  >
                    {label || "\u00A0"}
                  </div>
                ))}
              </div>

              {/* Weeks columns */}
              <div className="flex">
                {weeks.map((week, wIdx) => (
                  <div
                    key={wIdx}
                    className="flex flex-col"
                    style={{ marginRight: 3 }}
                  >
                    {week.map((day) => {
                      const isPast = day.date < today;
                      const isToday = day.iso === todayISO;
                      const isSelected = day.iso === activeISO;
                      const hasEvents = day.events.length > 0;

                      const baseClasses =
                        "rounded-sm border transition-opacity duration-150";
                      const borderClass = isSelected
                        ? "border-2 border-navy"
                        : isToday
                        ? "border border-navy"
                        : "border border-[#e5e7eb]";
                      const interactionClass = hasEvents
                        ? "cursor-pointer hover:opacity-70"
                        : "cursor-default";
                      const dimClass =
                        isPast && !hasEvents ? "opacity-30" : "";

                      return (
                        <button
                          key={day.iso}
                          type="button"
                          onClick={() =>
                            hasEvents && setSelectedISO(day.iso)
                          }
                          disabled={!hasEvents}
                          title={
                            hasEvents
                              ? `${day.iso}: ${fmtUSD(day.total)} (${
                                  day.events.length
                                } item${day.events.length > 1 ? "s" : ""})`
                              : day.iso
                          }
                          className={`${baseClasses} ${borderClass} ${interactionClass} ${dimClass}`}
                          style={{
                            width: 16,
                            height: 16,
                            marginBottom: 3,
                            ...intensityStyle(day.total),
                          }}
                          aria-label={
                            hasEvents
                              ? `${day.iso}, ${fmtUSD(day.total)} renewing`
                              : day.iso
                          }
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Details panel */}
        {selectedDay && selectedDay.events.length > 0 ? (
          <div className="mt-5 border-t border-[#e5e7eb] pt-4">
            <div className="flex justify-between items-baseline mb-3 flex-wrap gap-2">
              <div>
                <div className="font-semibold text-[14px]">
                  {selectedDay.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#6b7280] mt-1">
                  {selectedDay.events.length} item
                  {selectedDay.events.length > 1 ? "s" : ""} renewing
                </div>
              </div>
              <div className="font-mono text-[18px] font-semibold text-navy">
                {fmtUSD(selectedDay.total)}
              </div>
            </div>
            <div>
              {selectedDay.events
                .slice()
                .sort((a, b) => b.amount - a.amount)
                .map((ev, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-2 border-b border-[#e5e7eb] last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-[13px]">
                        {ev.expense.name}
                      </div>
                      {ev.expense.vendor && (
                        <div className="text-[#6b7280] text-xs">
                          {ev.expense.vendor}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium text-[13px]">
                        {fmtUSD(ev.amount)}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#9ca3af]">
                        {ev.expense.cycle}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 border-t border-[#e5e7eb] pt-4 text-center font-mono text-[11px] uppercase tracking-wider text-[#9ca3af]">
            Click any filled square to see what is renewing
          </div>
        )}
      </section>
    </>
  );
}
