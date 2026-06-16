import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const MODEL = process.env.EXTRACT_MODEL || process.env.CHAT_MODEL || "claude-opus-4-8";

const PROMPT = `You are extracting structured data from a single invoice or receipt document.
Return ONLY a JSON object (no markdown, no commentary) with EXACTLY these keys:
{
  "vendor": string,        // company that issued it, e.g. "Anthropic", "Hostinger"
  "business": string,      // the customer/buyer business if clearly named on the document; otherwise ""
  "description": string,   // short line item, e.g. "API credit (one-time)", "KVM 2 VPS"
  "invoiceNo": string,     // invoice/receipt/order number; "" if none
  "date": string,          // issue or charge date as YYYY-MM-DD
  "status": string,        // e.g. "Paid"; "" if not stated
  "origAmount": number,    // grand total in the original currency, number only (no symbols/commas)
  "currency": string,      // 3-letter ISO code, e.g. "USD", "SGD", "INR"
  "amountUSD": number      // grand total in USD; if currency is USD this equals origAmount; if not and no USD figure is shown, use 0
}
Use "" or 0 for anything not present. Do NOT invent a business name that isn't on the document.`;

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Auto-read isn't configured (set ANTHROPIC_API_KEY)." }, { status: 503 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required" }, { status: 400 });
    }
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const isPdf = (file.type || "").includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
    const docBlock: any = isPdf
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
      : { type: "image", source: { type: "base64", media_type: file.type || "image/png", data: b64 } };

    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: [docBlock, { type: "text", text: PROMPT }] as any }],
    });

    const text = resp.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const jsonStr = start >= 0 && end > start ? text.slice(start, end + 1) : text;
    let data: any;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "Could not read this document" }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Auto-read failed" }, { status: 500 });
  }
}
