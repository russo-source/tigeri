"use client";

import { useMemo } from "react";
import type { Invoice } from "@/lib/sheets";
import { netPayer } from "@/lib/sheets";
import { StatCard } from "./StatCard";

interface Props {
  invoices: Invoice[];
}

const COLORS = ["#3537D7", "#1AA9A4", "#55ADE5", "#6764CF", "#7178C2", "#4B49A8", "#9AB6DD", "#8A8FB0"];

function fmtUSD(n: number): string {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Biz {
  name: string;
  total: number;
  count: number;
  tim: number;
  russo: number;
  vendors: [string, number][];
}

export function BusinessesView({ invoices }: Props) {
  const businesses = useMemo<Biz[]>(() => {
    const map: Record<string, { total: number; count: number; tim: number; russo: number; byVendor: Record<string, number> }> = {};
    for (const i of invoices) {
      const raw = (i.business || "").trim();
      const name = !raw || raw === "-" ? "Infrastructure/Equipment" : raw;
      if (!map[name]) map[name] = { total: 0, count: 0, tim: 0, russo: 0, byVendor: {} };
      const m = map[name];
      m.total += i.amountUSD;
      m.count++;
      if (netPayer(i) === "Tim") m.tim += i.amountUSD;
      else m.russo += i.amountUSD;
      m.byVendor[i.vendor] = (m.byVendor[i.vendor] || 0) + i.amountUSD;
    }
    return Object.entries(map)
      .map(([name, m]) => ({
        name,
        total: m.total,
        count: m.count,
        tim: m.tim,
        russo: m.russo,
        vendors: Object.entries(m.byVendor).sort((a, b) => b[1] - a[1]).slice(0, 6),
      }))
      .sort((a, b) => b.total - a.total);
  }, [invoices]);

  const grandTotal = businesses.reduce((s, b) => s + b.total, 0);
  const max = businesses.length ? businesses[0].total : 1;

  return (
    <>
      <div className="mb-8">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] mb-2" style={{ color: "var(--text-muted)" }}>
          Allocation
        </div>
        <h2 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Businesses</h2>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          Invoice spend split across your businesses (excludes salary).
        </p>
      </div>

      {/* Per-business stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {businesses.map((b, idx) => (
          <StatCard
            key={b.name}
            gradient={idx === 0}
            label={b.name}
            value={fmtUSD(b.total)}
            sub={`${b.count} invoices · ${grandTotal ? Math.round((b.total / grandTotal) * 100) : 0}% of spend`}
          />
        ))}
      </div>

      {/* Spend by business bars */}
      <div className="ts-label">Spend by Business</div>
      <section className="ts-card p-6 mb-8">
        {businesses.length === 0 ? (
          <div className="text-center py-10 ts-mono-meta">No invoices yet</div>
        ) : (
          businesses.map((b, idx) => (
            <div key={b.name} className="grid grid-cols-[96px_1fr_80px] sm:grid-cols-[140px_1fr_100px] items-center gap-2 sm:gap-3 py-2 px-2 -mx-2 rounded-md row-hover">
              <div className="ts-mono-meta truncate">{b.name}</div>
              <div className="h-2.5 sm:h-2 rounded-pill overflow-hidden" style={{ background: "var(--bg-raised)" }}>
                <div className="h-full rounded-pill" style={{ width: `${(b.total / max) * 100}%`, background: COLORS[idx % COLORS.length] }} />
              </div>
              <div className="font-mono text-[12px] sm:text-[13px] font-medium text-right" style={{ color: "var(--text-primary)" }}>{fmtUSD(b.total)}</div>
            </div>
          ))
        )}
      </section>

      {/* Per-business detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {businesses.map((b, idx) => {
          const vmax = b.vendors.length ? b.vendors[0][1] : 1;
          return (
            <section key={b.name} className="ts-card p-6 lift">
              <div className="flex items-baseline justify-between mb-1">
                <div className="font-semibold text-[16px]" style={{ color: "var(--text-primary)" }}>{b.name}</div>
                <div className="font-mono font-semibold text-[18px]" style={{ color: "var(--text-primary)" }}>{fmtUSD(b.total)}</div>
              </div>
              <div className="ts-mono-meta mb-4">
                {b.count} invoices · Tim {fmtUSD(b.tim)} · Russo {fmtUSD(b.russo)}
              </div>
              {b.vendors.map(([vendor, val]) => (
                <div key={vendor} className="grid grid-cols-[80px_1fr_72px] sm:grid-cols-[110px_1fr_84px] items-center gap-2 sm:gap-3 py-1.5">
                  <div className="ts-mono-meta truncate">{vendor}</div>
                  <div className="h-2 sm:h-1.5 rounded-pill overflow-hidden" style={{ background: "var(--bg-raised)" }}>
                    <div className="h-full rounded-pill" style={{ width: `${(val / vmax) * 100}%`, background: COLORS[idx % COLORS.length] }} />
                  </div>
                  <div className="font-mono text-[12px] text-right" style={{ color: "var(--text-secondary)" }}>{fmtUSD(val)}</div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
