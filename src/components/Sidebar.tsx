import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  Calendar,
  Brain,
  Database,
  Waypoints,
  Lightbulb,
  Palette,
  LogOut,
  User,
  MessageSquare,
  Sparkles,
  Globe,
  ArrowUpRight,
  Inbox,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useBrand } from "../context/BrandContext";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const navigationItems = [
  { id: "dashboard", label: "N.O.K Os Dashboard", icon: LayoutDashboard, category: "Core" },
  { id: "cms", label: "Blog & CMS Manager", icon: Globe, category: "Core" },
  { id: "brands", label: "Brand Registry", icon: Layers, category: "Core" },
  { id: "leads", label: "Resource Leads", icon: Inbox, category: "Core" },
  { id: "calendar", label: "Content Calendar & Briefs", icon: Calendar, category: "Operations" },
  { id: "sandbox", label: "Creative Sandbox", icon: Sparkles, category: "Operations" },
  { id: "performance", label: "AI Intelligence", icon: Brain, category: "Intelligence" },
  { id: "insights", label: "Strategic Insights", icon: Lightbulb, category: "Intelligence" },
  { id: "chatbot", label: "AI Creative Partner", icon: MessageSquare, category: "Intelligence" },
  { id: "import", label: "Analytics Import", icon: Database, category: "Data Hub" },
  { id: "directions", label: "Brand Directions", icon: Waypoints, category: "Brand Asset" },
  { id: "guide", label: "Style & Guides", icon: Palette, category: "Brand Asset" },
];

const categories = ["Core", "Operations", "Intelligence", "Data Hub", "Brand Asset"];

const NokMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" viewBox="0 0 46 46" className={className}>
    <circle cx="12" cy="23" r="5" fill="#ffffff" />
    <circle cx="32" cy="11" r="5" fill="#C7D2FE" />
    <circle cx="32" cy="35" r="5" fill="#C7D2FE" />
    <line x1="12" y1="23" x2="32" y2="11" stroke="#ffffff" strokeWidth="2" />
    <line x1="12" y1="23" x2="32" y2="35" stroke="#ffffff" strokeWidth="2" />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isCollapsed,
  setIsCollapsed
}) => {
  const { activeBrand, user, logout } = useBrand();

  /* ---------------------------------------------------------------- *
   *  COLLAPSED — floating icon-only capsule rail                     *
   * ---------------------------------------------------------------- */
  if (isCollapsed) {
    return (
      <aside
        id="sidebar-container"
        className="fixed top-3 bottom-3 left-3 z-20 w-[64px] flex flex-col gap-3 font-sans"
      >
        {/* Logo + public-site capsule */}
        <div className="fin-card-sm p-2 flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white shadow-[0_10px_22px_-10px_rgba(79,70,229,0.7)]">
            <NokMark />
          </div>
          <Link to="/" className="fin-rail-icon" title="Public Agency Site">
            <Globe className="w-4 h-4" />
          </Link>
        </div>

        {/* Nav capsules, one per category */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 fin-scrollbar -mr-1 pr-1">
          {categories.map((cat) => {
            const items = navigationItems.filter((item) => item.category === cat);
            return (
              <div key={cat} className="fin-card-sm p-2 flex flex-col items-center gap-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      id={`nav-btn-${item.id}`}
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={isActive ? "fin-rail-icon-active" : "fin-rail-icon"}
                      title={item.label}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Bottom capsule — expand + account + logout */}
        <div className="fin-card-sm p-2 flex flex-col items-center gap-1 shrink-0">
          <button
            id="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(false)}
            className="fin-rail-icon"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="fin-rail-icon text-[#4F46E5]" title={user?.email || "Workspace Admin"}>
            <User className="w-4 h-4" />
          </div>
          <button
            id="logout-action"
            onClick={logout}
            className="fin-rail-icon hover:text-rose-500 hover:bg-rose-50"
            title="Sign out of workspace"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  /* ---------------------------------------------------------------- *
   *  EXPANDED — floating rounded panel with labels                   *
   * ---------------------------------------------------------------- */
  return (
    <aside
      id="sidebar-container"
      className="fixed top-3 bottom-3 left-3 z-20 w-64 font-sans"
    >
      <div className="fin-card h-full flex flex-col overflow-hidden text-[#111827]">
        {/* Brand Logo Header */}
        <div id="sidebar-logo-area" className="p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="shrink-0 w-9 h-9 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white shadow-[0_10px_22px_-10px_rgba(79,70,229,0.7)]">
              <NokMark />
            </div>
            <div className="animate-in fade-in duration-300 truncate">
              <h1 className="text-sm font-bold tracking-tight text-[#111827] leading-none">NOK OS</h1>
              <p className="text-[10px] text-[#98A2B3] tracking-wide truncate mt-1">
                {activeBrand ? activeBrand.domain : "brand-identity.v2"}
              </p>
            </div>
          </div>
          <button
            id="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-xl fin-btn-ghost text-[#667085] cursor-pointer shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Public Site link */}
        <div className="px-3 pb-2 shrink-0">
          <Link
            to="/"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl fin-inset text-[11px] font-medium text-[#667085] hover:text-[#4F46E5] transition-colors group"
          >
            <span className="flex items-center space-x-2">
              <Globe className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Public Agency Site</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#98A2B3] group-hover:text-[#4F46E5] transition-colors" />
          </Link>
        </div>

        {/* Nav list grouped by category */}
        <div id="sidebar-nav-scroll" className="flex-1 overflow-y-auto py-2 space-y-5 fin-scrollbar px-2">
          {categories.map((cat) => {
            const items = navigationItems.filter((item) => item.category === cat);
            return (
              <div key={cat} className="space-y-1">
                <span className="px-3 text-[9px] font-semibold tracking-[0.14em] uppercase block text-[#98A2B3] mb-1.5">
                  {cat}
                </span>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        id={`nav-btn-${item.id}`}
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-medium transition-all duration-200 text-left cursor-pointer ${
                          isActive ? "fin-nav-item-active font-semibold" : "fin-nav-item"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#98A2B3]"}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User footer */}
        <div id="sidebar-user-footer" className="m-3 p-3 rounded-2xl fin-inset flex items-center justify-between shrink-0">
          <div className="flex items-center min-w-0 space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#4F46E5] shrink-0 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold truncate text-[#111827]">
                {user?.email || "Workspace Admin"}
              </div>
              <div className="text-[9px] text-emerald-600 font-medium flex items-center space-x-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{user?.email ? "Authenticated" : "NOK Workspace"}</span>
              </div>
            </div>
          </div>
          <button
            id="logout-action"
            onClick={logout}
            className="p-2 text-[#98A2B3] hover:text-rose-500 rounded-xl bg-white hover:bg-rose-50 transition-colors shrink-0 cursor-pointer shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
            title="Sign out of workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
