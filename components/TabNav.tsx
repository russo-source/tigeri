"use client";

interface TabDef {
  id: string;
  label: string;
}

interface Props {
  tabs: TabDef[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function TabNav({ tabs, activeTab, onChange }: Props) {
  return (
    <nav className="bg-white border-b border-[#e5e7eb] sticky top-0 z-30">
      <div className="max-w-[1280px] mx-auto px-6 flex overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`
                font-mono text-[11px] font-medium uppercase tracking-[0.05em]
                px-5 py-4 transition-colors duration-150
                relative whitespace-nowrap
                ${
                  isActive
                    ? "text-navy"
                    : "text-[#6b7280] hover:text-navy hover:bg-[#f8f9fa]"
                }
              `}
            >
              {tab.label}
              {isActive && (
                <span
                  className="absolute left-0 right-0 bg-navy"
                  style={{ height: "2px", bottom: "-1px" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
