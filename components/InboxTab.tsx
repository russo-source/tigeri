"use client";

export function InboxTab() {
  return (
    <>
      <div className="ts-label">Inbox - Gmail Bill Detection</div>
      <section className="ts-card p-12 mb-8 text-center">
        <div className="max-w-[480px] mx-auto">
          <div className="font-mono text-[11px] text-[#9ca3af] uppercase tracking-wider mb-3">
            Coming Next
          </div>
          <h2 className="text-[24px] font-semibold text-navy mb-4 tracking-tight">
            Detect bills automatically from Gmail
          </h2>
          <p className="text-[14px] text-[#6b7280] leading-relaxed mb-6">
            Once connected, this tab will scan your inbox for invoices and
            receipts from vendors like AWS, Stripe, Anthropic, and Google. Each
            detected bill becomes a one-click candidate to add to your tracker.
            Patterns learn over time so recurring vendors auto-link to existing
            expenses.
          </p>
          <button
            type="button"
            disabled
            className="ts-btn ts-btn-primary"
            style={{ opacity: 0.4, cursor: "not-allowed" }}
          >
            Connect Gmail
          </button>
          <div className="font-mono text-[11px] text-[#9ca3af] uppercase tracking-wider mt-6">
            Available in v2
          </div>
        </div>
      </section>

      <div className="ts-label">What This Will Detect</div>
      <section className="ts-card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {[
            ["Stripe", "Receipts from any subscription billed via Stripe"],
            ["AWS", "Monthly invoices and budget alerts"],
            ["Anthropic", "API usage and Claude Enterprise charges"],
            ["Google", "Workspace and Cloud Platform billing"],
            ["Cloudflare", "Plan renewals and overage charges"],
            ["Hostinger", "VPS billing"],
            ["Notion", "Workspace seat charges"],
            ["Generic invoices", "Anything with 'Invoice', 'Receipt', or amount + due date"],
          ].map(([vendor, desc]) => (
            <div
              key={vendor}
              className="flex items-start gap-3 py-2 border-b border-[#e5e7eb] last:border-b-0"
            >
              <div className="font-mono text-[11px] uppercase tracking-wider text-navy font-medium pt-0.5 min-w-[100px]">
                {vendor}
              </div>
              <div className="text-[13px] text-[#6b7280] flex-1">{desc}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
