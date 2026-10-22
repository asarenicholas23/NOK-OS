import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Network,
  Building,
  Bell,
  Trash2,
  Volume2,
  Globe,
  Sun,
  Moon
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
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    theme,
    setTheme
  } = useBrand();

  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      id="global-header"
      className="h-16 sticky top-0 z-30 flex items-center justify-between px-5 sm:px-8 bg-white/85 backdrop-blur-md border-b border-[#ECEDF3] text-[#111827]"
    >
      {/* View Name Header Title */}
      <div className="flex items-center space-x-3">
        <h2 id="header-view-title" className="text-sm font-bold tracking-tight text-[#111827]">
          {viewLabel}
        </h2>
        <span className="text-[#D0D3DE]">/</span>
        {activeBrand ? (
          <div className="px-2.5 py-1 rounded-full text-[10px] font-semibold fin-badge-accent">
            brand: {activeBrand.id}
          </div>
        ) : (
          <div className="animate-pulse bg-[#F0F1F5] h-5 w-20 rounded-full"></div>
        )}
      </div>

      {/* Workspace Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Day / Night Mode Switcher */}
        <button
          id="os-theme-switcher"
          onClick={toggleTheme}
          className="fin-btn-ghost p-2 rounded-full text-[#667085] flex items-center cursor-pointer"
          title={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
          aria-label={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Link back to public site */}
        <Link
          to="/home"
          className="fin-btn-ghost px-3 py-2 rounded-full text-xs font-medium text-[#667085] hover:text-[#4F46E5] flex items-center space-x-1.5"
          title="Return to N.O.K Social Agency Site"
        >
          <Globe className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span className="hidden md:inline">Agency Site</span>
        </Link>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            id="notification-bell-trigger"
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-full fin-btn-ghost text-[#667085] relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#4F46E5] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl fin-card p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 flex items-center justify-between border-b border-[#ECEDF3] mb-2 text-xs font-semibold text-[#667085]">
                  <span className="flex items-center text-[#4F46E5]">
                    <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                    NOK OS System Alerts
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

                <div className="max-h-64 overflow-y-auto space-y-2 fin-scrollbar">
                  {notifications.map((notif) => {
                    return (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl text-xs transition-colors relative flex items-start space-x-2.5 fin-inset ${
                          notif.read ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#111827] flex justify-between items-start">
                            <span className="truncate">{notif.title}</span>
                            <span className="text-[9px] text-[#98A2B3] ml-1 shrink-0">{notif.timestamp}</span>
                          </div>
                          <p className="text-[#667085] text-[11px] mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          {!notif.read && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-[9px] font-semibold text-[#4F46E5] hover:underline mt-1 cursor-pointer"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-[#98A2B3] text-xs">
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
            className="flex items-center space-x-2 px-3 py-2 rounded-full fin-btn-ghost text-xs font-semibold text-[#111827] cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>{activeBrand ? activeBrand.name : "Select Brand"}</span>
            <ChevronDown className={`w-3 h-3 text-[#98A2B3] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen && (
            <>
              <div
                id="brand-switcher-overlay"
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <div
                id="brand-switcher-dropdown"
                className="absolute right-0 mt-2 w-56 rounded-2xl fin-card p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
              >
                <div className="px-3 py-1 text-[9px] tracking-[0.12em] uppercase text-[#98A2B3] border-b border-[#ECEDF3] mb-1">
                  Switch Active Brand
                </div>
                {brands.map((brand) => {
                  const isActive = brand.id === activeBrandId;
                  return (
                    <button
                      id={`switcher-item-${brand.id}`}
                      key={brand.id}
                      onClick={() => {
                        setActiveBrandId(brand.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? "fin-badge-accent font-semibold"
                          : "text-[#667085] hover:text-[#111827] hover:bg-[#F0F1F5]"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
                        <span>{brand.name}</span>
                      </div>
                      <span className="text-[9px] text-[#98A2B3]">{brand.domain}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sync status indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-full fin-inset text-[10px] font-medium text-[#667085]">
          <Network className="w-3 h-3 text-[#4F46E5] animate-pulse" />
          <span>live-sync</span>
        </div>
      </div>
    </header>
  );
};
