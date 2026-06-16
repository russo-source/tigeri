"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Invoice } from "@/lib/sheets";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { InvoiceDashboard } from "@/components/InvoiceDashboard";
import { InvoicesTable } from "@/components/InvoicesTable";
import { AddInvoice } from "@/components/AddInvoice";
import { ReimbursementsView } from "@/components/ReimbursementsView";
import { SalaryView } from "@/components/SalaryView";
import { ChatBar } from "@/components/ChatBar";
import { Toast } from "@/components/Toast";

const VIEWS = ["dashboard", "invoices", "reimbursements", "salary", "settings", "gethelp"];

function Placeholder({ title }: { title: string }) {
  return (
    <>
      <div className="ts-label">{title}</div>
      <section className="ts-card p-12 text-center ts-mono-meta">Coming soon</section>
    </>
  );
}

function DashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams?.get("view") || "dashboard";
  const activeView = VIEWS.includes(viewParam) ? viewParam : "dashboard";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  const showToast = useCallback((msg: string, error?: boolean) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadInvoices = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setStatus("loading");
      setErrorBanner(null);
      try {
        const res = await fetch("/api/invoices", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setInvoices(data.invoices || []);
        setStatus("ok");
        setSyncedAt(new Date());
      } catch (err: any) {
        setStatus("error");
        setErrorBanner(`Could not load the sheet: ${err.message}`);
        showToast("Sync failed", true);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadInvoices(false);
  }, [loadInvoices]);

  function changeView(id: string) {
    router.push(`/?view=${id}`);
  }

  async function markSettled(row: number) {
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row, reimbursed: "Tim" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      // Optimistic local update, then re-sync from the sheet.
      setInvoices((prev) =>
        prev.map((i) => (i.row === row ? { ...i, reimbursed: "Tim", reimbursementStatus: "settled" } : i))
      );
      showToast("Marked reimbursed in the sheet");
      loadInvoices(true);
    } catch (err: any) {
      showToast(`Failed: ${err.message}`, true);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onChange={changeView} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar syncedAt={syncedAt} status={status} />
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-8 py-8">
          <ChatBar />
          {errorBanner && (
            <div
              className="rounded-md px-4 py-3 mb-6 text-[13px]"
              style={{ background: "rgba(192, 38, 60, 0.08)", border: "1px solid var(--status-error)", color: "var(--status-error)" }}
            >
              {errorBanner}
            </div>
          )}

          {activeView === "dashboard" && <InvoiceDashboard invoices={invoices} loading={status === "loading"} />}
          {activeView === "invoices" && (
            <>
              <AddInvoice onAdded={() => loadInvoices(true)} showToast={showToast} />
              <InvoicesTable invoices={invoices} />
            </>
          )}
          {activeView === "reimbursements" && <ReimbursementsView invoices={invoices} onMarkSettled={markSettled} />}
          {activeView === "salary" && <SalaryView />}
          {activeView === "settings" && <Placeholder title="Settings" />}
          {activeView === "gethelp" && <Placeholder title="Get Help" />}
        </main>
      </div>
      <Toast message={toast?.msg || null} isError={toast?.error} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-[12px] uppercase tracking-wider text-ink-500">
          Loading
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
