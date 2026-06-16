"use client";

interface Props {
  active: string;
  onChange: (id: string) => void;
}

const TABS = [
  { id: "all", label: "All" },
  { id: "Tim", label: "Tim" },
  { id: "Russo", label: "Russo" },
];

export function ProfileTabs({ active, onChange }: Props) {
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-pill"
      style={{ background: "var(--bg-raised)" }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-overlay)"; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            className="px-4 py-1.5 rounded-pill text-[13px] font-medium transition-all duration-150"
            style={
              isActive
                ? {
                    background: "var(--bg-overlay)",
                    color: "var(--text-primary)",
                    boxShadow: "0 1px 3px rgba(20, 20, 63, 0.12)",
                  }
                : {
                    background: "transparent",
                    color: "var(--text-secondary)",
                  }
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
