"use client";

import { useState, useEffect, useMemo } from "react";
import type { Expense } from "@/lib/types";

interface Props {
  expenses: Expense[];
}

const STORAGE_KEY = "tigeri-cash-balance-v1";
const FORECAST_MONTHS = 24;
const NAVY = "#040273";
const ERROR_RED = "#dc2626";
const WARNING = "#d97706";

function fmtUSD(n: number): string {
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtUSDShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `$${(n / 1000).toFixed(0)}K`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function fmtRunway(months: number): string {
  if (months === Infinity) return "Infinite";
  if (months < 1) return "< 1 mo";
  if (months > 60) return "5+ years";
  if (months >= 12) {
    const years = months / 12;
    return `${years.toFixed(1)} yrs`;
  }
  return `${months.toFixed(1)} mo`;
}

function computeMonthlyBurn(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => {
    if (e.status !== "Active") return sum;
    if (e.cycle === "Monthly") return sum + (e.amount || 0);
    if (e.cycle === "Annual") return sum + (e.amount || 0) / 12;
    return sum;
  }, 0);
}

export function RunwayForecast({ expenses }: Props) {
  const [cash, setCash] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [draftCash, setDraftCash] = useState<string>("");
  const [hovered, setHovered] = useState<number | null>(null);

  // Load saved value on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const n = parseFloat(saved);
      if (!isNaN(n)) setCash(n);
    }
  }, []);

  const burn = useMemo(() => computeMonthlyBurn(expenses), [expenses]);

  const runwayMonths = useMemo(() => {
    if (burn <= 0) return Infinity;
    if (cash <= 0) return 0;
    return cash / burn;
  }, [cash, burn]);

  // Generate monthly forecast points
  const points = useMemo(() => {
    const arr: { month: number; balance: number }[] = [];
    for (let i = 0; i <= FORECAST_MONTHS; i++) {
      const balance = Math.max(0, cash - burn * i);
      arr.push({ month: i, balance });
    }
    return arr;
  }, [cash, burn]);

  function saveCash() {
    const val = parseFloat(draftCash);
    if (isNaN(val) || val < 0) {
      setEditing(false);
      return;
    }
    setCash(val);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(val));
    }
    setEditing(false);
  }

  function startEdit() {
    setDraftCash(cash > 0 ? String(cash) : "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  // SVG layout
  const width = 900;
  const height = 260;
  const padding = { top: 24, right: 32, bottom: 36, left: 72 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxY = cash > 0 ? cash * 1.05 : 1000;
  const xScale = (m: number) => padding.left + (m / FORECAST_MONTHS) * chartW;
  const yScale = (b: number) => padding.top + chartH - (b / maxY) * chartH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.month).toFixed(2)} ${yScale(p.balance).toFixed(2)}`)
    .join(" ");

  const areaPath = cash > 0
    ? `${linePath} L ${xScale(FORECAST_MONTHS).toFixed(2)} ${yScale(0).toFixed(2)} L ${xScale(0).toFixed(2)} ${yScale(0).toFixed(2)} Z`
    : "";

  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY];
  const xTicks = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  // Color of runway value based on urgency
  const runwayColor =
    runwayMonths < 6
      ? ERROR_RED
      : runwayMonths < 12
      ? WARNING
      : NAVY;

  const showChart = cash > 0 && burn > 0;
  const hoveredPoint = hovered !== null ? points[hovered] : null;

  return (
    <>
      <div className="ts-label">Cash Runway Forecast</div>
      <section className="ts-card p-6 mb-8">
        {/* Top row: cash, burn, runway */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Cash on Hand */}
          <div>
            <div className="ts-label">Cash on Hand</div>
            {editing ? (
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="ts-input flex-1"
                  value={draftCash}
                  onChange={(e) => setDraftCash(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCash();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  placeholder="e.g. 50000"
                  autoFocus
                />
                <button
                  type="button"
                  className="ts-btn ts-btn-primary"
                  onClick={saveCash}
                  style={{ padding: "0 16px" }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="ts-btn ts-btn-ghost"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <div className="flex items-baseline gap-3">
                  <div className="font-mono text-[26px] font-semibold text-navy">
                    {fmtUSD(cash)}
                  </div>
                  <button
                    type="button"
                    className="ts-btn ts-btn-ghost"
                    onClick={startEdit}
                    style={{ padding: "4px 8px", fontSize: "11px" }}
                  >
                    {cash > 0 ? "EDIT" : "ENTER VALUE"}
                  </button>
                </div>
                <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
                  Saved in this browser only
                </div>
              </div>
            )}
          </div>

          {/* Monthly Burn */}
          <div>
            <div className="ts-label">Monthly Burn</div>
            <div className="font-mono text-[26px] font-semibold text-navy mt-3">
              {fmtUSD(burn)}
            </div>
            <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
              Active recurring only
            </div>
          </div>

          {/* Runway */}
          <div>
            <div className="ts-label">Runway</div>
            <div
              className="font-mono text-[26px] font-semibold mt-3"
              style={{ color: runwayColor }}
            >
              {fmtRunway(runwayMonths)}
            </div>
            <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-1">
              {runwayMonths === Infinity
                ? "No active expenses"
                : cash <= 0
                ? "Enter cash to compute"
                : runwayMonths < 6
                ? "Critical"
                : runwayMonths < 12
                ? "Warning"
                : "Healthy"}
            </div>
          </div>
        </div>

        {/* Chart */}
        {showChart ? (
          <div className="relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full"
              preserveAspectRatio="xMidYMid meet"
              style={{ maxHeight: "320px" }}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Horizontal grid lines */}
              {yTicks.map((t, i) => (
                <line
                  key={i}
                  x1={padding.left}
                  y1={yScale(t)}
                  x2={width - padding.right}
                  y2={yScale(t)}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Y-axis labels */}
              {yTicks.map((t, i) => (
                <text
                  key={i}
                  x={padding.left - 10}
                  y={yScale(t) + 4}
                  textAnchor="end"
                  fontFamily='"IBM Plex Mono", monospace'
                  fontSize="10"
                  fill="#6b7280"
                  letterSpacing="0.05em"
                >
                  {fmtUSDShort(t)}
                </text>
              ))}

              {/* X-axis labels */}
              {xTicks.map((m) => (
                <text
                  key={m}
                  x={xScale(m)}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontFamily='"IBM Plex Mono", monospace'
                  fontSize="10"
                  fill="#6b7280"
                  letterSpacing="0.05em"
                >
                  {m === 0 ? "NOW" : `+${m}M`}
                </text>
              ))}

              {/* Area fill */}
              <path d={areaPath} fill="rgba(4, 2, 115, 0.08)" />

              {/* Line */}
              <path d={linePath} fill="none" stroke={NAVY} strokeWidth="2" />

              {/* Runway end vertical marker */}
              {runwayMonths < FORECAST_MONTHS && runwayMonths > 0 && (
                <g>
                  <line
                    x1={xScale(runwayMonths)}
                    y1={padding.top}
                    x2={xScale(runwayMonths)}
                    y2={padding.top + chartH}
                    stroke={ERROR_RED}
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <rect
                    x={xScale(runwayMonths) - 38}
                    y={padding.top}
                    width="76"
                    height="16"
                    fill={ERROR_RED}
                  />
                  <text
                    x={xScale(runwayMonths)}
                    y={padding.top + 11}
                    textAnchor="middle"
                    fontFamily='"IBM Plex Mono", monospace'
                    fontSize="10"
                    fontWeight="500"
                    fill="#ffffff"
                    letterSpacing="0.05em"
                  >
                    RUNWAY END
                  </text>
                </g>
              )}

              {/* Today marker dot */}
              <circle cx={xScale(0)} cy={yScale(cash)} r="5" fill={NAVY} />
              <circle cx={xScale(0)} cy={yScale(cash)} r="9" fill="none" stroke={NAVY} strokeWidth="1" opacity="0.3" />

              {/* Hover hit-area for each month */}
              {points.map((p, i) => (
                <rect
                  key={i}
                  x={xScale(p.month) - chartW / FORECAST_MONTHS / 2}
                  y={padding.top}
                  width={chartW / FORECAST_MONTHS}
                  height={chartH}
                  fill="transparent"
                  onMouseEnter={() => setHovered(i)}
                  style={{ cursor: "crosshair" }}
                />
              ))}

              {/* Hover indicator */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={xScale(hoveredPoint.month)}
                    y1={padding.top}
                    x2={xScale(hoveredPoint.month)}
                    y2={padding.top + chartH}
                    stroke={NAVY}
                    strokeWidth="1"
                    strokeDasharray="2,3"
                    opacity="0.5"
                  />
                  <circle
                    cx={xScale(hoveredPoint.month)}
                    cy={yScale(hoveredPoint.balance)}
                    r="4"
                    fill={NAVY}
                  />
                </g>
              )}
            </svg>

            {/* Hover tooltip */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none bg-navy text-white px-3 py-2 rounded-sm font-mono text-[11px] uppercase tracking-wider"
                style={{
                  left: `${(xScale(hoveredPoint.month) / width) * 100}%`,
                  top: 0,
                  transform: "translateX(-50%)",
                }}
              >
                <div>
                  {hoveredPoint.month === 0 ? "Now" : `+${hoveredPoint.month} months`}
                </div>
                <div className="text-[14px] font-semibold mt-0.5">
                  {fmtUSD(hoveredPoint.balance)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 ts-mono-meta">
            {cash <= 0
              ? "Enter cash on hand above to see runway forecast"
              : "No active recurring expenses to project burn against"}
          </div>
        )}

        {/* Footnote */}
        {showChart && (
          <div className="font-mono text-[10px] text-[#9ca3af] uppercase tracking-wider mt-3 text-center">
            Linear projection at current burn rate. Excludes one-time expenses, revenue, and future hires.
          </div>
        )}
      </section>
    </>
  );
}
