"use client";

import { useState, useEffect } from "react";
import type { Expense, ExpenseInput } from "@/lib/types";
import { CATEGORIES, BILLING_CYCLES, STATUSES, ACCOUNTS } from "@/lib/types";

interface Props {
  open: boolean;
  editing: Expense | null;
  onToggle: () => void;
  onSubmit: (input: ExpenseInput, editingId: string | null) => Promise<void>;
  onCancel: () => void;
}

export function ExpenseForm({ open, editing, onToggle, onSubmit, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ExpenseInput>({
    name: "",
    vendor: "",
    category: "Infrastructure",
    account: "tigeri.ai",
    amount: 0,
    cycle: "Monthly",
    renewal: "",
    status: "Active",
    notes: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        vendor: editing.vendor,
        category: editing.category,
        account: editing.account,
        amount: editing.amount,
        cycle: editing.cycle,
        renewal: editing.renewal,
        status: editing.status,
        notes: editing.notes,
      });
    } else if (!open) {
      setForm({
        name: "",
        vendor: "",
        category: "Infrastructure",
        account: "tigeri.ai",
        amount: 0,
        cycle: "Monthly",
        renewal: "",
        status: "Active",
        notes: "",
      });
    }
  }, [editing, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form, editing?.id || null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="ts-card mb-4 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center px-4 py-3 font-semibold text-left transition-colors duration-150"
        style={{
          background: open ? "var(--color-navy)" : "var(--color-white)",
          color: open ? "var(--color-white)" : "var(--color-navy)",
        }}
      >
        <span>{editing ? "EDIT EXPENSE" : "ADD EXPENSE"}</span>
        <span
          className="font-mono text-[11px] transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="p-6 border-t border-[#e5e7eb]">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="ts-label">Name</label>
              <input
                className="ts-input"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="ts-label">Vendor</label>
              <input
                className="ts-input"
                type="text"
                value={form.vendor || ""}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              />
            </div>
            <div>
              <label className="ts-label">Category</label>
              <select
                className="ts-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ts-label">Account / Domain</label>
              <select
                className="ts-select"
                value={form.account || ""}
                onChange={(e) => setForm({ ...form, account: e.target.value as any })}
              >
                {ACCOUNTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ts-label">Amount (USD)</label>
              <input
                className="ts-input"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <label className="ts-label">Billing Cycle</label>
              <select
                className="ts-select"
                value={form.cycle}
                onChange={(e) => setForm({ ...form, cycle: e.target.value as any })}
                required
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="ts-label">Next Renewal / Purchase Date</label>
              <input
                className="ts-input"
                type="date"
                value={form.renewal || ""}
                onChange={(e) => setForm({ ...form, renewal: e.target.value })}
              />
            </div>
            <div>
              <label className="ts-label">Status</label>
              <select
                className="ts-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="ts-label">Notes</label>
              <textarea
                className="ts-textarea"
                rows={2}
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex gap-3 mt-4">
              <button
                type="submit"
                className="ts-btn ts-btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="ts-loader mr-2" /> Saving
                  </>
                ) : editing ? (
                  "Update in Notion"
                ) : (
                  "Save to Notion"
                )}
              </button>
              <button
                type="button"
                className="ts-btn ts-btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
