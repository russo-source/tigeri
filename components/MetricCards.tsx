"use client";

import { useMemo } from "react";
import type { Expense } from "@/lib/types";

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

export function MetricCards({ expenses, loading }: Props) {
  const monthlyBurn = useMemo(
    () => expenses.reduce((sum, e) => sum + monthlyEquivalent(e), 0),
    [expenses]
  );

  const annualRunRate = monthlyBurn * 12;

  const oneTimeLogged = useMemo(
    () =>
      expenses
        .filter((e) => e.cycle === "One-time" && e.status === "Active")
        .reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );

  const pendingInfoCount = useMemo(
    () => expenses.filter((e) => e.status === "Pending Info").length,
    [expenses]
  );

  const totalLogged = useMemo(
    () =>
      expenses
        .filter((e) => e.status !== "Pending Info")
        .reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <div className="ts-card p-6">
        <div className="ts-label">Monthly Burn</div>
        <div className="font-mono text-[26px] font-semibold text-navy mt-3">
          {loading ? "-" : fmtUSD(monthlyBurn)}
        </div>
        <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
          Active subscriptions only
        </div>
      </div>

      <div className="ts-card p-6">
        <div className="ts-label">Annual Run Rate</div>
        <div className="font-mono text-[26px] font-semibold text-navy mt-3">
          {loading ? "-" : fmtUSD(annualRunRate)}
        </div>
        <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
          Monthly x 12
        </div>
      </div>

      <div className="ts-card p-6">
        <div className="ts-label">One-time Logged</div>
        <div className="font-mono text-[26px] font-semibold text-navy mt-3">
          {loading ? "-" : fmtUSD(oneTimeLogged)}
        </div>
        <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
          Hardware, top-ups, contractors
        </div>
      </div>

      <div className="ts-card p-6">
        <div className="ts-label">Pending Info</div>
        <div className="font-mono text-[26px] font-semibold text-navy mt-3">
          {loading ? "-" : pendingInfoCount}
        </div>
        <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
          Items awaiting amount
        </div>
      </div>

      <div className="ts-card p-6">
        <div className="ts-label">Total Logged</div>
        <div className="font-mono text-[26px] font-semibold text-navy mt-3">
          {loading ? "-" : fmtUSD(totalLogged)}
        </div>
        <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
          Sum of all bill amounts
        </div>
      </div>
    </div>
  );
}