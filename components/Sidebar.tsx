"use client";

interface Props {
  activeView: string;
  onChange: (id: string) => void;
}

interface NavItem {
  id: string;
  label: string;
}

interface NavGroup {
  eyebrow: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    eyebrow: "Main",
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "invoices", label: "Invoices" },
      { id: "reimbursements", label: "Reimbursements" },
    ],
  },
  {
    eyebrow: "Other",
    items: [
      { id: "settings", label: "Settings" },
      { id: "gethelp", label: "Get Help" },
    ],
  },
];

function NavButton({
  item,
  active,
  onChange,
}: {
  item: NavItem;
  active: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(item.id)}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[14px] transition-colors duration-150 group"
      style={{
        background: active ? "#14143F" : "transparent",
        color: active ? "#FFFFFF" : "#9AB6DD",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "#0A0A27";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: active ? "#3537D7" : "#4F4F9B" }}
      />
      <span className={active ? "font-medium" : ""}>{item.label}</span>
    </button>
  );
}

export function Sidebar({ activeView, onChange }: Props) {
  return (
    <aside
      className="w-[240px] shrink-0 h-screen sticky top-0 flex flex-col"
      style={{ background: "#02010B", color: "#EBF0F7" }}
    >
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-gradient-flywheel shrink-0" />
        <div className="leading-tight">
          <div className="font-semibold text-[15px]" style={{ color: "#EBF0F7" }}>
            Tigeri
          </div>
          <div
            className="font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: "#4F4F9B" }}
          >
            Invoice Tracker
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {GROUPS.map((group) => (
          <div key={group.eyebrow} className="mb-5">
            <div
              className="px-3 mb-2 font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: "#4F4F9B" }}
            >
              {group.eyebrow}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={item.id === activeView}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div
        className="px-4 py-4 flex items-center gap-3"
        style={{ borderTop: "1px solid #14143F" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[14px] shrink-0"
          style={{ background: "#3537D7", color: "#FFFFFF" }}
        >
          R
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: "#EBF0F7" }}>
            Russo Jossy
          </div>
          <div className="text-[11px] truncate" style={{ color: "#7178C2" }}>
            russo@tigeri.ai
          </div>
        </div>
      </div>
    </aside>
  );
}
