"use client";

import { StatCard } from "./StatCard";
import { SALARY } from "@/lib/salary";

function fmtUSD(n: number): string {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SalaryView() {
  const monthly = 2000;
  const paid = SALARY.filter((s) => s.status === "Paid");
  const pending = SALARY.filter((s) => s.status === "Pending");
  const paidTotal = paid.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = pending.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="mb-8">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-muted)" }}>
          Compensation
        </div>
        <h2 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Salary</h2>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          $2,000 / month to Russo, paid in USDC on the 15th.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard gradient label="Monthly Salary" value={fmtUSD(monthly)} sub="USDC · Russo · on the 15th" />
        <StatCard label="Paid to date" value={fmtUSD(paidTotal)} sub={`${paid.length} payment${paid.length !== 1 ? "s" : ""}`} />
        <StatCard
          label="Outstanding"
          value={fmtUSD(pendingTotal)}
          sub={pending.length ? `${pending.map((p) => p.month.split(" ")[0]).join(", ")} due` : "All settled"}
        />
      </div>

      <div className="ts-label">Payments</div>
      <section className="ts-card divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {SALARY.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-5 py-4 row-hover" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="min-w-0">
              <div className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>{s.month} salary</div>
              <div className="ts-mono-meta">{s.date} · {s.currency} · Russo</div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="font-mono font-semibold text-[14px]" style={{ color: "var(--text-primary)" }}>{fmtUSD(s.amount)}</span>
              <span className={`ts-badge ${s.status === "Paid" ? "ts-badge-active" : "ts-badge-pending"}`}>
                {s.status === "Pending" ? "Pending / Due" : "Paid"}
              </span>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
