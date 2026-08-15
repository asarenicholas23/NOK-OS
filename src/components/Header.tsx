import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ChevronDown, 
  Network, 
  Building, 
  Bell, 
  Trash2, 
  AlertCircle,
  Info,
  CheckCircle,
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
      className="h-16 border-b border-[#1C1C22] sticky top-0 z-30 flex items-center justify-between px-6 sm:px-8 bg-[#15151A]/90 backdrop-blur-md text-[#F2F0EB]"
    >
      {/* View Name Header Title */}
      <div className="flex items-center space-x-3">
        <h2 id="header-view-title" className="text-xs sm:text-sm font-bold tracking-wide uppercase font-display text-[#F2F0EB]">
          {viewLabel}
        </h2>
        <span className="text-[#8A8A93]">/</span>
        {activeBrand ? (
          <div className="px-2.5 py-1 rounded-lg text-[10px] font-mono text-[#B08D57] bg-[#1C1C22] neu-pressed">
            brand: {activeBrand.id}
          </div>
        ) : (
          <div className="animate-pulse bg-[#1C1C22] h-5 w-20 rounded-lg"></div>
        )}
      </div>

      {/* Workspace Controls */}
      <div className="flex items-center space-x-3">
        {/* Day / Night Mode Switcher */}
        <button
          id="os-theme-switcher"
          onClick={toggleTheme}
          className="neu-raised-sm p-2 rounded-xl text-xs font-mono text-[#8A8A93] hover:text-[#B08D57] flex items-center space-x-1.5 cursor-pointer"
          title={theme === "dark" ? "Switch to Day Mode (Light Cream)" : "Switch to Night Mode (Dark/Black)"}
          aria-label={theme === "dark" ? "Switch to Day Mode" : "Switch to Night Mode"}
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#C5A065]" />
              <span className="hidden lg:inline text-[11px]">Day Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#8C6428]" />
              <span className="hidden lg:inline text-[11px]">Night Mode</span>
            </>
          )}
        </button>

        {/* Link back to public site */}
        <Link
          to="/home"
          className="neu-raised-sm px-3 py-1.5 rounded-xl text-xs font-mono text-[#8A8A93] hover:text-[#B08D57] flex items-center space-x-1.5"
          title="Return to NOK Social Agency Site"
        >
          <Globe className="w-3.5 h-3.5 text-[#B08D57]" />
          <span className="hidden md:inline">Agency Site</span>
        </Link>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            id="notification-bell-trigger"
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl neu-raised-sm text-[#8A8A93] hover:text-[#F2F0EB] relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#B08D57] text-[#15151A] text-[9px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setNotifOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl neu-raised-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 flex items-center justify-between border-b border-white/5 mb-2 text-xs font-mono font-semibold text-[#8A8A93]">
                  <span className="flex items-center text-[#B08D57]">
                    <Volume2 className="w-3.5 h-3.5 mr-1.5 text-[#B08D57]" />
                    NOK OS System Alerts
                  </span>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => {
                        clearAllNotifications();
                        setNotifOpen(false);
                      }}
                      className="text-rose-400 hover:text-rose-300 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.map((notif) => {
                    return (
                      <div 
                        key={notif.id}
                        className={`p-2.5 rounded-xl text-xs transition-colors relative flex items-start space-x-2.5 neu-pressed ${
                          notif.read ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#F2F0EB] flex justify-between items-start">
                            <span className="truncate">{notif.title}</span>
                            <span className="text-[9px] font-mono text-[#8A8A93] ml-1 shrink-0">{notif.timestamp}</span>
                          </div>
                          <p className="text-[#8A8A93] text-[11px] mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          {!notif.read && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-[9px] font-semibold text-[#B08D57] hover:underline mt-1 cursor-pointer"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-[#8A8A93] text-xs font-mono">
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
            className="flex items-center space-x-2 px-3 py-2 rounded-xl neu-raised-sm text-xs font-medium text-[#F2F0EB] cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>{activeBrand ? activeBrand.name : "Select Brand"}</span>
            <ChevronDown className={`w-3 h-3 text-[#8A8A93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
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
                className="absolute right-0 mt-2 w-56 rounded-2xl neu-raised-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
              >
                <div className="px-3 py-1 text-[9px] font-mono tracking-wider uppercase text-[#8A8A93] border-b border-white/5 mb-1">
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
                          ? "neu-pressed text-[#B08D57] font-semibold" 
                          : "text-[#8A8A93] hover:text-[#F2F0EB] hover:neu-raised-sm"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-[#B08D57]" />
                        <span>{brand.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#8A8A93]">{brand.domain}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sync status indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl neu-pressed text-[10px] font-mono text-[#8A8A93]">
          <Network className="w-3 h-3 text-[#B08D57] animate-pulse" />
          <span>live-sync</span>
        </div>
      </div>
    </header>
  );
};


