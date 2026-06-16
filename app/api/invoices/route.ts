import { NextResponse } from "next/server";
import { listInvoices, summarize, markReimbursed } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = await listInvoices();
    return NextResponse.json({ invoices, summary: summarize(invoices) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to read sheet" }, { status: 500 });
  }
}

// Mark an invoice's reimbursement status: { row: number, reimbursed: "Tim" | "Pending" | "" }
export async function POST(req: Request) {
  try {
    const { row, reimbursed } = await req.json();
    if (typeof row !== "number") {
      return NextResponse.json({ error: "row (number) is required" }, { status: 400 });
    }
    await markReimbursed(row, String(reimbursed ?? ""));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Write failed" }, { status: 500 });
  }
}
