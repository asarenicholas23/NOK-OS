import React from "react";
import { 
  LayoutDashboard, 
  Layers, 
  ListOrdered, 
  Calendar, 
  Brain, 
  Database, 
  FileText, 
  Waypoints, 
  Lightbulb, 
  Palette,
  Terminal,
  LogOut,
  User,
  ShieldAlert
} from "lucide-react";
import { useBrand } from "../context/BrandContext";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView,
  isCollapsed,
  setIsCollapsed
}) => {
  const { activeBrand, user, logout, theme, accentColor } = useBrand();

  const navigationItems = [
    { id: "dashboard", label: "N.O.K Os Dashboard", icon: LayoutDashboard, category: "Core" },
    { id: "brands", label: "Brand Registry", icon: Layers, category: "Core" },
    { id: "queue", label: "Campaign Queue", icon: ListOrdered, category: "Operations" },
    { id: "calendar", label: "Content Calendar", icon: Calendar, category: "Operations" },
    { id: "briefs", label: "Creative Briefs", icon: FileText, category: "Operations" },
    { id: "performance", label: "AI Intelligence", icon: Brain, category: "Intelligence" },
    { id: "insights", label: "Strategic Insights", icon: Lightbulb, category: "Intelligence" },
    { id: "import", label: "Analytics Import", icon: Database, category: "Data Hub" },
    { id: "directions", label: "Brand Directions", icon: Waypoints, category: "Brand Asset" },
    { id: "guide", label: "Style & Guides", icon: Palette, category: "Brand Asset" },
  ];

  const categories = ["Core", "Operations", "Intelligence", "Data Hub", "Brand Asset"];

  // Accent color mapping based on active brand or custom workspace theme
  const getBrandAccentClass = () => {
    const color = activeBrand?.primaryColor || accentColor || "violet";
    if (color === "emerald") return "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    if (color === "rose") return "border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/10";
    if (color === "amber") return "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10";
    return "border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-500/10";
  };

  const getBrandTextColor = () => {
    const color = activeBrand?.primaryColor || accentColor || "violet";
    if (color === "emerald") return "text-emerald-500";
    if (color === "rose") return "text-rose-500";
    if (color === "amber") return "text-amber-500";
    return "text-violet-500";
  };

  const isDark = theme === "dark";

  return (
    <aside 
      id="sidebar-container" 
      className={`flex flex-col h-screen fixed top-0 left-0 z-20 font-sans transition-all duration-300 border-r ${
        isCollapsed ? "w-16" : "w-64"
      } ${
        isDark 
          ? "bg-[#111] border-slate-800 text-slate-100" 
          : "bg-slate-50 border-slate-200 text-slate-800"
      }`}
    >
      {/* Brand Logo Header */}
      <div 
        id="sidebar-logo-area" 
        className={`p-4 border-b flex items-center justify-between transition-all duration-300 ${
          isDark ? "border-slate-800/60" : "border-slate-200"
        }`}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-slate-900 border border-slate-800 shrink-0 ${getBrandTextColor()}`}>
            {activeBrand ? activeBrand.logoText : "NK"}
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300 truncate">
              <h1 className="text-xs font-semibold tracking-wide truncate">
                {activeBrand ? activeBrand.name : "N.O.K Os"}
              </h1>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider truncate">
                {activeBrand ? activeBrand.domain : "nok-os.control"}
              </p>
            </div>
          )}
        </div>
        <button
          id="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1 rounded-md transition-colors ${
            isDark 
              ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800" 
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          }`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* Nav Link Lists grouped by categories */}
      <div id="sidebar-nav-scroll" className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-none px-2">
        {categories.map((cat) => {
          const items = navigationItems.filter(item => item.category === cat);
          return (
            <div key={cat} className="space-y-1.5">
              {!isCollapsed && (
                <span className={`px-3 text-[10px] font-mono font-semibold tracking-wider uppercase block animate-in fade-in duration-300 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {cat}
                </span>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      id={`nav-btn-${item.id}`}
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center rounded-md text-xs font-medium transition-all duration-200 text-left group relative ${
                        isCollapsed ? "justify-center p-2.5" : "space-x-3 px-3 py-2"
                      } ${
                        isActive 
                          ? `${getBrandAccentClass()} border-l-2 font-semibold` 
                          : isDark 
                            ? "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 shrink-0 ${isActive ? "" : isDark ? "text-slate-500 group-hover:text-slate-300" : "text-slate-400 group-hover:text-slate-600"}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auth Context User Bar */}
      <div 
        id="sidebar-user-footer" 
        className={`p-3 border-t flex items-center justify-between transition-all duration-300 ${
          isCollapsed ? "flex-col space-y-3 justify-center" : "space-x-2"
        } ${
          isDark ? "border-slate-800/60 bg-slate-950/40" : "border-slate-200 bg-slate-100/60"
        }`}
      >
        <div className="flex items-center min-w-0 space-x-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 animate-in fade-in duration-300">
              <div className={`text-[10px] font-medium truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                {user?.email || "Workspace Admin"}
              </div>
              <div className="text-[8px] text-emerald-500 font-mono flex items-center space-x-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{user?.email ? "auth" : "brand"}</span>
              </div>
            </div>
          )}
        </div>
        <button 
          id="logout-action"
          onClick={logout}
          className={`p-1.5 text-slate-500 hover:text-rose-400 rounded-md hover:bg-slate-900 transition-colors shrink-0 ${isCollapsed ? "w-8 h-8 flex items-center justify-center" : ""}`}
          title="Sign out of workspace"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
