"use client";

import { useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How much has Russo spent?",
  "What does Tim owe Russo?",
  "Biggest vendor this month?",
  "Is June salary paid?",
];

export function ChatBar() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMessages((m) => [...m, { role: "assistant", content: data.answer || "(no answer)" }]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠ ${err.message}` }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9 }));
    }
  }

  return (
    <section className="ts-card mb-6 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-md bg-gradient-flywheel shrink-0" />
        <div className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
          Ask about your spend
        </div>
      </div>

      {messages.length > 0 && (
        <div ref={scrollRef} className="mb-3 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "self-end" : "self-start"} style={{ maxWidth: "88%" }}>
              <div
                className="px-3 py-2 rounded-md text-[14px] whitespace-pre-wrap leading-relaxed"
                style={
                  m.role === "user"
                    ? { background: "var(--action-primary)", color: "#fff" }
                    : { background: "var(--bg-surface)", color: "var(--text-primary)" }
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && <div className="ts-mono-meta self-start">Thinking…</div>}
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => ask(sug)}
              className="chip px-3 py-1 rounded-pill text-[12px]"
              style={{ background: "var(--bg-raised)", color: "var(--text-secondary)" }}
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          className="ts-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your invoices, reimbursements, or salary…"
          disabled={loading}
        />
        <button type="submit" className="ts-btn ts-btn-primary" disabled={loading || !input.trim()}>
          {loading ? <span className="ts-loader" /> : "Ask"}
        </button>
      </form>
    </section>
  );
}
