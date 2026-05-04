"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Expense, ExpenseInput } from "@/lib/types";
import { Header } from "@/components/Header";
import { TabNav } from "@/components/TabNav";
import { OverviewTab } from "@/components/OverviewTab";
import { ForecastTab } from "@/components/ForecastTab";
import { RenewalsTab } from "@/components/RenewalsTab";
import { ExpensesTab } from "@/components/ExpensesTab";
import { InboxTab } from "@/components/InboxTab";
import { Toast } from "@/components/Toast";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "forecast", label: "Forecast" },
  { id: "renewals", label: "Renewals" },
  { id: "expenses", label: "Expenses" },
  { id: "inbox", label: "Inbox" },
];

function monthlyEquivalent(e: Expense): number {
  if (e.status !== "Active") return 0;
  if (e.cycle === "Monthly") return e.amount || 0;
  if (e.cycle === "Annual") return (e.amount || 0) / 12;
  return 0;
}

function DashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get("tab") || "overview";
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam : "overview";

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

  function changeTab(id: string) {
    router.push(`/?tab=${id}`);
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
    <>
      <Header status={status} syncedAt={syncedAt} />
      <TabNav tabs={TABS} activeTab={activeTab} onChange={changeTab} />
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {errorBanner && (
          <div className="bg-[#fef2f2] border border-[#dc2626] rounded-sm px-4 py-3 mb-4 text-[#dc2626] text-[13px]">
            {errorBanner}
          </div>
        )}

        {activeTab === "overview" && (
          <OverviewTab expenses={expenses} loading={status === "loading"} />
        )}
        {activeTab === "forecast" && <ForecastTab expenses={expenses} />}
        {activeTab === "renewals" && <RenewalsTab expenses={expenses} />}
        {activeTab === "expenses" && (
          <ExpensesTab
            expenses={expenses}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onRefresh={() => loadExpenses(true)}
            refreshing={refreshing}
            onExport={handleExport}
          />
        )}
        {activeTab === "inbox" && <InboxTab />}
      </main>
      <Toast message={toast?.msg || null} isError={toast?.error} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-[12px] uppercase tracking-wider text-[#6b7280]">
          Loading
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
