"use client";

import { useState } from "react";
import type { Expense, ExpenseInput } from "@/lib/types";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseTable } from "./ExpenseTable";

interface Props {
  expenses: Expense[];
  onSubmit: (input: ExpenseInput, editingId: string | null) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onRefresh: () => void;
  refreshing: boolean;
  onExport: () => void;
}

export function ExpensesTab({
  expenses,
  onSubmit,
  onCancel,
  onRefresh,
  refreshing,
  onExport,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  function openAddForm() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEditForm(expense: Expense) {
    setEditing(expense);
    setFormOpen(true);
    window.scrollTo({ top: 200, behavior: "smooth" });
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function toggleForm() {
    if (formOpen) closeForm();
    else openAddForm();
  }

  async function handleSubmit(input: ExpenseInput, editingId: string | null) {
    try {
      await onSubmit(input, editingId);
      closeForm();
    } catch {
      // toast handled upstream
    }
  }

  return (
    <>
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
        onCancel={onCancel}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onExport={onExport}
      />
    </>
  );
}
