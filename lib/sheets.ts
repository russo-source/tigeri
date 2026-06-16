// Read the invoice/reimbursement ledger from the Google Sheet.
//
// Read path uses the link-shared CSV export (no credentials needed). When a
// write path is added later, it'll sit behind the same module via OAuth / Apps
// Script — the parsing below is source-agnostic.

const SHEET_ID =
  process.env.GOOGLE_SHEET_ID || "1uSwNbQN-KFV6AOujmaDu5L-Yo_Z6pwSRlK3-MJvMWMU";
const CSV_URL =
  process.env.SHEET_CSV_URL ||
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export type ReimbursementStatus = "settled" | "pending" | "n/a";

export interface Invoice {
  id: string;
  row: number; // 1-based row in the sheet (for future surgical writes)
  paidBy: string; // "Russo" | "Tim"
  reimbursed: string; // raw cell: "" | "Tim" | "Pending"
  reimbursementStatus: ReimbursementStatus;
  vendor: string;
  description: string;
  invoiceNo: string;
  date: string; // ISO YYYY-MM-DD ("" if unparseable)
  rawDate: string; // original e.g. "31 Mar 2026"
  status: string; // free text: Paid, Auto-charged, Balance due…
  origAmount: number;
  currency: string;
  amountUSD: number;
}

export interface ReimbursementSummary {
  total: number;
  byPerson: Record<string, number>;
  count: number;
  owedToRusso: number; // Tim still owes Russo (sum of Russo's pending)
  settledAmount: number; // already reimbursed
  pendingCount: number;
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQ = false, i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function parseMoney(s: string): number {
  const n = parseFloat(String(s ?? "").replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseDate(s: string): string {
  const m = String(s ?? "").trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (!m) return "";
  const mm = MONTHS[m[2].slice(0, 3).toLowerCase()];
  if (!mm) return "";
  return `${m[3]}-${mm}-${m[1].padStart(2, "0")}`;
}

function reimbursementStatus(paidBy: string, reimbursed: string): ReimbursementStatus {
  if (paidBy !== "Russo") return "n/a"; // Tim's own costs need no reimbursement
  if (/pending/i.test(reimbursed)) return "pending";
  if (reimbursed.trim()) return "settled"; // e.g. "Tim" = paid back
  return "n/a";
}

export async function listInvoices(): Promise<Invoice[]> {
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
  const rows = parseCsv(await res.text());

  const hIdx = rows.findIndex((r) => (r[0] || "").trim() === "Paid By");
  if (hIdx === -1) throw new Error('Could not locate header row ("Paid By") in the sheet');

  const out: Invoice[] = [];
  for (let i = hIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const paidBy = (r[0] || "").trim();
    if (paidBy !== "Tim" && paidBy !== "Russo") continue; // skip totals / footnotes / blanks

    const reimbursed = (r[1] || "").trim();
    const vendor = (r[2] || "").trim();
    const description = (r[3] || "").trim();
    const invoiceNo = (r[4] || "").trim();
    const rawDate = (r[5] || "").trim();
    const status = (r[6] || "").trim();
    const origAmount = parseMoney(r[7]);
    const currency = (r[8] || "").trim();
    const amountUSD = parseMoney(r[9]);

    const idBase = `${invoiceNo && invoiceNo !== "—" ? invoiceNo : vendor}|${rawDate}|${amountUSD}`;
    out.push({
      id: idBase.replace(/\s+/g, "_"),
      row: i + 1,
      paidBy,
      reimbursed,
      reimbursementStatus: reimbursementStatus(paidBy, reimbursed),
      vendor,
      description,
      invoiceNo,
      date: parseDate(rawDate),
      rawDate,
      status,
      origAmount,
      currency,
      amountUSD,
    });
  }
  return out;
}

const WEBAPP_URL = process.env.SHEETS_WEBAPP_URL;
const WEBAPP_SECRET = process.env.SHEETS_WEBAPP_SECRET;

// Write the "Reimbursed" cell for one invoice row via the Apps Script web app.
// Allowed values mirror the script's guardrail: "" | "Tim" | "Pending".
export async function markReimbursed(row: number, reimbursed: string): Promise<void> {
  if (!WEBAPP_URL || !WEBAPP_SECRET) {
    throw new Error("Write endpoint not configured (set SHEETS_WEBAPP_URL / SHEETS_WEBAPP_SECRET)");
  }
  const res = await fetch(WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: WEBAPP_SECRET, row, reimbursed }),
    // Apps Script 302-redirects to a result URL; fetch follows it as GET (spec).
    redirect: "follow",
    cache: "no-store",
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data?.error || `Write failed: HTTP ${res.status}`);
  }
}

export function summarize(invoices: Invoice[]): ReimbursementSummary {
  const byPerson: Record<string, number> = {};
  let total = 0, owedToRusso = 0, settledAmount = 0, pendingCount = 0;
  for (const inv of invoices) {
    total += inv.amountUSD;
    byPerson[inv.paidBy] = (byPerson[inv.paidBy] || 0) + inv.amountUSD;
    if (inv.reimbursementStatus === "pending") { owedToRusso += inv.amountUSD; pendingCount++; }
    if (inv.reimbursementStatus === "settled") settledAmount += inv.amountUSD;
  }
  return { total, byPerson, count: invoices.length, owedToRusso, settledAmount, pendingCount };
}
