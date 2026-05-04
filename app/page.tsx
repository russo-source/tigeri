"use client";

import { useState, useEffect, useCallback } from "react";
import type { Expense, ExpenseInput } from "@/lib/types";
import { Header } from "@/components/Header";
import { MetricCards } from "@/components/MetricCards";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseTable } from "@/components/ExpenseTable";
import { Toast } from "@/components/Toast";

function monthlyEquivalent(e: Expense): number {
  if (e.status !== "Active") return 0;
  if (e.cycle === "Monthly") return e.amount || 0;
  if (e.cycle === "Annual") return (e.amount || 0) / 12;
  return 0;
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  const showToast = useCallback((msg: string, error?: boolean) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadExpenses = useCallback(async (isRefresh = false) => {
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
  }, [showToast]);

  useEffect(() => {
    loadExpenses(false);
  }, [loadExpenses]);

  function openAddForm() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEditForm(expense: Expense) {
    setEditing(expense);
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function toggleForm() {
    if (formOpen) {
      closeForm();
    } else {
      openAddForm();
    }
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
        setExpenses((prev) => prev.map((e) => (e.id === editingId ? data.expense : e)));
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
      closeForm();
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
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="bg-[#f0f4f8] border border-[#e5e7eb] border-l-[3px] border-l-navy rounded-sm px-4 py-3 mb-6 text-[13px]">
          <strong className="text-navy font-semibold">Live dashboard:</strong> Reads
          and writes directly to your Notion database. Add expenses here, sync happens
          automatically.
        </div>

        {errorBanner && (
          <div className="bg-[#fef2f2] border border-[#dc2626] rounded-sm px-4 py-3 mb-4 text-[#dc2626] text-[13px]">
            {errorBanner}
          </div>
        )}

        <MetricCards expenses={expenses} loading={status === "loading"} />
        <CategoryBreakdown expenses={expenses} />
        <ExpenseForm
          open={formOpen}
          editing={editing}
          onToggle={toggleForm}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
        <ExpenseTable
          expenses={expenses}
          onEdit={openEditForm}
          onCancel={handleCancel}
          onRefresh={() => loadExpenses(true)}
          refreshing={refreshing}
          onExport={handleExport}
        />
      </main>
      <Toast message={toast?.msg || null} isError={toast?.error} />
    </>
  );
}
