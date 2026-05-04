import { NextRequest, NextResponse } from "next/server";
import { listExpenses, createExpense } from "@/lib/notion";
import type { ExpenseInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const expenses = await listExpenses();
    return NextResponse.json({ expenses });
  } catch (err: any) {
    console.error("GET /api/expenses failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExpenseInput;
    if (!body.name || !body.category || !body.cycle || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const expense = await createExpense(body);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/expenses failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create expense" },
      { status: 500 }
    );
  }
}
