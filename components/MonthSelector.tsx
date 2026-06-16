"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  active: string;
  onChange: (id: string) => void;
}

const OPTIONS = ["All Time", "Jun 2026", "May 2026", "Apr 2026", "Mar 2026"];

export function MonthSelector({ active, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-colors duration-150"
        style={{
          background: "var(--bg-base)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
        }}
      >
        <span style={{ color: "var(--text-muted)" }}>Month:</span>
        <span>{active}</span>
        <span
          className="font-mono text-[10px] transition-transform duration-150"
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 z-40 min-w-[160px] rounded-md overflow-hidden"
          style={{
            background: "var(--bg-overlay)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 8px 24px rgba(20, 20, 63, 0.14)",
          }}
        >
          {OPTIONS.map((opt) => {
            const isActive = opt === active;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-[13px] transition-colors duration-150"
                style={{
                  background: isActive ? "var(--bg-surface)" : "transparent",
                  color: isActive
                    ? "var(--action-primary)"
                    : "var(--text-secondary)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
