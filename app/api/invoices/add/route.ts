import { NextResponse } from "next/server";
import { addInvoice } from "@/lib/sheets";

export const dynamic = "force-dynamic";

// Accepts multipart/form-data: the PDF in "file" + the invoice fields.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required" }, { status: 400 });
    }
    const fileBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const s = (k: string) => String(form.get(k) ?? "");
    const n = (k: string) => Number(form.get(k) ?? 0) || 0;

    const result = await addInvoice({
      paidBy: s("paidBy"),
      period: s("period"),
      vendor: s("vendor"),
      description: s("description"),
      invoiceNo: s("invoiceNo"),
      date: s("date"),
      status: s("status"),
      origAmount: n("origAmount"),
      currency: s("currency"),
      amountUSD: n("amountUSD"),
      reimbursed: s("reimbursed"),
      filename: file.name,
      mimeType: file.type || "application/pdf",
      fileBase64,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Add failed" }, { status: 500 });
  }
}
