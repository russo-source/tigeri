import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { listInvoices, summarize } from "@/lib/sheets";

export const dynamic = "force-dynamic";

const MODEL = process.env.CHAT_MODEL || "claude-opus-4-8";

function fmtUSD(n: number): string {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Chat isn't configured yet — set ANTHROPIC_API_KEY." },
        { status: 503 }
      );
    }
    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const invoices = await listInvoices();
    const s = summarize(invoices);
    const timCount = invoices.filter((i) => i.paidBy === "Tim").length;
    const russoCount = invoices.filter((i) => i.paidBy === "Russo").length;
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const data = `You are a finance assistant for Tigeri AI. Answer the user's question using ONLY the data below. If the answer isn't in this data, say you don't have that information — never guess or use outside knowledge. Be concise and cite exact figures. Today is ${today}.

REIMBURSEMENT SUMMARY (USD):
- Total spend: ${fmtUSD(s.total)} across ${s.count} invoices
- Paid by Tim: ${fmtUSD(s.byPerson.Tim || 0)} across ${timCount} invoices
- Paid by Russo: ${fmtUSD(s.byPerson.Russo || 0)} across ${russoCount} invoices
- Tim owes Russo (pending reimbursements): ${fmtUSD(s.owedToRusso)} across ${s.pendingCount} invoices
- Already reimbursed to Russo: ${fmtUSD(s.settledAmount)}
(Reimbursement rule: Tim reimburses Russo's out-of-pocket costs monthly on the 15th. "Pending" = Tim still owes; "Tim" in the reimbursed field = already settled.)

SALARY:
- Russo's salary is $2,000/month, paid in USDC on the 15th. April 2026: paid (Apr 15). May 2026: paid (May 19). June 2026: due (Jun 15).

INVOICES (JSON array):
${JSON.stringify(
      invoices.map((i) => ({
        vendor: i.vendor,
        description: i.description,
        date: i.date,
        paidBy: i.paidBy,
        amountUSD: i.amountUSD,
        currency: i.currency,
        origAmount: i.origAmount,
        status: i.status,
        reimbursed: i.reimbursed,
        invoiceNo: i.invoiceNo,
      }))
    )}`;

    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [{ type: "text", text: data, cache_control: { type: "ephemeral" } }],
      messages: messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? ""),
      })),
    });

    const answer = resp.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
      .trim();

    return NextResponse.json({ answer: answer || "(no answer)" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Chat failed" }, { status: 500 });
  }
}
