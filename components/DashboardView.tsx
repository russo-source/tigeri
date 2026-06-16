"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/lib/types";
import { ProfileTabs } from "./ProfileTabs";
import { MonthSelector } from "./MonthSelector";
import { StatCard } from "./StatCard";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { TopServices } from "./TopServices";
import { UpcomingRenewals } from "./UpcomingRenewals";

interface Props {
  expenses: Expense[];
  loading: boolean;
  operatingCostsOnly?: boolean;
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

function monthlyEq(e: Expense): number {
  if (e.status !== "Active") return 0;
  if (e.cycle === "Monthly") return e.amount || 0;
  if (e.cycle === "Annual") return (e.amount || 0) / 12;
  return 0;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function DashboardView({ expenses, loading, operatingCostsOnly = false }: Props) {
  const [profile, setProfile] = useState("all");
  const [month, setMonth] = useState("Jun 2026");

  const filtered = useMemo(() => {
    let list = operatingCostsOnly
      ? expenses.filter((e) => e.category === "Salaries")
      : expenses.filter((e) => e.category !== "Salaries");

    if (profile !== "all") {
      list = list.filter((e) => e.paidBy === profile);
    }

    // Crude month filter until Notion has a Period property:
    // recurring bills always count; one-time only if the month prefix is in the name.
    if (month !== "All Time") {
      const prefix = month.split(" ")[0].toLowerCase();
      list = list.filter(
        (e) =>
          e.cycle === "Monthly" ||
          e.cycle === "Annual" ||
          e.name.toLowerCase().includes(prefix)
      );
    }

    return list;
  }, [expenses, operatingCostsOnly, profile, month]);

  const stats = useMemo(() => {
    const monthlySpend = filtered.reduce((s, e) => s + monthlyEq(e), 0);
    const activeServices = filtered.filter(
      (e) =>
        e.status === "Active" &&
        (e.cycle === "Monthly" || e.cycle === "Annual")
    ).length;
    const oneTime = filtered.filter(
      (e) => e.status === "Active" && e.cycle === "One-time"
    ).length;

    const byCat: Record<string, number> = {};
    filtered.forEach((e) => {
      const m = monthlyEq(e);
      if (m > 0) byCat[e.category] = (byCat[e.category] || 0) + m;
    });
    const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const topCategory = catEntries[0] || null;

    return { monthlySpend, activeServices, oneTime, topCategory };
  }, [filtered]);

  const recentActivity = useMemo(() => {
    return filtered
      .filter((e) => !!e.renewal)
      .map((e) => ({ e, date: parseISO(e.renewal) }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [filtered]);

  const eyebrow = operatingCostsOnly ? "Operations" : "Live Overview";
  const heading = operatingCostsOnly
    ? "Operating Costs"
    : profile === "all"
    ? "Welcome to Tigeri"
    : `Welcome back, ${profile}`;
  const subtitle = operatingCostsOnly
    ? "Salaries and overhead, separated from your tooling spend."
    : "Here's where Tigeri's money is going.";

  const topCatPct =
    stats.topCategory && stats.monthlySpend > 0
      ? Math.round((stats.topCategory[1] / stats.monthlySpend) * 100)
      : 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <div
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            {eyebrow}
          </div>
          <h2
            className="text-[28px] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {heading}
          </h2>
          <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        </div>
        {!operatingCostsOnly && (
          <div className="flex items-center gap-3 flex-wrap">
            <ProfileTabs active={profile} onChange={setProfile} />
            <MonthSelector active={month} onChange={setMonth} />
          </div>
        )}
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          gradient
          label="Monthly Spend"
          value={loading ? "—" : fmtUSD(stats.monthlySpend)}
          sub={`${filtered.length} entries`}
        />
        <StatCard
          label="Active Services"
          value={loading ? "—" : stats.activeServices}
          sub={`${stats.oneTime} one-time bills`}
        />
        <StatCard
          label="Top Category"
          value={loading ? "—" : stats.topCategory ? stats.topCategory[0] : "—"}
          sub={
            stats.topCategory
              ? `${fmtUSD(stats.topCategory[1])} · ${topCatPct}% of spend`
              : "No spend yet"
          }
        />
      </div>

      {/* Category + Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="ts-label">Spend by Category</div>
          <CategoryBreakdown expenses={filtered} />
        </div>
        <div>
          <div className="ts-label">Top 5 Services This Month</div>
          <TopServices expenses={filtered} />
        </div>
      </div>

      {/* Renewals + Recent Activity */}
      {!operatingCostsOnly && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="ts-label">Upcoming Renewals</div>
            <UpcomingRenewals expenses={expenses} />
          </div>
          <div>
            <div className="ts-label">Recent Activity</div>
            {recentActivity.length === 0 ? (
              <div className="ts-card p-6 text-center ts-mono-meta">
                No recent activity
              </div>
            ) : (
              <div
                className="ts-card divide-y"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                {recentActivity.map(({ e, date }) => (
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
                      <div className="ts-mono-meta">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
