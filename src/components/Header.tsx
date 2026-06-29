import React, { useState } from "react";
import { 
  ChevronDown, 
  Network, 
  Building, 
  Bell, 
  Moon, 
  Sun, 
  Trash2, 
  Check, 
  AlertCircle,
  Info,
  CheckCircle,
  Volume2
} from "lucide-react";
import { useBrand } from "../context/BrandContext";

interface HeaderProps {
  viewLabel: string;
}

export const Header: React.FC<HeaderProps> = ({ viewLabel }) => {
  const { 
    brands, 
    activeBrand, 
    activeBrandId, 
    setActiveBrandId, 
    loading,
    theme,
    setTheme,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    accentColor,
    setAccentColor
  } = useBrand();

  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500";
    if (activeColor === "rose") return "text-rose-500";
    if (activeColor === "amber") return "text-amber-500";
    return "text-violet-500";
  };

  const getBrandBorderClass = () => {
    if (activeColor === "emerald") return "border-emerald-500/30 focus:border-emerald-500";
    if (activeColor === "rose") return "border-rose-500/30 focus:border-rose-500";
    if (activeColor === "amber") return "border-amber-500/30 focus:border-amber-500";
    return "border-violet-500/30 focus:border-violet-500";
  };

  const getBrandPillBg = () => {
    if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (activeColor === "rose") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    if (activeColor === "amber") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header 
      id="global-header" 
      className={`h-16 border-b sticky top-0 z-30 flex items-center justify-between px-8 transition-colors duration-200 font-sans backdrop-blur-md ${
        isDark 
          ? "border-slate-800 bg-slate-950/90 text-slate-100" 
          : "border-slate-200 bg-white/90 text-slate-800"
      }`}
    >
      {/* View Name Header Title */}
      <div className="flex items-center space-x-3">
        <h2 id="header-view-title" className={`text-sm font-semibold tracking-wide uppercase font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}>
          {viewLabel}
        </h2>
        <span className="text-slate-400">/</span>
        {activeBrand ? (
          <div className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getBrandPillBg()}`}>
            brand: {activeBrand.id}
          </div>
        ) : (
          <div className="animate-pulse bg-slate-700 h-4 w-16 rounded"></div>
        )}
      </div>

      {/* Workspace Brand and Controls */}
      <div className="flex items-center space-x-4">
        
        {/* Accent Color Picker (No Blue Option) */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-md border border-slate-200 dark:border-slate-800/80">
          {(["violet", "emerald", "amber", "rose"] as const).map((color) => {
            const isSelected = activeColor === color;
            const bgClass = {
              violet: "bg-violet-500",
              emerald: "bg-emerald-500",
              amber: "bg-amber-500",
              rose: "bg-rose-500"
            }[color];
            return (
              <button
                key={color}
                onClick={() => {
                  setAccentColor(color);
                }}
                className={`w-3.5 h-3.5 rounded-full transition-transform hover:scale-125 cursor-pointer flex items-center justify-center ${bgClass} ${
                  isSelected ? "ring-2 ring-slate-400 dark:ring-slate-100 scale-110" : "opacity-60 hover:opacity-100"
                }`}
                title={`Accent: ${color}`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
              </button>
            );
          })}
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          id="theme-toggler-btn"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`p-2 rounded-md border transition-colors cursor-pointer ${
            isDark 
              ? "bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800" 
              : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
          }`}
          title={isDark ? "Activate Light Mode" : "Activate Dark Mode"}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            id="notification-bell-trigger"
            onClick={() => setNotifOpen(!notifOpen)}
            className={`p-2 rounded-md border transition-colors relative cursor-pointer ${
              isDark 
                ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800" 
                : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              {/* Overlay list */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setNotifOpen(false)} 
              />
              <div 
                className={`absolute right-0 mt-2 w-80 rounded-lg border shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-100 ${
                  isDark 
                    ? "bg-[#161616] border-slate-800 text-slate-100" 
                    : "bg-white border-slate-200 text-slate-800"
                }`}
              >
                <div className={`px-4 py-2 flex items-center justify-between border-b pb-2 mb-1 text-xs font-mono font-semibold ${
                  isDark ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"
                }`}>
                  <span className="flex items-center">
                    <Volume2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    N.O.K Os System Alerts
                  </span>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => {
                        clearAllNotifications();
                        setNotifOpen(false);
                      }}
                      className="text-rose-500 hover:text-rose-600 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                  {notifications.map((notif) => {
                    const iconColor = {
                      success: "text-emerald-500 bg-emerald-500/10",
                      warning: "text-amber-500 bg-amber-500/10",
                      info: "text-violet-500 bg-violet-500/10"
                    }[notif.type];

                    const Icon = {
                      success: CheckCircle,
                      warning: AlertCircle,
                      info: Info
                    }[notif.type];

                    return (
                      <div 
                        key={notif.id}
                        className={`p-3 text-xs transition-colors relative flex items-start space-x-2.5 ${
                          notif.read ? "opacity-60" : "bg-slate-50/50 dark:bg-slate-900/30"
                        }`}
                      >
                        <span className={`p-1 rounded shrink-0 ${iconColor}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex justify-between items-start">
                            <span className="truncate">{notif.title}</span>
                            <span className="text-[9px] font-mono text-slate-400 ml-1 shrink-0">{notif.timestamp}</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          {!notif.read && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-[9px] font-semibold text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 mt-1 cursor-pointer hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs font-mono">
                      No system notifications
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Real-time Brand Switcher Header Dropdown */}
        <div className="relative">
          <button
            id="brand-switcher-trigger"
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading || brands.length === 0}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-all cursor-pointer select-none ${
              isDark 
                ? "bg-[#161616] border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-slate-100" 
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>{activeBrand ? activeBrand.name : "Select Brand"}</span>
            <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <>
              {/* Overlay Backdrop to close */}
              <div 
                id="brand-switcher-overlay"
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)} 
              />
              {/* Dropdown Menu */}
              <div 
                id="brand-switcher-dropdown"
                className={`absolute right-0 mt-2 w-56 rounded-md border shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-100 ${
                  isDark ? "bg-[#161616] border-slate-800" : "bg-white border-slate-200"
                }`}
              >
                <div className={`px-3 py-1 text-[9px] font-mono tracking-wider uppercase border-b mb-1 ${
                  isDark ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100"
                }`}>
                  Switch Active Brand
                </div>
                {brands.map((brand) => {
                  const isActive = brand.id === activeBrandId;
                  const dotColor = brand.primaryColor === "emerald" 
                    ? "bg-emerald-500" 
                    : brand.primaryColor === "rose" 
                    ? "bg-rose-500"
                    : brand.primaryColor === "amber" 
                    ? "bg-amber-500" 
                    : "bg-violet-500";
                  return (
                    <button
                      id={`switcher-item-${brand.id}`}
                      key={brand.id}
                      onClick={() => {
                        setActiveBrandId(brand.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                        isActive 
                          ? isDark 
                            ? "text-slate-100 bg-slate-800/40 font-semibold" 
                            : "text-slate-950 bg-slate-100 font-semibold"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        <span>{brand.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{brand.domain}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sync status indicator */}
        <div className={`hidden md:flex items-center space-x-1.5 border px-2.5 py-1.5 rounded-md text-[10px] font-mono ${
          isDark ? "bg-slate-900/60 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
        }`}>
          <Network className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>live-syncing</span>
        </div>
      </div>
    </header>
  );
};
