"use client";

import { useRef, useState } from "react";

interface Props {
  onAdded: () => void;
  showToast: (msg: string, error?: boolean) => void;
}

const RATES: Record<string, number> = { USD: 1, SGD: 0.7795, INR: 0.010565 };
const BUSINESSES = ["Tigeri", "Tigerscale OC", "Infrastructure/Equipment"];
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
  const [extracting, setExtracting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [paidBy, setPaidBy] = useState("Russo");
  const [vendor, setVendor] = useState("");
  const [business, setBusiness] = useState("Tigeri");
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

  // Drop/choose a file → auto-read it with Claude and pre-fill every field but "Paid by".
  async function onFile(f: File) {
    setFile(f);
    setExtracting(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/invoices/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.vendor) setVendor(data.vendor);
      if (data.business && BUSINESSES.includes(data.business)) setBusiness(data.business);
      if (data.description) setDescription(data.description);
      if (data.invoiceNo) setInvoiceNo(data.invoiceNo);
      if (data.date) setDateAndPeriod(String(data.date));
      if (data.status) setStatus(data.status);
      if (data.origAmount) setOrigAmount(String(data.origAmount));
      if (data.currency) setCurrency(data.currency);
      if (data.amountUSD) setAmountUSD(String(data.amountUSD));
      else if (data.origAmount && data.currency) recalcUSD(String(data.origAmount), data.currency);
      showToast("Invoice read — just set who paid it");
    } catch (err: any) {
      showToast(`Couldn't auto-read (fill manually): ${err.message}`, true);
    } finally {
      setExtracting(false);
    }
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
      fd.append("business", business);
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
      setFile(null); setVendor(""); setBusiness("Tigeri"); setDescription(""); setInvoiceNo("");
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
          Drop a PDF — it reads the details automatically. You just pick who paid, the business, and reimbursement. Saves to Drive and the sheet.
        </div>
      </div>
      <form onSubmit={submit} className="px-6 pb-6 pt-2">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
            onClick={() => inputRef.current?.click()}
            className="dropzone rounded-lg p-12 mb-5 text-center cursor-pointer"
            style={{
              border: "2px dashed var(--border-strong)",
              background: drag ? "var(--bg-raised)" : "var(--bg-surface)",
            }}
          >
            <input ref={inputRef} type="file" accept="application/pdf,.pdf,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            {file ? (
              <div className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>
                {extracting ? (
                  <><span className="ts-loader mr-2" /> Reading {file.name} …</>
                ) : (
                  <>{file.name} <span className="ts-mono-meta">({(file.size / 1024).toFixed(0)} KB)</span></>
                )}
              </div>
            ) : (
              <div className="text-[15px] font-medium" style={{ color: "var(--text-secondary)" }}>
                Drop a PDF here — I'll read the details automatically
              </div>
            )}
          </div>

          {/* Read-only summary of what the PDF read */}
          {(vendor || amountUSD || invoiceNo) && (
            <div className="rounded-lg p-4 mb-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <div className="ts-label mb-1">From the invoice</div>
              <div className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {vendor || "—"}
                {amountUSD ? <span className="ml-2 font-mono">${Number(amountUSD).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> : null}
              </div>
              <div className="ts-mono-meta mt-1">
                {[description, date, invoiceNo, currency && origAmount && currency !== "USD" ? `${origAmount} ${currency}` : "", status].filter(Boolean).join("  ·  ")}
              </div>
            </div>
          )}

          {/* The only things you choose — everything else is read from the PDF */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="ts-label">Paid by</label>
              <select className="ts-select" value={paidBy} onChange={(e) => setPaidByAndReimbursed(e.target.value)}>
                <option value="Russo">Russo</option>
                <option value="Tim">Tim</option>
              </select>
            </div>
            <div>
              <label className="ts-label">Business</label>
              <select className="ts-select" value={business} onChange={(e) => setBusiness(e.target.value)}>
                {BUSINESSES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
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
