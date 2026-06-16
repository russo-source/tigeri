"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Expense, ExpenseInput } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { DashboardView } from "@/components/DashboardView";
import { ExpensesTab } from "@/components/ExpensesTab";
import { RenewalsTab } from "@/components/RenewalsTab";
import { ForecastTab } from "@/components/ForecastTab";
import { InboxTab } from "@/components/InboxTab";
import { Toast } from "@/components/Toast";

const VIEWS = [
  "dashboard",
  "services",
  "renewals",
  "forecast",
  "operations",
  "reimbursements",
  "inbox",
];

const REIMBURSEMENTS_URL =
  "https://www.notion.so/2eaa35e1b3df4119af4dc5ed0e54f7c1";

function monthlyEquivalent(e: Expense): number {
  if (e.status !== "Active") return 0;
  if (e.cycle === "Monthly") return e.amount || 0;
  if (e.cycle === "Annual") return (e.amount || 0) / 12;
  return 0;
}

function ReimbursementsPlaceholder() {
  return (
    <>
      <div className="ts-label">Reimbursements</div>
      <section className="ts-card p-12 text-center">
        <div className="max-w-[480px] mx-auto">
          <div
            className="font-mono text-[11px] uppercase tracking-wider mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Tracked in Notion
          </div>
          <h2
            className="text-[22px] font-semibold mb-4 tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Reimbursements live in Notion
          </h2>
          <p
            className="text-[14px] leading-relaxed mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            Team reimbursement requests and approvals are managed in the shared
            Notion database. Open it to submit or review a claim.
          </p>
          <a
            href={REIMBURSEMENTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ts-btn ts-btn-primary inline-block"
          >
            Open in Notion
          </a>
        </div>
      </section>
    </>
  );
}

function DashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams?.get("view") || "dashboard";
  const activeView = VIEWS.includes(viewParam) ? viewParam : "dashboard";

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  const showToast = useCallback((msg: string, error?: boolean) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadExpenses = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setStatus("loading");
      setErrorBanner(null);

      try {
        const res = await fetch("/api/expenses", { cache: "no-store" });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setExpenses(data.expenses || []);
        setStatus("ok");
        setSyncedAt(new Date());
      } catch (err: any) {
        setStatus("error");
        setErrorBanner(`Could not load from Notion: ${err.message}`);
        showToast("Sync failed", true);
      } finally {
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadExpenses(false);
  }, [loadExpenses]);

  function changeView(id: string) {
    router.push(`/?view=${id}`);
  }

  async function handleSubmit(input: ExpenseInput, editingId: string | null) {
    try {
      if (editingId) {
        const res = await fetch(`/api/expenses/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setExpenses((prev) =>
          prev.map((e) => (e.id === editingId ? data.expense : e))
        );
        showToast("Updated in Notion");
      } else {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setExpenses((prev) => [data.expense, ...prev]);
        showToast("Added to Notion");
      }
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`, true);
      throw err;
    }
  }

  async function handleCancel(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setExpenses((prev) => prev.map((e) => (e.id === id ? data.expense : e)));
      showToast("Marked Cancelled in Notion");
    } catch (err: any) {
      showToast(`Cancel failed: ${err.message}`, true);
    }
  }

  function handleExport() {
    const headers = [
      "Name",
      "Vendor",
      "Category",
      "Account",
      "Paid By",
      "Amount",
      "Cycle",
      "MonthlyEquivalent",
      "Renewal",
      "Status",
      "Notes",
    ];
    const rows = expenses.map((e) => [
      e.name,
      e.vendor,
      e.category,
      e.account,
      e.paidByName || e.paidBy || "",
      e.amount,
      e.cycle,
      monthlyEquivalent(e).toFixed(2),
      e.renewal,
      e.status,
      (e.notes || "").replace(/\n/g, " "),
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((c) => {
            const s = String(c == null ? "" : c);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tigeri-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onChange={changeView} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar syncedAt={syncedAt} status={status} />
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-8 py-8">
          {errorBanner && (
            <div
              className="rounded-md px-4 py-3 mb-6 text-[13px]"
              style={{
                background: "rgba(192, 38, 60, 0.08)",
                border: "1px solid var(--status-error)",
                color: "var(--status-error)",
              }}
            >
              {errorBanner}
            </div>
          )}

          {activeView === "dashboard" && (
            <DashboardView expenses={expenses} loading={status === "loading"} />
          )}
          {activeView === "services" && (
            <ExpensesTab
              expenses={expenses}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              onRefresh={() => loadExpenses(true)}
              refreshing={refreshing}
              onExport={handleExport}
            />
          )}
          {activeView === "renewals" && <RenewalsTab expenses={expenses} />}
          {activeView === "forecast" && <ForecastTab expenses={expenses} />}
          {activeView === "operations" && (
            <DashboardView
              expenses={expenses}
              loading={status === "loading"}
              operatingCostsOnly
            />
          )}
          {activeView === "reimbursements" && <ReimbursementsPlaceholder />}
          {activeView === "inbox" && <InboxTab />}
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
