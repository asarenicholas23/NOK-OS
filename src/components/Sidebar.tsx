import React from "react";
import { Link } from "react-router-dom";
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
  LogOut,
  User,
  MessageSquare,
  Sparkles,
  Globe,
  ArrowUpRight
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
  const { activeBrand, user, logout } = useBrand();

  const navigationItems = [
    { id: "dashboard", label: "N.O.K Os Dashboard", icon: LayoutDashboard, category: "Core" },
    { id: "cms", label: "Blog & CMS Manager", icon: Globe, category: "Core" },
    { id: "brands", label: "Brand Registry", icon: Layers, category: "Core" },
    { id: "queue", label: "Campaign Queue", icon: ListOrdered, category: "Operations" },
    { id: "calendar", label: "Content Calendar", icon: Calendar, category: "Operations" },
    { id: "briefs", label: "Creative Briefs", icon: FileText, category: "Operations" },
    { id: "sandbox", label: "Creative Sandbox", icon: Sparkles, category: "Operations" },
    { id: "performance", label: "AI Intelligence", icon: Brain, category: "Intelligence" },
    { id: "insights", label: "Strategic Insights", icon: Lightbulb, category: "Intelligence" },
    { id: "chatbot", label: "AI Creative Partner", icon: MessageSquare, category: "Intelligence" },
    { id: "import", label: "Analytics Import", icon: Database, category: "Data Hub" },
    { id: "directions", label: "Brand Directions", icon: Waypoints, category: "Brand Asset" },
    { id: "guide", label: "Style & Guides", icon: Palette, category: "Brand Asset" },
  ];

  const categories = ["Core", "Operations", "Intelligence", "Data Hub", "Brand Asset"];

  return (
    <aside 
      id="sidebar-container" 
      className={`flex flex-col h-screen fixed top-0 left-0 z-20 font-sans transition-all duration-300 bg-[#15151A] border-r border-[#1C1C22] text-[#F2F0EB] ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Logo Header */}
      <div 
        id="sidebar-logo-area" 
        className="p-4 border-b border-[#1C1C22] flex items-center justify-between"
      >
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="shrink-0 w-8 h-8 rounded-xl neu-pressed flex items-center justify-center text-[#B08D57]">
            <svg width="22" height="22" viewBox="0 0 46 46">
              <circle cx="12" cy="23" r="5" fill="#B08D57"/>
              <circle cx="32" cy="11" r="5" fill="#F2F0EB"/>
              <circle cx="32" cy="35" r="5" fill="#F2F0EB"/>
              <line x1="12" y1="23" x2="32" y2="11" stroke="#B08D57" strokeWidth="2"/>
              <line x1="12" y1="23" x2="32" y2="35" stroke="#B08D57" strokeWidth="2"/>
            </svg>
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300 truncate">
              <h1 className="text-sm font-bold tracking-tight font-display text-[#F2F0EB] leading-none">
                NOK OS
              </h1>
              <p className="text-[9px] text-[#8A8A93] font-mono tracking-wider truncate mt-0.5">
                {activeBrand ? activeBrand.domain : "brand-identity.v2"}
              </p>
            </div>
          )}
        </div>
        <button
          id="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg neu-raised-sm text-[#8A8A93] hover:text-[#F2F0EB] cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* Public Site Navigation Banner Link */}
      {!isCollapsed && (
        <div className="px-3 pt-3">
          <Link
            to="/home"
            className="w-full flex items-center justify-between p-2.5 rounded-xl neu-pressed text-[11px] font-mono font-medium text-[#8A8A93] hover:text-[#B08D57] transition-all group"
          >
            <span className="flex items-center space-x-2">
              <Globe className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Public Agency Site</span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A93] group-hover:text-[#B08D57] transition-colors" />
          </Link>
        </div>
      )}

      {/* Nav Link Lists grouped by categories */}
      <div id="sidebar-nav-scroll" className="flex-1 overflow-y-auto py-3 space-y-5 scrollbar-none px-2">
        {categories.map((cat) => {
          const items = navigationItems.filter(item => item.category === cat);
          return (
            <div key={cat} className="space-y-1">
              {!isCollapsed && (
                <span className="px-3 text-[9px] font-mono font-semibold tracking-wider uppercase block text-[#8A8A93]/70 mb-1">
                  {cat}
                </span>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      id={`nav-btn-${item.id}`}
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center rounded-xl text-xs font-medium transition-all duration-200 text-left cursor-pointer relative ${
                        isCollapsed ? "justify-center p-2.5" : "space-x-3 px-3 py-2"
                      } ${
                        isActive 
                          ? "neu-pressed text-[#B08D57] font-semibold border-l-2 border-[#B08D57]" 
                          : "text-[#8A8A93] hover:text-[#F2F0EB] hover:neu-raised-sm"
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? "text-[#B08D57]" : "text-[#8A8A93]"}`} />
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
        className={`p-3 border-t border-[#1C1C22] bg-[#121216] flex items-center justify-between ${
          isCollapsed ? "flex-col space-y-3 justify-center" : "space-x-2"
        }`}
      >
        <div className="flex items-center min-w-0 space-x-2">
          <div className="w-8 h-8 rounded-xl neu-pressed flex items-center justify-center text-[#B08D57] shrink-0">
            <User className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-medium truncate text-[#F2F0EB]">
                {user?.email || "Workspace Admin"}
              </div>
              <div className="text-[8px] text-emerald-500 font-mono flex items-center space-x-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{user?.email ? "Authenticated" : "NOK Workspace"}</span>
              </div>
            </div>
          )}
        </div>
        <button 
          id="logout-action"
          onClick={logout}
          className="p-1.5 text-[#8A8A93] hover:text-rose-400 rounded-lg neu-raised-sm hover:neu-pressed transition-colors shrink-0 cursor-pointer"
          title="Sign out of workspace"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
