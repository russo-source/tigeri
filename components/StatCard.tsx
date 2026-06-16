"use client";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  gradient?: boolean;
}

export function StatCard({ label, value, sub, gradient }: Props) {
  if (gradient) {
    return (
      <div
        className="rounded-lg p-6 text-white"
        style={{
          background:
            "linear-gradient(135deg, #3537D7 0%, #55ADE5 50%, #1AA9A4 100%)",
        }}
      >
        <div
          className="font-mono uppercase opacity-80"
          style={{ fontSize: "10px", letterSpacing: "0.14em" }}
        >
          {label}
        </div>
        <div className="font-semibold mt-2" style={{ fontSize: "28px" }}>
          {value}
        </div>
        {sub && (
          <div className="font-mono opacity-80 mt-1" style={{ fontSize: "11px" }}>
            {sub}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ts-card p-6">
      <div className="ts-label">{label}</div>
      <div
        className="font-semibold mt-2"
        style={{ fontSize: "28px", color: "var(--text-primary)" }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="font-mono mt-1"
          style={{ fontSize: "11px", color: "var(--text-muted)" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
