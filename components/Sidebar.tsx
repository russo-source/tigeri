"use client";

interface Props {
  activeView: string;
  onChange: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
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
      { id: "businesses", label: "Businesses" },
      { id: "invoices", label: "Invoices" },
      { id: "reimbursements", label: "Reimbursements" },
      { id: "salary", label: "Salary" },
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

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

const ICONS: Record<string, JSX.Element> = {
  dashboard: (
    <svg {...iconProps}>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </svg>
  ),
  businesses: (
    <svg {...iconProps}>
      <path d="M2.5 14V2.5h7V14" />
      <path d="M9.5 6.5h4V14" />
      <path d="M4.5 5h1M7 5h1M4.5 8h1M7 8h1M4.5 11h1M7 11h1" />
    </svg>
  ),
  invoices: (
    <svg {...iconProps}>
      <path d="M3.5 2h6l3 3v9h-9z" />
      <path d="M9.5 2v3h3" />
      <path d="M6 8.5h4M6 11h4" />
    </svg>
  ),
  reimbursements: (
    <svg {...iconProps}>
      <path d="M12.5 7a4.5 4.5 0 0 0-8.2-2.3" />
      <path d="M3.5 9a4.5 4.5 0 0 0 8.2 2.3" />
      <path d="M4 2.5v2.2h2.2" />
      <path d="M12 13.5v-2.2h-2.2" />
    </svg>
  ),
  salary: (
    <svg {...iconProps}>
      <rect x="2" y="4" width="12" height="8" />
      <circle cx="8" cy="8" r="1.7" />
    </svg>
  ),
  settings: (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.5v2.2M8 12.3v2.2M1.5 8h2.2M12.3 8h2.2M3.3 3.3l1.6 1.6M11.1 11.1l1.6 1.6M12.7 3.3l-1.6 1.6M4.9 11.1l-1.6 1.6" />
    </svg>
  ),
  gethelp: (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="6" />
      <path d="M6.2 6.3c0-1 .8-1.8 1.8-1.8s1.8.7 1.8 1.7c0 1.3-1.8 1.4-1.8 2.6" />
      <path d="M8 11h.01" />
    </svg>
  ),
};

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
      <span className="shrink-0 flex items-center justify-center" style={{ width: 16, height: 16 }}>
        {ICONS[item.id]}
      </span>
      <span className={active ? "font-medium" : ""}>{item.label}</span>
    </button>
  );
}

export function Sidebar({ activeView, onChange, isOpen = false, onClose }: Props) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-30 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(2,1,11,0.55)" }}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`w-[240px] shrink-0 h-screen flex flex-col z-40 transition-transform duration-200
          fixed top-0 left-0 md:sticky md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ background: "#02010B", color: "#EBF0F7" }}
      >
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gradient-flywheel shrink-0" />
          <div className="leading-tight flex-1 min-w-0">
            <div className="font-semibold text-[15px]" style={{ color: "#EBF0F7" }}>
              Tigeri
            </div>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{ color: "#4F4F9B" }}
            >
              Finance Agent
            </div>
          </div>
          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-md"
            style={{ color: "#9AB6DD" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
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
    </>
  );
}
