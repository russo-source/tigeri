import { NextRequest, NextResponse } from "next/server";
import { updateExpense, cancelExpense } from "@/lib/notion";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const expense = await updateExpense(params.id, body);
    return NextResponse.json({ expense });
  } catch (err: any) {
    console.error("PATCH /api/expenses/[id] failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await cancelExpense(params.id);
    return NextResponse.json({ expense });
  } catch (err: any) {
    console.error("DELETE /api/expenses/[id] failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel expense" },
      { status: 500 }
    );
  }
}
