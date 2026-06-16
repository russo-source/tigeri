"use client";

import { useRef, useState } from "react";

interface Props {
  onAdded: () => void;
  showToast: (msg: string, error?: boolean) => void;
}

const RATES: Record<string, number> = { USD: 1, SGD: 0.7795, INR: 0.010565 };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function fmtSheetDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d} ${MON[+m - 1]} ${y}`;
}
function periodFor(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-").map(Number);
  const m = parts[1], d = parts[2];
  const a = d <= 15 ? m - 1 : m;
  const name = (mm: number) => FULL[((mm - 1) % 12 + 12) % 12];
  return `${name(a)}-${name(a + 1)}`;
}

export function AddInvoice({ onAdded, showToast }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [paidBy, setPaidBy] = useState("Russo");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState("");
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState("Paid");
  const [origAmount, setOrigAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amountUSD, setAmountUSD] = useState("");
  const [reimbursed, setReimbursed] = useState("Pending");

  function setDateAndPeriod(iso: string) {
    setDate(iso);
    setPeriod(periodFor(iso));
  }
  function recalcUSD(amt: string, cur: string) {
    const v = parseFloat(amt);
    if (!isNaN(v)) setAmountUSD((v * (RATES[cur] ?? 1)).toFixed(2));
  }
  function setPaidByAndReimbursed(v: string) {
    setPaidBy(v);
    setReimbursed(v === "Russo" ? "Pending" : "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return showToast("Drop or choose a PDF first", true);
    if (!vendor || !date) return showToast("Vendor and date are required", true);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("paidBy", paidBy);
      fd.append("period", period);
      fd.append("vendor", vendor);
      fd.append("description", description);
      fd.append("invoiceNo", invoiceNo);
      fd.append("date", fmtSheetDate(date));
      fd.append("status", status);
      fd.append("origAmount", origAmount || "0");
      fd.append("currency", currency);
      fd.append("amountUSD", amountUSD || "0");
      fd.append("reimbursed", reimbursed);
      const res = await fetch("/api/invoices/add", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      showToast("Invoice added to Drive + sheet");
      setFile(null); setVendor(""); setDescription(""); setInvoiceNo("");
      setOrigAmount(""); setAmountUSD("");
      onAdded();
    } catch (err: any) {
      showToast(`Add failed: ${err.message}`, true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ts-card mb-6">
      <div className="px-6 pt-6 pb-2">
        <div className="text-[20px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Add invoice
        </div>
        <div className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>
          Drop a PDF and fill the details — it saves to Drive (Person / Period / Vendor) and adds a row to the sheet.
        </div>
      </div>
      <form onSubmit={submit} className="px-6 pb-6 pt-2">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
            onClick={() => inputRef.current?.click()}
            className="dropzone rounded-lg p-12 mb-5 text-center cursor-pointer"
            style={{
              border: "2px dashed var(--border-strong)",
              background: drag ? "var(--bg-raised)" : "var(--bg-surface)",
            }}
          >
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
            {file ? (
              <div className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>
                {file.name} <span className="ts-mono-meta">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
            ) : (
              <div className="text-[15px] font-medium" style={{ color: "var(--text-secondary)" }}>Drop a PDF here, or click to choose</div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="ts-label">Paid by</label>
              <select className="ts-select" value={paidBy} onChange={(e) => setPaidByAndReimbursed(e.target.value)}>
                <option value="Russo">Russo</option>
                <option value="Tim">Tim</option>
              </select>
            </div>
            <div>
              <label className="ts-label">Vendor</label>
              <input className="ts-input" value={vendor} onChange={(e) => setVendor(e.target.value)} required placeholder="Anthropic" />
            </div>
            <div className="md:col-span-2">
              <label className="ts-label">Description</label>
              <input className="ts-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="API credit (one-time)" />
            </div>
            <div>
              <label className="ts-label">Invoice #</label>
              <input className="ts-input" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </div>
            <div>
              <label className="ts-label">Date</label>
              <input className="ts-input" type="date" value={date} onChange={(e) => setDateAndPeriod(e.target.value)} required />
            </div>
            <div>
              <label className="ts-label">Period (Drive folder)</label>
              <input className="ts-input" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="May-June" />
            </div>
            <div>
              <label className="ts-label">Status</label>
              <input className="ts-input" value={status} onChange={(e) => setStatus(e.target.value)} />
            </div>
            <div>
              <label className="ts-label">Orig. amount</label>
              <input className="ts-input" type="number" step="0.01" value={origAmount} onChange={(e) => { setOrigAmount(e.target.value); recalcUSD(e.target.value, currency); }} />
            </div>
            <div>
              <label className="ts-label">Currency</label>
              <select className="ts-select" value={currency} onChange={(e) => { setCurrency(e.target.value); recalcUSD(origAmount, e.target.value); }}>
                <option>USD</option>
                <option>INR</option>
                <option>SGD</option>
              </select>
            </div>
            <div>
              <label className="ts-label">Amount (USD)</label>
              <input className="ts-input" type="number" step="0.01" value={amountUSD} onChange={(e) => setAmountUSD(e.target.value)} />
            </div>
            <div>
              <label className="ts-label">Reimbursed</label>
              <select className="ts-select" value={reimbursed} onChange={(e) => setReimbursed(e.target.value)}>
                <option value="">—</option>
                <option value="Pending">Pending</option>
                <option value="Tim">Tim (settled)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button type="submit" className="ts-btn ts-btn-primary" disabled={submitting}>
              {submitting ? <><span className="ts-loader mr-2" /> Uploading</> : "Add to Drive + sheet"}
            </button>
          </div>
        </form>
    </section>
  );
}
