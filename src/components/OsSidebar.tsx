import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Layers,
  Inbox,
  Newspaper,
  Activity,
  Lightbulb,
  Compass,
  Bot,
  Sparkles,
  UploadCloud,
  BookOpen,
  Globe,
  X
} from "lucide-react";

export interface OsNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Sidebar navigation, grouped; a divider separates the groups.
export const OS_NAV: { group: string; items: OsNavItem[] }[] = [
  {
    group: "Workspace",
    items: [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "calendar", label: "Content Calendar", icon: CalendarDays },
      { id: "brands", label: "Brands", icon: Layers },
      { id: "leads", label: "Resource Leads", icon: Inbox }
    ]
  },
  {
    group: "Sales & Site",
    items: [{ id: "cms", label: "CMS & Sales", icon: Newspaper }]
  },
  {
    group: "Intelligence",
    items: [
      { id: "performance", label: "AI Intelligence", icon: Activity },
      { id: "insights", label: "Insights", icon: Lightbulb },
      { id: "directions", label: "Directions", icon: Compass },
      { id: "chatbot", label: "AI Partner", icon: Bot },
      { id: "sandbox", label: "Creative Sandbox", icon: Sparkles },
      { id: "import", label: "Analytics Import", icon: UploadCloud },
      { id: "guide", label: "Style & Guides", icon: BookOpen }
    ]
  }
];

export const groupOfView = (viewId: string) =>
  OS_NAV.find((g) => g.items.some((i) => i.id === viewId))?.group ?? "Workspace";

export const NokMark: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 46 46" aria-hidden="true">
    <circle cx="12" cy="23" r="5" fill="#B08D57" />
    <circle cx="32" cy="11" r="5" fill="currentColor" />
    <circle cx="32" cy="35" r="5" fill="currentColor" />
    <line x1="12" y1="23" x2="32" y2="11" stroke="#B08D57" strokeWidth="2" />
    <line x1="12" y1="23" x2="32" y2="35" stroke="#B08D57" strokeWidth="2" />
  </svg>
);

interface OsSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean; // desktop icon-rail mode
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const OsSidebar: React.FC<OsSidebarProps> = ({ activeView, onNavigate, collapsed, mobileOpen, onCloseMobile }) => {
  const nav = (
    <nav className="flex-1 overflow-y-auto fin-scrollbar px-3 py-4 space-y-3" aria-label="Workspace">
      {OS_NAV.map((group, gi) => (
        <div key={group.group} className={gi > 0 ? "pt-3 border-t border-[var(--fin-line)]" : ""}>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    id={`nav-btn-${item.id}`}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`w-full flex items-center gap-3 rounded-xl text-[13px] font-medium cursor-pointer ${
                      collapsed ? "lg:justify-center lg:px-0 px-3 py-2.5" : "px-3 py-2.5"
                    } ${active ? "fin-nav-item fin-nav-item-active font-semibold" : "fin-nav-item"}`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className={`h-16 flex items-center gap-2.5 shrink-0 px-5 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
      <div className="w-9 h-9 rounded-xl bg-[var(--fin-track)] flex items-center justify-center text-[var(--fin-ink)] shrink-0">
        <NokMark />
      </div>
      <div className={collapsed ? "lg:hidden" : ""}>
        <div className="font-display font-bold text-[15px] leading-none text-[var(--fin-ink)]">NOK OS</div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--fin-faint)] mt-1">NOK Social</div>
      </div>
    </div>
  );

  const footer = (
    <div className="px-3 py-3 border-t border-[var(--fin-line)] shrink-0">
      <Link
        to="/home"
        title={collapsed ? "Agency website" : undefined}
        className={`fin-nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
      >
        <Globe className="w-[18px] h-[18px] shrink-0" />
        <span className={collapsed ? "lg:hidden" : ""}>Agency website</span>
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={`fin-sidebar hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-[width] duration-200 ${
          collapsed ? "w-[76px]" : "w-[248px]"
        }`}
      >
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)]" onClick={onCloseMobile} />
          <aside className="fin-sidebar relative w-[264px] max-w-[85vw] h-full flex flex-col animate-in slide-in-from-left duration-200">
            <button
              onClick={onCloseMobile}
              className="fin-iconbtn absolute top-4 right-3 w-8 h-8"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
            {brand}
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
};

export default OsSidebar;
