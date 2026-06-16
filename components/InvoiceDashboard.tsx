"use client";

import { useMemo, useState } from "react";
import type { Invoice } from "@/lib/sheets";
import { StatCard } from "./StatCard";
import { ProfileTabs } from "./ProfileTabs";
import { MonthSelector } from "./MonthSelector";
import { salaryTotal } from "@/lib/salary";

interface Props {
  invoices: Invoice[];
  loading: boolean;
}

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

const VENDOR_COLORS = ["#3537D7", "#55ADE5", "#6764CF", "#1AA9A4", "#7178C2", "#4B49A8", "#9AB6DD", "#8A8FB0"];

function fmtUSD(n: number): string {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthPrefix(label: string): string | null {
  if (label === "All Time") return null;
  const [mon, year] = label.split(" ");
  const mm = MONTHS[mon];
  return mm && year ? `${year}-${mm}` : null;
}

export function InvoiceDashboard({ invoices, loading }: Props) {
  const [profile, setProfile] = useState("all");
  const [month, setMonth] = useState("All Time");

  const filtered = useMemo(() => {
    let list = invoices;
    if (profile !== "all") list = list.filter((i) => i.paidBy === profile);
    const pre = monthPrefix(month);
    if (pre) list = list.filter((i) => i.date.startsWith(pre));
    return list;
  }, [invoices, profile, month]);

  const stats = useMemo(() => {
    let total = 0, tim = 0, russo = 0, owed = 0, pendingCount = 0;
    const byVendor: Record<string, number> = {};
    for (const i of filtered) {
      total += i.amountUSD;
      if (i.paidBy === "Tim") tim += i.amountUSD;
      if (i.paidBy === "Russo") russo += i.amountUSD;
      if (i.reimbursementStatus === "pending") { owed += i.amountUSD; pendingCount++; }
      byVendor[i.vendor] = (byVendor[i.vendor] || 0) + i.amountUSD;
    }
    const vendors = Object.entries(byVendor).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const timCount = filtered.filter((i) => i.paidBy === "Tim").length;
    const russoCount = filtered.filter((i) => i.paidBy === "Russo").length;
    return { total, tim, russo, owed, pendingCount, vendors, timCount, russoCount };
  }, [filtered]);

  const recent = useMemo(
    () => [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6),
    [filtered]
  );

  const vendorMax = stats.vendors.length ? stats.vendors[0][1] : 1;

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-muted)" }}>
            Invoice Overview
          </div>
          <h2 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {profile === "all" ? "All spend" : `${profile}'s spend`}
          </h2>
          <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
            What Tigeri has paid across vendors, and who covered it.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ProfileTabs active={profile} onChange={setProfile} />
          <MonthSelector active={month} onChange={setMonth} />
        </div>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          gradient
          label="Total Spend"
          value={loading ? "—" : fmtUSD(stats.total + (profile === "all" ? salaryTotal() : 0))}
          sub={profile === "all" ? "All invoices + salary" : `${filtered.length} invoices`}
        />
        <StatCard
          label="Paid by Tim"
          value={loading ? "—" : fmtUSD(stats.tim + (profile === "all" ? salaryTotal() : 0))}
          sub={profile === "all" ? `${stats.timCount} invoices + salary` : `${stats.timCount} invoices`}
        />
        <StatCard label="Paid by Russo" value={loading ? "—" : fmtUSD(stats.russo)} sub={`${stats.russoCount} invoices`} />
        <StatCard label="Tim owes Russo" value={loading ? "—" : fmtUSD(stats.owed)} sub={`${stats.pendingCount} pending`} />
      </div>

      {/* Spend by vendor + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="ts-label">Spend by Vendor</div>
          <section className="ts-card p-6">
            {stats.vendors.length === 0 ? (
              <div className="text-center py-10 ts-mono-meta">No spend in this view</div>
            ) : (
              stats.vendors.map(([vendor, val], idx) => (
                <div key={vendor} className="grid grid-cols-[120px_1fr_90px] items-center gap-3 py-2 px-2 -mx-2 rounded-md row-hover">
                  <div className="ts-mono-meta truncate">{vendor}</div>
                  <div className="h-2 rounded-pill overflow-hidden" style={{ background: "var(--bg-raised)" }}>
                    <div className="h-full rounded-pill" style={{ width: `${(val / vendorMax) * 100}%`, background: VENDOR_COLORS[idx % VENDOR_COLORS.length] }} />
                  </div>
                  <div className="font-mono text-[13px] font-medium text-right" style={{ color: "var(--text-primary)" }}>
                    {fmtUSD(val)}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>

        <div>
          <div className="ts-label">Recent Invoices</div>
          <section className="ts-card divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {recent.length === 0 ? (
              <div className="text-center py-10 ts-mono-meta">Nothing here</div>
            ) : (
              recent.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-3 px-5 py-3 row-hover" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="min-w-0">
                    <div className="font-medium text-[14px] truncate" style={{ color: "var(--text-primary)" }}>
                      {i.vendor} <span style={{ color: "var(--text-muted)" }}>· {i.description}</span>
                    </div>
                    <div className="ts-mono-meta">
                      {i.rawDate} · paid by {i.paidBy}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-[14px] shrink-0" style={{ color: "var(--text-primary)" }}>
                    {fmtUSD(i.amountUSD)}
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </>
  );
}
